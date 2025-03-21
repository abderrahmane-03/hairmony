package hairmony.serviceInterfaces;


import hairmony.dto.ReservationRequestDTO;
import hairmony.entities.Reservation;

import java.util.List;

public interface ReservationServiceInf {
    Reservation createReservation(ReservationRequestDTO dto);
    Reservation updateStatus(Long reservationId, String newStatus);
    List<Reservation> getReservationsByBarber(Long barberId);
    List<Reservation> getReservationsByClient(Long clientId);
}
