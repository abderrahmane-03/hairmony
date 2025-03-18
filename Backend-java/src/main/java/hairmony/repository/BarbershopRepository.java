package hairmony.repository;

import hairmony.entities.Barbershop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BarbershopRepository extends JpaRepository<Barbershop, Long> {
    // Add custom queries if needed
}
