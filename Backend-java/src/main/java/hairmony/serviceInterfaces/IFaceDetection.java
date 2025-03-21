package hairmony.serviceInterfaces;

public interface IFaceDetection {
    org.bytedeco.opencv.opencv_core.Rect detectFace(org.bytedeco.opencv.opencv_core.Mat image);
}