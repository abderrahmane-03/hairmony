package hairmony.serviceInterfaces;

import hairmony.entities.Barbershop;
import java.util.List;

public interface BarbershopServiceInf {
    List<Barbershop> getAllBarbershops();
    Barbershop getBarbershopById(Long shopId);
    Barbershop createBarbershop(Barbershop shop);
}
