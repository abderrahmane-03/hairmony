package hairmony.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class RegisterRequest {
    private String username;
    private String password;
    private String role;
    private String picture;// "CLIENT", "BARBER", or "ADMIN"
    // Additional fields for each subtype, e.g. faceShape, specialty, rating, etc.
    private String faceShape;   // for Client
    private String specialty;   // for Barber
    private Double rating;      // for Barber
}