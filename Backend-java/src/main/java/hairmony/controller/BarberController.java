package hairmony.controller;

import hairmony.entities.Barber;
import hairmony.serviceInterfaces.BarberServiceInf;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/barbers")
@RequiredArgsConstructor
public class BarberController {

    private final BarberServiceInf barberService; // Inject the interface

    @GetMapping
    public List<Barber> getAllBarbers() {
        return barberService.getAllBarbers();
    }

    // e.g. GET /barbers?shopId=123
    @GetMapping(params = "shopId")
    public List<Barber> getBarbersByShopId(@RequestParam Long shopId) {
        return barberService.getBarbersByShopId(shopId);
    }

    @GetMapping("/{barberId}")
    public Barber getBarberById(@PathVariable Long barberId) {
        return barberService.getBarberById(barberId);
    }
}

