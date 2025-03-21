// hairmony/repository/ReviewRepository.java
package hairmony.repository;

import hairmony.entities.Review;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    long countByBarberId(Long barberId);
}
