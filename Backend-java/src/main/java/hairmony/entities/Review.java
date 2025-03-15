package hairmony.entities;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Getter
@Setter
@NoArgsConstructor
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int rating;         // e.g. 1..5
    private String comment;     // "Great haircut!"
    private LocalDateTime createdAt = LocalDateTime.now();

    // Relationship to Client
    @ManyToOne
    @JoinColumn(name = "client_id")
    private Client client;

    // Relationship to Barber
    @ManyToOne
    @JoinColumn(name = "barber_id")
    private Barber barber;
}
