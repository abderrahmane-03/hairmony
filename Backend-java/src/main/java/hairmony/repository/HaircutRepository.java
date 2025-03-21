package hairmony.repository;

import hairmony.entities.Haircuts;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface HaircutRepository extends JpaRepository<Haircuts, Long> {

    @Query("SELECT h FROM Haircuts h WHERE LOWER(h.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Haircuts> findByNameContainingIgnoreCase(@Param("query") String query);
    List<Haircuts> findByFaceShapeIgnoreCase(String faceShape);
    List<Haircuts> findByFaceShape(String faceShape);
}