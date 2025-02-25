package hairmony.service;

import org.bytedeco.opencv.global.opencv_core;           // For auto-loading the native libs
import org.bytedeco.opencv.opencv_core.Mat;
import org.bytedeco.opencv.opencv_core.Rect;
import org.bytedeco.opencv.opencv_core.RectVector;      // Bytedeco equivalent of MatOfRect
import org.bytedeco.opencv.opencv_objdetect.CascadeClassifier;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;

@Service
public class FaceDetectionService {

    private final CascadeClassifier faceDetector;

    public FaceDetectionService() throws IOException {
        // 1) Trigger native library loading (Bytedeco handles it)
        opencv_core.class.getName();

        // 2) Load the Haar cascade from resources
        try (InputStream in = new ClassPathResource("haarcascade_frontalface_default.xml").getInputStream()) {
            File tempFile = File.createTempFile("haarcascade", ".xml");
            Files.copy(in, tempFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
            tempFile.deleteOnExit();

            // 3) Create the CascadeClassifier with the temp file
            faceDetector = new CascadeClassifier(tempFile.getAbsolutePath());
            if (faceDetector.empty()) {
                throw new RuntimeException("Failed to load Haar cascade classifier!");
            }
        }
    }

    public Rect detectFace(Mat image) {
        // Bytedeco uses RectVector instead of MatOfRect
        RectVector faces = new RectVector();

        // This is Bytedeco's detectMultiScale signature
        faceDetector.detectMultiScale(image, faces);

        // Return the first face if found
        if (faces.size() > 0) {
            return faces.get(0);
        }
        return null;
    }
}
