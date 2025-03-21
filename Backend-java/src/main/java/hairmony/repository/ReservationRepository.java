package hairmony.repository;

import hairmony.entities.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    // e.g. find all reservations by barber or by client, if needed
     List<Reservation> findByBarberId(Long barberId);
     List<Reservation> findByClientId(Long clientId);
}
