package hairmony.service;

import hairmony.entities.Barbershop;
import hairmony.repository.BarbershopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BarbershopService {

    private final BarbershopRepository barbershopRepository;

    public List<Barbershop> getAllBarbershops() {
        return barbershopRepository.findAll();
    }

    public Barbershop getBarbershopById(Long shopId) {
        return barbershopRepository.findById(shopId)
                .orElseThrow(() -> new RuntimeException("Barbershop not found"));
    }

    // e.g. create or update a barbershop
    public Barbershop createBarbershop(Barbershop shop) {
        return barbershopRepository.save(shop);
    }
}
