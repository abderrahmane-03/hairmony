package hairmony.controller;

import lombok.RequiredArgsConstructor;
import hairmony.service.FaceDetectionService;
import hairmony.service.FaceShapeDetectorService;
import hairmony.service.FaceShapeDetectorService.ClassificationResult;
import org.bytedeco.javacpp.BytePointer;
import org.bytedeco.opencv.opencv_core.*;
import org.springdoc.core.converters.FileSupportConverter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.Arrays;
import java.io.IOException;
import java.util.Base64;

import static org.bytedeco.opencv.global.opencv_core.BORDER_CONSTANT;
import static org.bytedeco.opencv.global.opencv_core.copyMakeBorder;
import static org.bytedeco.opencv.global.opencv_imgcodecs.*;
import static org.bytedeco.opencv.global.opencv_imgproc.INTER_AREA;
import static org.bytedeco.opencv.global.opencv_imgproc.resize;

@RequiredArgsConstructor
@RestController
@RequestMapping("/public")
public class AIController {

    private final FaceDetectionService faceDetectionService;
    private final FaceShapeDetectorService faceShapeDetectorService;
    private final FileSupportConverter fileSupportConverter;

    @PostMapping("/analyze-face")
    public ResponseEntity<FaceAnalysisResponse> analyzeFace(@RequestParam("file") MultipartFile file) {
        try {
            // 1. Decode the raw bytes into an OpenCV Mat
            byte[] bytes = file.getBytes();
            Mat original = imdecode(new Mat(bytes), IMREAD_COLOR);
            if (original.empty()) {
                return ResponseEntity.ok(new FaceAnalysisResponse(
                        "Invalid image or can't decode",
                        Collections.emptyList(),
                        Collections.emptyList(),
                        null,
                        null
                ));
            }

            // 2. Resize with aspect ratio and pad to 600x600
            int original_w = original.cols();
            int original_h = original.rows();
            double scale = Math.min(600.0 / original_w, 600.0 / original_h);
            int new_w = (int)(original_w * scale);
            int new_h = (int)(original_h * scale);

            Mat resized = new Mat();
            resize(original, resized, new Size(new_w, new_h), 0, 0, INTER_AREA);

            int pad_left = (600 - new_w) / 2;
            int pad_right = 600 - new_w - pad_left;
            int pad_top = (600 - new_h) / 2;
            int pad_bottom = 600 - new_h - pad_top;

            Mat padded = new Mat();
            copyMakeBorder(resized, padded, pad_top, pad_bottom, pad_left, pad_right, BORDER_CONSTANT, new Scalar(0, 0, 0, 0));

            // 3. Get forehead tip from Python using the padded image
            byte[] paddedBytes = matToBytes(padded);
            PointDTO pythonForeheadTipPadded = getForeheadTipFromPython(paddedBytes);
            if (pythonForeheadTipPadded == null) {
                return ResponseEntity.ok(new FaceAnalysisResponse(
                        "Failed to get forehead tip from Python",
                        Collections.emptyList(),
                        Collections.emptyList(),
                        null,
                        null
                ));
            }

            // 4. Detect face on the padded image
            Rect faceRect = faceDetectionService.detectFace(padded);
            if (faceRect == null) {
                return ResponseEntity.ok(new FaceAnalysisResponse(
                        "No face detected",
                        Collections.emptyList(),
                        Collections.emptyList(),
                        null,
                        null
                ));
            }

            // 5. Detect landmarks on the padded image
            Point2fVectorVector landmarks = faceShapeDetectorService.detectLandmarks(padded, faceRect);

            // 6. Classify face shape using Python forehead tip
            ClassificationResult localResult = faceShapeDetectorService.classifyFaceShape(
                    landmarks,
                    faceRect,
                    pythonForeheadTipPadded.x(),
                    pythonForeheadTipPadded.y()
            );
            String shape = localResult.shape();

            // 7. Convert landmarks to list of DTOs (in padded 600x600 space initially)
            List<PointDTO> landmarkPointsPadded = new ArrayList<>();
            Point2fVector points = landmarks.get(0);
            for (int i = 0; i < points.size(); i++) {
                Point2f p = points.get(i);
                landmarkPointsPadded.add(new PointDTO(p.x(), p.y()));
            }

            // 8. Map coordinates to original space
            double ratio_x = (double) original_w / new_w;
            double ratio_y = (double) original_h / new_h;

            List<PointDTO> landmarkPointsOriginal = new ArrayList<>();
            for (PointDTO p : landmarkPointsPadded) {
                double x_original = (p.x() - pad_left) * ratio_x;
                double y_original = (p.y() - pad_top) * ratio_y;
                landmarkPointsOriginal.add(new PointDTO(x_original, y_original));
            }

            double rect_x_original = (faceRect.x() - pad_left) * ratio_x;
            double rect_y_original = (faceRect.y() - pad_top) * ratio_y;
            double rect_width_original = faceRect.width() * ratio_x;
            double rect_height_original = faceRect.height() * ratio_y;
            RectDTO originalFaceRect = new RectDTO(
                    (int)rect_x_original, (int)rect_y_original, (int)rect_width_original, (int)rect_height_original
            );

            // Map Python forehead tip to original space
            double forehead_x_original = (pythonForeheadTipPadded.x() - pad_left) * ratio_x;
            double forehead_y_original = (pythonForeheadTipPadded.y() - pad_top) * ratio_y;
            PointDTO originalForeheadTip = new PointDTO(forehead_x_original, forehead_y_original);

            // 9. Recommended hairstyles
            List<String> hairstyles = getRecommendedHairstyles(shape);

            // 10. Build response with original coordinates
            return ResponseEntity.ok(new FaceAnalysisResponse(
                    shape,
                    hairstyles,
                    landmarkPointsOriginal,
                    originalFaceRect,
                    originalForeheadTip
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    private byte[] matToBytes(Mat mat) throws IOException {
        BytePointer buffer = new BytePointer();
        imencode(".jpg", mat, buffer);
        byte[] byteArray = new byte[(int) buffer.capacity()];
        buffer.get(byteArray);
        buffer.deallocate();
        return byteArray;
    }

    /**
     * Sends the image bytes to a Python microservice for an advanced "forehead tip".
     */
    private PointDTO getForeheadTipFromPython(byte[] imageBytes) {
        try {
            String base64Img = Base64.getEncoder().encodeToString(imageBytes);
            String jsonPayload = "{ \"image_base64\": \"" + base64Img + "\" }";

            java.net.http.HttpClient httpClient = java.net.http.HttpClient.newHttpClient();
            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("http://localhost:5000/detect-forehead"))
                    .header("Content-Type", "application/json")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            java.net.http.HttpResponse<String> response =
                    httpClient.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                String respStr = response.body();
                if (respStr.contains("forehead_x") && respStr.contains("forehead_y")) {
                    int fxIndex = respStr.indexOf("forehead_x");
                    int colon1 = respStr.indexOf(":", fxIndex);
                    int comma1 = respStr.indexOf(",", colon1);
                    String fxStr = respStr.substring(colon1 + 1, comma1).trim();
                    fxStr = fxStr.replaceAll("[^0-9.]", "");

                    int fyIndex = respStr.indexOf("forehead_y");
                    int colon2 = respStr.indexOf(":", fyIndex);
                    int close2 = respStr.indexOf("}", colon2);
                    String fyStr = respStr.substring(colon2 + 1, close2).trim();
                    fyStr = fyStr.replaceAll("[^0-9.]", "");

                    double fx = Double.parseDouble(fxStr);
                    double fy = Double.parseDouble(fyStr);
                    return new PointDTO(fx, fy); // Coordinates in 600x600 padded space
                } else {
                    System.err.println("Unexpected response format: " + respStr);
                }
            } else {
                System.err.println("Python com.service returned status: " + response.statusCode());
            }
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        return null; // Fallback handled in main logic
    }

    private List<String> getRecommendedHairstyles(String faceShape) {
        Map<String, List<String>> recommendations = new HashMap<>();
        recommendations.put("oval", Arrays.asList(
                "Classic undercut",
                "Textured quiff",
                "Side part",
                "Pompadour"
        ));

        recommendations.put("round", Arrays.asList(
                "High fade with pompadour",
                "Textured crop",
                "Side-swept undercut",
                "Spiky hair with short sides"
        ));

        recommendations.put("oblong", Arrays.asList(
                "Crew cut",
                "Side part with mid fade",
                "Classic taper",
                "Brush-up hairstyle"
        ));

        recommendations.put("heart", Arrays.asList(
                "Textured fringe",
                "Messy quiff",
                "Medium-length layered cut",
                "Tapered sides with volume on top"
        ));

        recommendations.put("triangle", Arrays.asList(
                "Longer top with short sides",
                "Textured waves",
                "Side-swept fringe",
                "Classic slicked-back style"
        ));

        recommendations.put("square", Arrays.asList(
                "Buzz cut",
                "Undercut with volume",
                "Textured top with a fade",
                "Classic side part"
        ));

        recommendations.put("diamond", Arrays.asList(
                "Messy fringe",
                "Layered medium-length cut",
                "Tapered cut with volume",
                "Tousled waves with fade"
        ));

        return recommendations.getOrDefault(faceShape.toLowerCase(), Collections.emptyList());
    }

    // -----------------------------
    // DTO Records
    // -----------------------------
    public record FaceAnalysisResponse(
            String shape,
            List<String> hairstyles,
            List<PointDTO> landmarks,
            RectDTO faceRect,
            PointDTO foreheadTip
    ) {}

    public record RectDTO(
            int x,
            int y,
            int width,
            int height
    ) {}

    public record PointDTO(
            double x,
            double y
    ) {}
}