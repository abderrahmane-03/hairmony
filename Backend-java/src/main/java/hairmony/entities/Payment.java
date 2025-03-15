package hairmony.entities;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String method;    // "CASH", "CREDIT_CARD", etc.
    private double amount;

    // Relationship to a reservation
    @OneToOne
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    // Possibly a date or a status
    // constructor(s), getters, setters, etc.
}

