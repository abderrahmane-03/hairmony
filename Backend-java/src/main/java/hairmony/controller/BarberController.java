package hairmony.controller;

import hairmony.entities.Barber;
import hairmony.service.BarberService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/barbers")
@RequiredArgsConstructor
public class BarberController {

    private final BarberService barberService;

    @GetMapping
    public List<Barber> getAllBarbers() {
        return barberService.getAllBarbers();
    }

    // e.g. GET /api/barbers?shopId=123
    @GetMapping(params = "shopId")
    public List<Barber> getBarbersByShopId(@RequestParam Long shopId) {
        return barberService.getBarbersByShopId(shopId);
    }

    @GetMapping("/{barberId}")
    public Barber getBarberById(@PathVariable Long barberId) {
        return barberService.getBarberById(barberId);
    }
}
