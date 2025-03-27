package hairmony.service;

import hairmony.entities.Barbershop;
import hairmony.repository.BarbershopRepository;
import hairmony.serviceInterfaces.BarbershopServiceInf;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BarbershopServiceImpl implements BarbershopServiceInf {

    private final BarbershopRepository barbershopRepository;

    @Override
    public List<Barbershop> getAllBarbershops() {
        return barbershopRepository.findAll();
    }

    @Override
    public Barbershop getBarbershopById(Long shopId) {
        return barbershopRepository.findById(shopId)
                .orElseThrow(() -> new RuntimeException("Barbershop not found"));
    }

    @Override
    public Barbershop createBarbershop(Barbershop shop) {
        // e.g. set default rating, handle pictures, etc. as needed
        return barbershopRepository.save(shop);
    }


}
