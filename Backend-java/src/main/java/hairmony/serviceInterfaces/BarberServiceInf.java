
package hairmony.serviceInterfaces;

import hairmony.entities.Barber;
import java.util.List;

public interface BarberServiceInf {
    List<Barber> getAllBarbers();
    List<Barber> getBarbersByShopId(Long shopId);
    Barber getBarberById(Long barberId);
}
