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
            // 1) Read raw bytes
            byte[] bytes = file.getBytes();

            // 2) Decode into an OpenCV Mat
            //    (We keep this in a separate method so we can override in tests.)
            Mat original = decodeMat(bytes);
            if (original.empty()) {
                return new FaceAnalysisResponse(
                        "Invalid image or can't decode",
                        Collections.emptyList(),
                        Collections.emptyList(),
                        null,
                        null
                );
            }

            // 3) Resize/pad to 600x600
            Mat padded = resizeAndPad(original, 600, 600);

            // 4) Python forehead tip
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

            // 5) Detect face
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

            // 6) Detect landmarks
            Point2fVectorVector landmarks = faceShapeDetectorService.detectLandmarks(padded, faceRect);

            // 7) Classify
            IFaceShapeDetector.ClassificationResult localResult = faceShapeDetectorService.classifyFaceShape(
                    landmarks, faceRect, pythonForeheadTipPadded.x(), pythonForeheadTipPadded.y()
            );
            String shape = localResult.shape();

            // 8) Convert landmarks to original coords (optional). We'll do it fully here:
            List<PointDTO> originalLandmarks = mapLandmarksToOriginal(landmarks, padded, original);

            // 9) Build RectDTO for the face
            RectDTO originalFaceRect = mapFaceRectToOriginal(faceRect, padded, original);

            // 10) Map the forehead tip
            PointDTO originalForeheadTip = mapForeheadTipToOriginal(pythonForeheadTipPadded, padded, original);

            // 11) Get recommended hairstyles
            List<String> hairstyles = getRecommendedHairstyles(shape);

            // 12) Return
            return new FaceAnalysisResponse(
                    shape,
                    hairstyles,
                    originalLandmarks,
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

    /**
     * Overridable decode method. In production, it does a real imdecode.
     * In tests, we can override to simulate success/failure.
     */
    protected Mat decodeMat(byte[] bytes) {
        return imdecode(new Mat(bytes), IMREAD_COLOR);
    }

    /**
     * Resizes and pads a Mat to a given width & height.
     */
    private Mat resizeAndPad(Mat input, int targetW, int targetH) {
        int original_w = input.cols();
        int original_h = input.rows();
        double scale = Math.min(targetW * 1.0 / original_w, targetH * 1.0 / original_h);
        int new_w = (int) (original_w * scale);
        int new_h = (int) (original_h * scale);

        Mat resized = new Mat();
        resize(input, resized, new Size(new_w, new_h), 0, 0, INTER_AREA);

        int pad_left = (targetW - new_w) / 2;
        int pad_right = targetW - new_w - pad_left;
        int pad_top = (targetH - new_h) / 2;
        int pad_bottom = targetH - new_h - pad_top;

        Mat padded = new Mat();
        copyMakeBorder(resized, padded, pad_top, pad_bottom, pad_left, pad_right, BORDER_CONSTANT, new Scalar(0,0,0,0));
        return padded;
    }

    /**
     * Overridable method that calls the Python microservice or returns null on error.
     */
    protected PointDTO getForeheadTipFromPython(byte[] imageBytes) {
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
                    double fx = extractDouble(respStr, "forehead_x");
                    double fy = extractDouble(respStr, "forehead_y");
                    return new PointDTO(fx, fy);
                }
            } else {
                System.err.println("Python service returned status: " + response.statusCode());
            }
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        return null;
    }

    /**
     * Helper to extract a double from a JSON-ish substring, given a key.
     */
    private double extractDouble(String respStr, String key) {
        int idx = respStr.indexOf(key);
        if (idx < 0) return 0.0;
        int colon = respStr.indexOf(":", idx);
        int comma = respStr.indexOf(",", colon);
        if (comma < 0) comma = respStr.indexOf("}", colon);
        String sub = respStr.substring(colon+1, comma).trim();
        sub = sub.replaceAll("[^0-9.]", "");
        return Double.parseDouble(sub);
    }

    /**
     * Convert a padded landmark coordinate back to original space.
     */
    private List<PointDTO> mapLandmarksToOriginal(Point2fVectorVector landmarks, Mat padded, Mat original) {
        if (landmarks.empty()) return Collections.emptyList();
        Point2fVector points = landmarks.get(0);

        // figure out ratio
        double ratio_x = (double) original.cols() / padded.cols();
        double ratio_y = (double) original.rows() / padded.rows();

        List<PointDTO> result = new ArrayList<>();
        for (int i=0; i<points.size(); i++) {
            float px = points.get(i).x();
            float py = points.get(i).y();
            double rx = px * ratio_x;
            double ry = py * ratio_y;
            result.add(new PointDTO(rx, ry));
        }
        return result;
    }

    private RectDTO mapFaceRectToOriginal(Rect rect, Mat padded, Mat original) {
        double ratio_x = (double) original.cols() / padded.cols();
        double ratio_y = (double) original.rows() / padded.rows();

        int x = (int) (rect.x() * ratio_x);
        int y = (int) (rect.y() * ratio_y);
        int w = (int) (rect.width() * ratio_x);
        int h = (int) (rect.height() * ratio_y);
        return new RectDTO(x,y,w,h);
    }

    private PointDTO mapForeheadTipToOriginal(PointDTO tip, Mat padded, Mat original) {
        double ratio_x = (double) original.cols() / padded.cols();
        double ratio_y = (double) original.rows() / padded.rows();
        return new PointDTO(tip.x() * ratio_x, tip.y() * ratio_y);
    }

    /**
     * Convert Mat => JPG bytes.
     */
    private byte[] matToBytes(Mat mat) throws IOException {
        BytePointer buffer = new BytePointer();
        imencode(".jpg", mat, buffer);
        byte[] arr = new byte[(int) buffer.capacity()];
        buffer.get(arr);
        buffer.deallocate();
        return arr;
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
