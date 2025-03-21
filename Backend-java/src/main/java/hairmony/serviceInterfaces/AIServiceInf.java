package hairmony.serviceInterfaces;


import hairmony.dto.FaceAnalysisResponse;
import org.springframework.web.multipart.MultipartFile;


public interface AIServiceInf {
    FaceAnalysisResponse analyzeFace(MultipartFile file);

}
