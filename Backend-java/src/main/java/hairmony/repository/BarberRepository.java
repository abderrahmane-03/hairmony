package hairmony.repository;

import hairmony.entities.Barber;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BarberRepository extends JpaRepository<Barber, Long> {
    @Query("SELECT b FROM Barber b WHERE b.barbershop.id = :barbershopId")
    List<Barber> findByBarbershopId(@Param("barbershopId") Long barbershopId);
}
