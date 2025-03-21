package hairmony.dto;

import java.util.List;

public record FaceAnalysisResponse(
        String shape,
        List<String> hairstyles,
        List<PointDTO> landmarks,
        RectDTO faceRect,
        PointDTO foreheadTip
) {}