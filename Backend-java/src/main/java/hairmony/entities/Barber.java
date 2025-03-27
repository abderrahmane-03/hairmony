package hairmony.entities;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.*;

@Entity
@DiscriminatorValue("BARBER")
@Getter
@Setter
@NoArgsConstructor
public class Barber extends User {

    private String specialty;
    private double rating;

    @ManyToOne
    @JoinColumn(name = "barbershop_id")
    private Barbershop barbershop;

    public Barber(String username, String password, String role,String picture,String specialty, double rating) {
        super(username, password, role,picture);
        this.specialty = specialty;
        this.rating = rating;
    }
}
