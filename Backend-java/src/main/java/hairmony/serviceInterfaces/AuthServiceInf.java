package hairmony.serviceInterfaces;

import org.springframework.web.multipart.MultipartFile;

public interface AuthServiceInf {
    String registerUser(
            String username,
            String password,
            String role,
            MultipartFile pictureFile,
            String barbershopId,
            String barbershopName,
            String barbershopAddress,
            MultipartFile barbershopPic
    );

}