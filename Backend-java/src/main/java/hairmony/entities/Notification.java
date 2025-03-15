package hairmony.entities;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String message;
    private LocalDateTime createdAt;

    // Possibly a "read" flag
    private boolean read = false;

    // If notifications can go to any user, do a ManyToOne to base User
    @ManyToOne
    @JoinColumn(name = "recipient_id")
    private User recipient;
}

