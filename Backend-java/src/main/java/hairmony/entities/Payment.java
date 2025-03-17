package hairmony.entities;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String method;  // e.g. "STRIPE"
    private double amount;  // e.g. 2.0
    private String description; // "Live Face Detection", etc.

    private String status;  // e.g. "PENDING", "SUCCESS", "FAILED"

    private String sessionId; // from Stripe

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private LocalDateTime paymentDate = LocalDateTime.now();
}

