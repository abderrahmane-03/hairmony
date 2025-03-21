package hairmony.controller;

import hairmony.entities.Barbershop;
import hairmony.service.BarbershopService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/barbershops")
@RequiredArgsConstructor
public class BarbershopController {

    private final BarbershopService barbershopService;

    @GetMapping
    public List<Barbershop> getAllShops() {
        return barbershopService.getAllBarbershops();
    }

    @GetMapping("/{shopId}")
    public Barbershop getBarbershop(@PathVariable Long shopId) {
        return barbershopService.getBarbershopById(shopId);
    }
}
