package hairmony.entities;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import lombok.*;

@Entity
@DiscriminatorValue("CLIENT")
@Getter
@Setter
@NoArgsConstructor
public class Client extends User {

    private String faceShape; // e.g. "oval", "round", etc.

    @ManyToOne
    private Subscription subscription; // If you have a Subscription entity

    public Client(String username, String password, String role,String picture, String faceShape) {
        super(username, password, role, picture);
        this.faceShape = faceShape;
    }
}
