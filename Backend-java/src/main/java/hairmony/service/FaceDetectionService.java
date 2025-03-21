package hairmony.service;

import hairmony.serviceInterfaces.IFaceDetection;
import org.bytedeco.opencv.global.opencv_core;           // For auto-loading the native libs
import org.bytedeco.opencv.opencv_core.Mat;
import org.bytedeco.opencv.opencv_core.Rect;
import org.bytedeco.opencv.opencv_core.RectVector;      // Bytedeco equivalent of MatOfRect
import org.bytedeco.opencv.opencv_objdetect.CascadeClassifier;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.StandardCopyOption;

import java.io.File;
import java.io.InputStream;

@Service
public class FaceDetectionService implements IFaceDetection {

    private final CascadeClassifier faceDetector;

    public FaceDetectionService() throws Exception {
        // Trigger the native library load
        opencv_core.class.getName();

        // Load the Haar cascade from resources
        try (InputStream in = new ClassPathResource("haarcascade_frontalface_default.xml").getInputStream()) {
            File tempFile = File.createTempFile("haarcascade", ".xml");
            Files.copy(in, tempFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
            tempFile.deleteOnExit();

            faceDetector = new CascadeClassifier(tempFile.getAbsolutePath());
            if (faceDetector.empty()) {
                throw new RuntimeException("Failed to load Haar cascade classifier!");
            }
        }
    }

    @Override
    public Rect detectFace(Mat image) {
        RectVector faces = new RectVector();
        faceDetector.detectMultiScale(image, faces);
        if (faces.size() > 0) {
            return faces.get(0);
        }
        return null;
    }
}