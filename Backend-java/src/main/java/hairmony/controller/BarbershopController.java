package hairmony.controller;

import hairmony.entities.Barbershop;
import hairmony.serviceInterfaces.BarbershopServiceInf;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/barbershops")
@RequiredArgsConstructor
public class BarbershopController {

    private final BarbershopServiceInf barbershopService; // Inject the interface

    @GetMapping
    public List<Barbershop> getAllShops() {
        return barbershopService.getAllBarbershops();
    }

    @GetMapping("/{shopId}")
    public Barbershop getBarbershop(@PathVariable Long shopId) {
        return barbershopService.getBarbershopById(shopId);
    }

    @PostMapping
    public Barbershop createBarbershop(@RequestBody Barbershop shop) {
        return barbershopService.createBarbershop(shop);
    }
}
