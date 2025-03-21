package hairmony.serviceInterfaces;

import org.bytedeco.opencv.opencv_core.Point2fVectorVector;
import org.bytedeco.opencv.opencv_core.Rect;

public interface IFaceShapeDetector {

    /**
     * Detect 68 landmarks within the given faceRect of the fullImage.
     */
    Point2fVectorVector detectLandmarks(org.bytedeco.opencv.opencv_core.Mat fullImage, Rect faceRect);

    /**
     * Classify face shape given the landmarks + pythonForeheadTip.
     */
    ClassificationResult classifyFaceShape(Point2fVectorVector landmarks,
                                           Rect faceRect,
                                           double pythonForeheadTipX,
                                           double pythonForeheadTipY);

    record ClassificationResult(String shape, double tipForeheadX, double tipForeheadY) {}
}
