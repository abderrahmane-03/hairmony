package hairmony.repository;

import hairmony.entities.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    // e.g. find by username or email
    // Optional<Client> findByUsername(String username);
}
