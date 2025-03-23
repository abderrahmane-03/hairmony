// hairmony/dto/ProfileDTO.java
package hairmony.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class ProfileDTO {
    private Long id;
    private String username;
    private String role;
    private String picturePath;       // For retrieving the picture path
    private MultipartFile pictureFile;

    // For updating the password
    private String newPassword;

    // Barber fields
    private String specialty;
    private double rating;
    private Long barbershopId;
    private String barbershopName;
    private String barbershopAddress; // added
    private double barbershopRating;  // added

    // Client fields
    private String faceShape;
    private Long subscriptionId;
    private String subscriptionName;

    // Common subscription/feature flags
    private boolean unlimitedAccess;
    private boolean VIPSubscriber;
    private boolean normalSubscriber;
    private int freeTrialsRemaining;
    private int liveTrialsRemaining;
}
