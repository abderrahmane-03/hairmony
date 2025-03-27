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

    private String method;
    private double amount;
    private String description;
    private String status;
    private String sessionId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private LocalDateTime paymentDate = LocalDateTime.now();
}

