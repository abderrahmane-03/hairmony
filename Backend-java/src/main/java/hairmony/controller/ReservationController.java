package hairmony.controller;

import hairmony.dto.ReservationRequestDTO;
import hairmony.dto.ReservationStatusDTO;
import hairmony.entities.Reservation;
import hairmony.serviceInterfaces.ReservationServiceInf;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reservation")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationServiceInf reservationService; // interface

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

    @GetMapping("/barber/{barberId}")
    public List<Reservation> getReservationsByBarber(@PathVariable Long barberId) {
        return reservationService.getReservationsByBarber(barberId);
    }

    @GetMapping("/client/{clientId}")
    public List<Reservation> getReservationsByClient(@PathVariable Long clientId) {
        return reservationService.getReservationsByClient(clientId);
    }
}
