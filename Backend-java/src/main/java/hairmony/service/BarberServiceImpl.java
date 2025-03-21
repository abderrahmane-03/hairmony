package hairmony.service;

import hairmony.entities.Barber;
import hairmony.repository.BarberRepository;
import hairmony.serviceInterfaces.BarberServiceInf;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BarberServiceImpl implements BarberServiceInf {

    private final BarberRepository barberRepository;

    @Override
    public List<Barber> getAllBarbers() {
        return barberRepository.findAll();
    }

    @Override
    public List<Barber> getBarbersByShopId(Long shopId) {
        return barberRepository.findByBarbershopId(shopId);
    }

    @Override
    public Barber getBarberById(Long barberId) {
        return barberRepository.findById(barberId)
                .orElseThrow(() -> new RuntimeException("Barber not found"));
    }
}
