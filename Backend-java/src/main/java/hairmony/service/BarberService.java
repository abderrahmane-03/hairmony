package hairmony.service;

import hairmony.entities.Barber;
import hairmony.repository.BarberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BarberService {

    private final BarberRepository barberRepository;

    public List<Barber> getAllBarbers() {
        return barberRepository.findAll();
    }

    public List<Barber> getBarbersByShopId(Long shopId) {
        return barberRepository.findByBarbershopId(shopId);
    }

    public Barber getBarberById(Long barberId) {
        return barberRepository.findById(barberId)
                .orElseThrow(() -> new RuntimeException("Barber not found"));
    }

}
