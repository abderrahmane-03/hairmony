package service;

import jakarta.annotation.PostConstruct;
import org.bytedeco.opencv.global.opencv_face;
import org.bytedeco.opencv.global.opencv_imgproc;
import org.bytedeco.opencv.opencv_core.*;
import org.bytedeco.opencv.opencv_face.Facemark;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;

@Service
public class FaceShapeDetectorService {

    private Facemark facemark;

    @PostConstruct
    public void init() throws IOException {
        File tempModel = File.createTempFile("lbfmodel", ".yaml");
        tempModel.deleteOnExit();

        try (var in = new ClassPathResource("lbfmodel.yaml").getInputStream()) {
            Files.copy(in, tempModel.toPath(), StandardCopyOption.REPLACE_EXISTING);
        }

        facemark = opencv_face.createFacemarkLBF();
        facemark.loadModel(tempModel.getAbsolutePath());
    }

    public Point2fVectorVector detectLandmarks(Mat fullImage, Rect faceRect) {
        // Convert to grayscale
        Mat gray = new Mat();
        opencv_imgproc.cvtColor(fullImage, gray, opencv_imgproc.COLOR_BGR2GRAY);

        // Prepare RectVector
        RectVector faces = new RectVector();
        faces.push_back(faceRect);

        // Detect landmarks
        Point2fVectorVector landmarks = new Point2fVectorVector();
        boolean success = facemark.fit(gray, faces, landmarks);

        if (!success || landmarks.empty()) {
            throw new RuntimeException("Landmark detection failed!");
        }
        return landmarks;
    }

    /**
     * Returns both the face shape and the forehead tip (X, Y) using Python-provided forehead tip.
     */
    public ClassificationResult classifyFaceShape(Point2fVectorVector landmarks, Rect faceRect,
                                                  double pythonForeheadTipX, double pythonForeheadTipY) {
        if (landmarks.empty()) {
            return new ClassificationResult("No Landmarks", 0, 0);
        }

        Point2fVector facePoints = landmarks.get(0);
        if (facePoints.size() < 68) {
            return new ClassificationResult("Insufficient Landmarks", 0, 0);
        }

        // Helper to compute Euclidean distance
        Distance2f dist = (p1, p2) -> {
            double dx = p2.x() - p1.x();
            double dy = p2.y() - p1.y();
            return Math.sqrt(dx * dx + dy * dy);
        };

        // Key indices
        int CHIN = 8;

        // Calculate face height from Python forehead tip to chin
        double faceHeight = facePoints.get(CHIN).y() - pythonForeheadTipY;
        if (faceHeight <= 0) {
            System.out.println("Invalid face height calculated: " + faceHeight);
            return new ClassificationResult("Invalid Height", pythonForeheadTipX, pythonForeheadTipY);
        }

        // Classify shape using the calculated face height
        String shape = computeShape(facePoints, dist, faceHeight);

        // Return the shape and the Python-provided forehead tip
        return new ClassificationResult(shape, pythonForeheadTipX, pythonForeheadTipY);
    }

    /**
     * Compute face shape using provided faceHeight.
     */
    private String computeShape(Point2fVector facePoints, Distance2f dist, double faceHeight) {
        int JAW_START = 3;
        int JAW_END = 13;
        int RIGHT_CHEEK = 1;
        int LEFT_CHEEK = 15;
        int RIGHT_EYEBROW_OUTER = 26;
        int LEFT_EYEBROW_OUTER = 17;

        double jawWidth = dist.calc(facePoints.get(JAW_END), facePoints.get(JAW_START));
        double cheekboneWidth = dist.calc(facePoints.get(RIGHT_CHEEK), facePoints.get(LEFT_CHEEK));
        double foreheadWidth = dist.calc(facePoints.get(RIGHT_EYEBROW_OUTER), facePoints.get(LEFT_EYEBROW_OUTER));

        if (faceHeight <= 0 || jawWidth <= 0 || cheekboneWidth <= 0 || foreheadWidth <= 0) {
            System.out.println("Invalid face dimensions. Check landmark detection.");
            return "Invalid";
        }

        System.out.printf("foreheadWidth=%.2f,jawWidth=%.2f,faceHeight=%.2f,cheekboneWidth=%.2f\n",
                foreheadWidth, jawWidth, faceHeight, cheekboneWidth);

        // Shape classification logic
        if (cheekboneWidth > foreheadWidth && cheekboneWidth > jawWidth && foreheadWidth > jawWidth) {
            return "Diamond";
        } else if (faceHeight > cheekboneWidth * 1.1 && faceHeight > foreheadWidth * 1.1 && faceHeight > jawWidth * 1.1) {
            return "Oblong";
        } else if (Math.abs(faceHeight - cheekboneWidth) < 10 &&
                Math.abs(faceHeight - foreheadWidth) < 10 &&
                Math.abs(faceHeight - jawWidth) < 10) {
            return "Square";
        } else if (Math.abs(faceHeight - cheekboneWidth) < 10 &&
                Math.abs(jawWidth - foreheadWidth) < 10) {
            return "Round";
        } else if (foreheadWidth > jawWidth && faceHeight > cheekboneWidth) {
            return "Oval";
        } else if (foreheadWidth > jawWidth * 1.1) {
            return "Heart";
        } else if (jawWidth > cheekboneWidth && cheekboneWidth > foreheadWidth) {
            return "Triangle";
        } else {
            return "Undetermined";
        }
    }

    // For distance
    @FunctionalInterface
    interface Distance2f {
        double calc(Point2f p1, Point2f p2);
    }

    // Return shape + forehead tip
    public record ClassificationResult(String shape, double tipForeheadX, double tipForeheadY) {}
}