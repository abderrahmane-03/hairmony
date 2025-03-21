package hairmony.service;

import hairmony.serviceInterfaces.IFaceShapeDetector;
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
public class FaceShapeDetectorServiceImpl implements IFaceShapeDetector {

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

    @Override
    public Point2fVectorVector detectLandmarks(Mat fullImage, Rect faceRect) {
        Mat gray = new Mat();
        opencv_imgproc.cvtColor(fullImage, gray, opencv_imgproc.COLOR_BGR2GRAY);

        RectVector faces = new RectVector();
        faces.push_back(faceRect);

        Point2fVectorVector landmarks = new Point2fVectorVector();
        boolean success = facemark.fit(gray, faces, landmarks);

        if (!success || landmarks.empty()) {
            throw new RuntimeException("Landmark detection failed!");
        }
        return landmarks;
    }

    @Override
    public ClassificationResult classifyFaceShape(Point2fVectorVector landmarks,
                                                  Rect faceRect,
                                                  double pythonForeheadTipX,
                                                  double pythonForeheadTipY) {

        if (landmarks.empty()) {
            return new ClassificationResult("No Landmarks", 0, 0);
        }
        Point2fVector facePoints = landmarks.get(0);
        if (facePoints.size() < 68) {
            return new ClassificationResult("Insufficient Landmarks", 0, 0);
        }

        // Helper distance function
        Distance2f dist = (p1, p2) -> {
            double dx = p2.x() - p1.x();
            double dy = p2.y() - p1.y();
            return Math.sqrt(dx * dx + dy * dy);
        };

        // Indices
        final int CHIN = 8; // index 8 is typically the chin
        final int JAW_LEFT = 3;
        final int JAW_RIGHT = 13;
        final int CHEEK_LEFT = 1;
        final int CHEEK_RIGHT = 15;
        final int BROW_LEFT_OUTER = 17;
        final int BROW_RIGHT_OUTER = 26;

        // Distances
        double jawWidth = dist.calc(facePoints.get(JAW_LEFT), facePoints.get(JAW_RIGHT));
        double cheekboneWidth = dist.calc(facePoints.get(CHEEK_LEFT), facePoints.get(CHEEK_RIGHT));
        double foreheadWidth = dist.calc(facePoints.get(BROW_LEFT_OUTER), facePoints.get(BROW_RIGHT_OUTER));

        // Face height from python “forehead tip” down to chin
        double faceHeight;
        {
            Point2f chin = facePoints.get(CHIN);
            double dx = chin.x() - pythonForeheadTipX;
            double dy = chin.y() - pythonForeheadTipY;
            faceHeight = Math.sqrt(dx * dx + dy * dy);
        }

        // Debug
        System.out.printf("DEBUG -> jawWidth=%.1f, cheekWidth=%.1f, foreheadWidth=%.1f, faceHeight=%.1f%n",
                jawWidth, cheekboneWidth, foreheadWidth, faceHeight);

        // Guard
        if (faceHeight < 1 || jawWidth < 1 || cheekboneWidth < 1 || foreheadWidth < 1) {
            return new ClassificationResult("Invalid Dimensions", pythonForeheadTipX, pythonForeheadTipY);
        }

        // Now define shape logic with broader thresholds:
        String shape = computeFaceShape(jawWidth, cheekboneWidth, foreheadWidth, faceHeight);

        return new ClassificationResult(shape, pythonForeheadTipX, pythonForeheadTipY);
    }

    /**
     * Classify the face shape based on:
     *   - jawWidth
     *   - cheekboneWidth
     *   - foreheadWidth
     *   - faceHeight
     */
    private String computeFaceShape(double jawWidth, double cheekboneWidth,
                                    double foreheadWidth, double faceHeight)
    {
        double maxWidth = Math.max(jawWidth, Math.max(cheekboneWidth, foreheadWidth));
        double ratio = faceHeight / maxWidth; // e.g. 1.37, 1.25, etc.

        // 1) OBLONG:
        //    If faceHeight is significantly bigger than the max width
        //    (e.g. ratio > ~1.40).
        if (ratio > 1.40) {
            return "Oblong";
        }

        // 2) DIAMOND (unchanged):
        //    Cheekbones must be the widest, then forehead > jaw.
        //    Placed here so it doesn’t get overshadowed by “Oval”.
        if (cheekboneWidth > foreheadWidth && cheekboneWidth > jawWidth
                && foreheadWidth > jawWidth) {
            return "Diamond";
        }

        // 3) ROUND:
        //    - All widths fairly close (within ~45 or 50).
        //    - Face height ratio < ~1.30 so it doesn’t become Oval.
        {
            double diffJC = Math.abs(jawWidth - cheekboneWidth);
            double diffCF = Math.abs(cheekboneWidth - foreheadWidth);
            double diffJF = Math.abs(jawWidth - foreheadWidth);

            if (diffJC < 50 && diffCF < 50 && diffJF < 50
                    && ratio < 1.30) {
                return "Round";
            }
        }

        // 4) SQUARE:
        //    - All widths fairly close (within ~40).
        //    - Face height ratio < ~1.28 to avoid misclassifying some ovals.
        {
            double diffJC = Math.abs(jawWidth - cheekboneWidth);
            double diffCF = Math.abs(cheekboneWidth - foreheadWidth);
            double diffJF = Math.abs(jawWidth - foreheadWidth);

            if (diffJC < 40 && diffCF < 40 && diffJF < 40
                    && ratio < 1.28) {
                return "Square";
            }
        }

        // 5) OVAL:
        //    - Face is taller than widths, but not extremely so (not oblong).
        //    - ratio from about 1.20 up to 1.40 can qualify as Oval if it didn’t pass Diamond, Round, or Square.
        if (ratio >= 1.20 && ratio <= 1.40) {
            return "Oval";
        }

        // 6) HEART:
        //    - Forehead is largest dimension.
        if (foreheadWidth > cheekboneWidth && foreheadWidth > jawWidth) {
            return "Heart";
        }

        // 7) TRIANGLE:
        //    - Jaw is largest dimension.
        if (jawWidth > cheekboneWidth && jawWidth > foreheadWidth) {
            return "Triangle";
        }

        // 8) If none matched:
        return "Undetermined";
    }



    @FunctionalInterface
    interface Distance2f {
        double calc(Point2f p1, Point2f p2);
    }
}
