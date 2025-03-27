package hairmony.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    private String picture;

    @OneToMany(mappedBy = "barbershop", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<Barber> barbers;

}
