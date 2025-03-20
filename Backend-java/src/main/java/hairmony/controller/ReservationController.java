package hairmony.controller;

import hairmony.dto.ReservationRequestDTO;
import hairmony.dto.ReservationStatusDTO;
import hairmony.entities.Reservation;
import hairmony.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reservation")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    // Create a new reservation
    @PostMapping("/create")
    public Reservation createReservation(@RequestBody ReservationRequestDTO dto) {
        return reservationService.createReservation(dto);
    }

    @PutMapping("/{reservationId}/status")
    public Reservation updateReservationStatus(
            @PathVariable Long reservationId,
            @RequestBody ReservationStatusDTO statusDto
    ) {
        return reservationService.updateStatus(reservationId, statusDto.getStatus());
    }

    // e.g. GET /api/reservations/barber/123
    @GetMapping("/barber/{barberId}")
    public List<Reservation> getReservationsByBarber(@PathVariable Long barberId) {
        return reservationService.getReservationsByBarber(barberId);
    }

    // e.g. GET /api/reservations/client/456
    @GetMapping("/client/{clientId}")
    public List<Reservation> getReservationsByClient(@PathVariable Long clientId) {
        return reservationService.getReservationsByClient(clientId);
    }
}
