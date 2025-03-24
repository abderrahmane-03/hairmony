package hairmony.service;

import hairmony.serviceInterfaces.IFaceShapeDetector;
import org.bytedeco.opencv.opencv_core.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class FaceShapeDetectorServiceImplTest {

    private FaceShapeDetectorServiceImpl detector;
    private Rect dummyFaceRect;
    private static final double PYTHON_FOREHEAD_X = 100;
    private static final double PYTHON_FOREHEAD_Y = 50;

    @BeforeEach
    void setUp() {
        detector = new FaceShapeDetectorServiceImpl();
        dummyFaceRect = new Rect(0, 0, 100, 100);
    }

    private Point2fVectorVector buildLandmarks(
            double jawWidth,
            double cheekWidth,
            double foreheadWidth,
            double desiredRatio
    ) {
        Point2fVector points = new Point2fVector(68);

        // Calculate chin position based on desired ratio
        double maxWidth = Math.max(jawWidth, Math.max(cheekWidth, foreheadWidth));
        double faceHeightDistance = maxWidth * desiredRatio;

        // Horizontal distance between forehead tip and chin (fixed at 10px for simplicity)
        double horizontalDistance = 10;
        double verticalDistance = Math.sqrt(
                Math.pow(faceHeightDistance, 2) - Math.pow(horizontalDistance, 2)
        );

        // Chin coordinates (forehead tip at 100,50 in test setup)
        double chinX = PYTHON_FOREHEAD_X + horizontalDistance;
        double chinY = PYTHON_FOREHEAD_Y + verticalDistance;

        // JAW_LEFT = 3
        points.put(3, new Point2f(0, 100));
        points.put(13, new Point2f((float) jawWidth, 100));

        // CHEEK_LEFT = 1
        points.put(1, new Point2f(50, 80));
        points.put(15, new Point2f((float)(50 + cheekWidth), 80));

        // BROW_LEFT (17) and BROW_RIGHT (26)
        points.put(17, new Point2f(30, 50));
        points.put(26, new Point2f((float)(30 + foreheadWidth), 50));

        // CHIN = 8 (positioned to create correct face height)
        points.put(8, new Point2f((float) chinX, (float) chinY));

        Point2fVectorVector vv = new Point2fVectorVector(1);
        vv.put(0, points);
        return vv;
    }

    @Test
    @DisplayName("OBLONG: Ratio > 1.45")
    void testOblongFace() {
        Point2fVectorVector landmarks = buildLandmarks(180, 200, 190, 1.46);
        var result = detector.classifyFaceShape(landmarks, dummyFaceRect, PYTHON_FOREHEAD_X, PYTHON_FOREHEAD_Y);
        assertEquals("Oblong", result.shape());
    }

    @Test
    @DisplayName("DIAMOND: Cheek > Forehead > Jaw with ratio < 1.45")
    void testDiamondFace() {
        Point2fVectorVector landmarks = buildLandmarks(180, 250, 220, 1.35);
        var result = detector.classifyFaceShape(landmarks, dummyFaceRect, PYTHON_FOREHEAD_X, PYTHON_FOREHEAD_Y);
        assertEquals("Diamond", result.shape());
    }

    @Test
    @DisplayName("ROUND: Widths within 50px difference")
    void testRoundFace() {
        Point2fVectorVector landmarks = buildLandmarks(
                220,  // jaw
                260,  // cheek (max width)
                240,  // forehead
                1.25  // ratio
        );
        var result = detector.classifyFaceShape(landmarks, dummyFaceRect, 100, 50);
        assertEquals("Round", result.shape());
    }
    @Test
    @DisplayName("SQUARE: All widths within 40px, ratio < 1.28")
    void testSquareFace() {
        // All widths between 205-215 (max difference 10)
        Point2fVectorVector landmarks = buildLandmarks(
                210,  // jaw
                215,  // cheek
                205,  // forehead
                1.25
        );
        var result = detector.classifyFaceShape(landmarks, dummyFaceRect, 100, 50);
        assertEquals("Square", result.shape());
    }

    @Test
    @DisplayName("OVAL: Valid ratio without specific shape match")
    void testOvalFace() {
        Point2fVectorVector landmarks = buildLandmarks(
                200,  // jaw
                210,  // cheek
                180,  // forehead (doesn't satisfy Diamond's cheek>forehead>jaw)
                1.35  // ratio
        );
        var result = detector.classifyFaceShape(landmarks, dummyFaceRect, 100, 50);
        assertEquals("Oval", result.shape());
    }
    @Test
    @DisplayName("HEART: Forehead significantly wider than others")
    void testHeartFace() {
        Point2fVectorVector landmarks = buildLandmarks(
                190,  // jaw
                200,  // cheek
                260,  // forehead (70px wider than jaw)
                1.25
        );
        var result = detector.classifyFaceShape(landmarks, dummyFaceRect, 100, 50);
        assertEquals("Heart", result.shape());
    }

    @Test
    @DisplayName("TRIANGLE: Jaw widest")
    void testTriangleFace() {
        Point2fVectorVector landmarks = buildLandmarks(250, 200, 190, 1.25);
        var result = detector.classifyFaceShape(landmarks, dummyFaceRect, PYTHON_FOREHEAD_X, PYTHON_FOREHEAD_Y);
        assertEquals("Triangle", result.shape());
    }

    @Test
    @DisplayName("Handle insufficient landmarks")
    void testInsufficientLandmarks() {
        Point2fVectorVector shortLandmarks = new Point2fVectorVector(1);
        shortLandmarks.put(0, new Point2fVector(10));
        var result = detector.classifyFaceShape(shortLandmarks, dummyFaceRect, PYTHON_FOREHEAD_X, PYTHON_FOREHEAD_Y);
        assertEquals("Insufficient Landmarks", result.shape());
    }

    @Test
    @DisplayName("Handle invalid dimensions")
    void testInvalidDimensions() {
        Point2fVectorVector landmarks = buildLandmarks(0, 100, 120, 1.2);
        var result = detector.classifyFaceShape(landmarks, dummyFaceRect, PYTHON_FOREHEAD_X, PYTHON_FOREHEAD_Y);
        assertEquals("Invalid Dimensions", result.shape());
    }
}