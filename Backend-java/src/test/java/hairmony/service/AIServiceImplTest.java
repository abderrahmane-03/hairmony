package hairmony.service;

import hairmony.dto.FaceAnalysisResponse;
import hairmony.dto.PointDTO;
import hairmony.entities.Haircuts;
import hairmony.repository.HaircutRepository;
import hairmony.serviceInterfaces.IFaceDetection;
import hairmony.serviceInterfaces.IFaceShapeDetector;
import org.bytedeco.opencv.opencv_core.Mat;
import org.bytedeco.opencv.opencv_core.Rect;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AIServiceImplTest {

    private IFaceDetection faceDetection;
    private IFaceShapeDetector faceShapeDetector;
    private HaircutRepository haircutRepository;
    private AIServiceImpl aiService;

    @BeforeEach
    void setUp() {
        faceDetection = Mockito.mock(IFaceDetection.class);
        faceShapeDetector = Mockito.mock(IFaceShapeDetector.class);
        haircutRepository = Mockito.mock(HaircutRepository.class);

        // Provide a custom subclass that overrides decodeMat(...) and getForeheadTipFromPython(...)
        aiService = new AIServiceImpl(faceDetection, faceShapeDetector, haircutRepository) {

            @Override
            protected Mat decodeMat(byte[] bytes) {
                // Instead of actually decoding, just return a 100x100 color Mat
                // so that it’s never empty => simulates a valid decode
                return new Mat(100, 100, org.bytedeco.opencv.global.opencv_core.CV_8UC3);
            }

            @Override
            protected PointDTO getForeheadTipFromPython(byte[] imageBytes) {
                // We can simulate a successful Python call returning a tip
                return new PointDTO(120.0, 60.0);
            }
        };
    }



    @Test
    @DisplayName("No face detected => returns shape=No face detected")
    void testNoFaceDetected() throws IOException {
        MultipartFile mockFile = Mockito.mock(MultipartFile.class);
        when(mockFile.getBytes()).thenReturn(new byte[200]);

        // Force detectFace to return null => no face
        when(faceDetection.detectFace(any(Mat.class))).thenReturn(null);

        FaceAnalysisResponse response = aiService.analyzeFace(mockFile);
        assertEquals("No face detected", response.shape());
        assertTrue(response.hairstyles().isEmpty());
    }

    @Test
    @DisplayName("If we override getForeheadTipFromPython to return null => 'Failed to get forehead tip'")
    void testForeheadTipNull() throws IOException {
        // Rebuild aiService but override getForeheadTipFromPython => null
        aiService = new AIServiceImpl(faceDetection, faceShapeDetector, haircutRepository) {
            @Override
            protected Mat decodeMat(byte[] bytes) {
                return new Mat(100, 100, org.bytedeco.opencv.global.opencv_core.CV_8UC3);
            }

            @Override
            protected PointDTO getForeheadTipFromPython(byte[] imageBytes) {
                return null; // simulate Python failure
            }
        };

        MultipartFile mockFile = Mockito.mock(MultipartFile.class);
        when(mockFile.getBytes()).thenReturn(new byte[200]);
        when(faceDetection.detectFace(any(Mat.class))).thenReturn(new Rect(10,10,50,50));

        FaceAnalysisResponse response = aiService.analyzeFace(mockFile);
        assertEquals("Failed to get forehead tip from Python", response.shape());
    }

    @Test
    @DisplayName("IOException => shape=Internal error")
    void testIOException() throws IOException {
        MultipartFile mockFile = Mockito.mock(MultipartFile.class);
        when(mockFile.getBytes()).thenThrow(new IOException("Simulated IO error"));

        FaceAnalysisResponse response = aiService.analyzeFace(mockFile);
        assertTrue(response.shape().contains("Internal error"));
    }

}
