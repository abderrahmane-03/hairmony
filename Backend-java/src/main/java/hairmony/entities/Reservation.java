package hairmony.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "reservations")
@Getter
@Setter
@NoArgsConstructor
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate date;     // or you can store as a single DateTime
    private LocalTime time;

    private String hairstyleChosen; // e.g. "Buzz cut", "Fade", etc.

    // Relationship to Client
    @ManyToOne
    @JoinColumn(name = "client_id")
    private Client client;

    // Relationship to Barber
    @ManyToOne
    @JoinColumn(name = "barber_id")
    private Barber barber;

    // Possibly reference Payment or be paid later
    // Possibly a status: "SCHEDULED", "COMPLETED", etc.
}