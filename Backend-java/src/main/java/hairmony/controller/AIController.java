package hairmony.controller;

import hairmony.dto.FaceAnalysisResponse;
import hairmony.serviceInterfaces.AIServiceInf;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/AI")
@RequiredArgsConstructor
public class AIController {

    private final AIServiceInf aiService;

    @PostMapping("/analyze-face")
    public ResponseEntity<FaceAnalysisResponse> analyzeFace(@RequestParam("file") MultipartFile file) {
        FaceAnalysisResponse response = aiService.analyzeFace(file);
        return ResponseEntity.ok(response);
    }
}
