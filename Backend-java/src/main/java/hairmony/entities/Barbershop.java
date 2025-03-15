package hairmony.entities;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "barbershops")
@Getter
@Setter
@NoArgsConstructor
public class Barbershop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String address;
    private double rating;

    // Relationship: one barbershop has many barbers
    @OneToMany(mappedBy = "barbershop")
    private List<Barber> barbers;

    // constructor(s), getters, setters, etc.
}
