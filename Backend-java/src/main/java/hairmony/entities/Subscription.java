package hairmony.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "subscriptions")
@Getter
@Setter
@NoArgsConstructor
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;      // e.g. "Basic", "Premium"
    private double price;
    private String planDescription; // "Unlimited haircuts" ?

    // constructor(s), getters, setters, etc.
}
