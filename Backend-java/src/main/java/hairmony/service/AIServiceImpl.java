package hairmony.service;

import hairmony.dto.FaceAnalysisResponse;
import hairmony.dto.PointDTO;
import hairmony.dto.RectDTO;
import hairmony.entities.Haircuts;
import hairmony.repository.HaircutRepository;
import hairmony.serviceInterfaces.AIServiceInf;
import hairmony.serviceInterfaces.IFaceDetection;
import hairmony.serviceInterfaces.IFaceShapeDetector;
import lombok.RequiredArgsConstructor;
import org.bytedeco.javacpp.BytePointer;
import org.bytedeco.opencv.opencv_core.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;
import java.util.Base64;
import java.util.stream.Collectors;

import static org.bytedeco.opencv.global.opencv_core.*;
import static org.bytedeco.opencv.global.opencv_imgcodecs.*;
import static org.bytedeco.opencv.global.opencv_imgproc.INTER_AREA;
import static org.bytedeco.opencv.global.opencv_imgproc.resize;

@Service
@RequiredArgsConstructor
public class AIServiceImpl implements AIServiceInf {

    private final IFaceDetection faceDetectionService;
    private final IFaceShapeDetector faceShapeDetectorService;
    private final HaircutRepository haircutRepository;

    @Override
    public FaceAnalysisResponse analyzeFace(MultipartFile file) {
        try {
            byte[] bytes = file.getBytes();
            Mat original = imdecode(new Mat(bytes), IMREAD_COLOR);
            if (original.empty()) {
                return new FaceAnalysisResponse(
                        "Invalid image or can't decode",
                        Collections.emptyList(),
                        Collections.emptyList(),
                        null,
                        null
                );
            }

            int original_w = original.cols();
            int original_h = original.rows();
            double scale = Math.min(600.0 / original_w, 600.0 / original_h);
            int new_w = (int) (original_w * scale);
            int new_h = (int) (original_h * scale);

            Mat resized = new Mat();
            resize(original, resized, new Size(new_w, new_h), 0, 0, INTER_AREA);

            int pad_left = (600 - new_w) / 2;
            int pad_right = 600 - new_w - pad_left;
            int pad_top = (600 - new_h) / 2;
            int pad_bottom = 600 - new_h - pad_top;

            Mat padded = new Mat();
            copyMakeBorder(resized, padded, pad_top, pad_bottom, pad_left, pad_right, BORDER_CONSTANT, new Scalar(0, 0, 0, 0));

            byte[] paddedBytes = matToBytes(padded);
            PointDTO pythonForeheadTipPadded = getForeheadTipFromPython(paddedBytes);
            if (pythonForeheadTipPadded == null) {
                return new FaceAnalysisResponse(
                        "Failed to get forehead tip from Python",
                        Collections.emptyList(),
                        Collections.emptyList(),
                        null,
                        null
                );
            }

            Rect faceRect = faceDetectionService.detectFace(padded);
            if (faceRect == null) {
                return new FaceAnalysisResponse(
                        "No face detected",
                        Collections.emptyList(),
                        Collections.emptyList(),
                        null,
                        null
                );
            }

            Point2fVectorVector landmarks = faceShapeDetectorService.detectLandmarks(padded, faceRect);

            var localResult = faceShapeDetectorService.classifyFaceShape(
                    landmarks,
                    faceRect,
                    pythonForeheadTipPadded.x(),
                    pythonForeheadTipPadded.y()
            );
            String shape = localResult.shape();

            //Convert landmarks to list of DTOs (in padded coords)
            List<PointDTO> landmarkPointsPadded = new ArrayList<>();
            Point2fVector points = landmarks.get(0);
            for (int i = 0; i < points.size(); i++) {
                Point2f p = points.get(i);
                landmarkPointsPadded.add(new PointDTO(p.x(), p.y()));
            }

            // 8) Map to original space
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
                    (int) rect_x_original,
                    (int) rect_y_original,
                    (int) rect_width_original,
                    (int) rect_height_original
            );

            double forehead_x_original = (pythonForeheadTipPadded.x() - pad_left) * ratio_x;
            double forehead_y_original = (pythonForeheadTipPadded.y() - pad_top) * ratio_y;
            PointDTO originalForeheadTip = new PointDTO(forehead_x_original, forehead_y_original);

            List<String> hairstyles = getRecommendedHairstyles(shape);


            return new FaceAnalysisResponse(
                    shape,
                    hairstyles,
                    landmarkPointsOriginal,
                    originalFaceRect,
                    originalForeheadTip
            );

        } catch (Exception e) {
            e.printStackTrace();
            return new FaceAnalysisResponse(
                    "Internal error: " + e.getMessage(),
                    Collections.emptyList(),
                    Collections.emptyList(),
                    null,
                    null
            );
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

    private PointDTO getForeheadTipFromPython(byte[] imageBytes) {
        try {
            String base64Img = Base64.getEncoder().encodeToString(imageBytes);
            String jsonPayload = "{ \"image_base64\": \"" + base64Img + "\" }";

            HttpClient httpClient = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(java.net.URI.create("http://localhost:5000/detect-forehead"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

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
                    return new PointDTO(fx, fy);
                } else {
                    System.err.println("Unexpected response format: " + respStr);
                }
            } else {
                System.err.println("Python service returned status: " + response.statusCode());
            }
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        return null;
    }

    private List<String> getRecommendedHairstyles(String faceShape) {
        List<Haircuts> recommended = haircutRepository.findByFaceShapeIgnoreCase(faceShape);
        if (recommended == null || recommended.isEmpty()) {
            return Collections.emptyList();
        }
        return recommended.stream()
                .map(Haircuts::getName)
                .collect(Collectors.toList());
    }
}