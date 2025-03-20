package hairmony.service;

import hairmony.entities.*;
import hairmony.exceptions.PaymentRequiredException;
import hairmony.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import hairmony.dto.ReservationRequestDTO;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final ClientRepository clientRepository;
    private final BarberRepository barberRepository;
    private final HaircutRepository haircutRepository;
    private final NotificationService  notificationService;

    public Reservation createReservation(ReservationRequestDTO dto) {
        // Find client and barber
        Client client = clientRepository.findById(dto.getClientId())
                .orElseThrow(() -> new RuntimeException("Client not found"));
        Barber barber = barberRepository.findById(dto.getBarberId())
                .orElseThrow(() -> new RuntimeException("Barber not found"));

        // Get haircut price (if available)
        Haircuts haircut = haircutRepository.findByNameContainingIgnoreCase(dto.getHairstyleChosen())
                .stream().findFirst().orElse(null);
        double haircutPrice = (haircut != null) ? haircut.getPrice() : 20.0;

        // Count reservations this month
        int usageThisMonth = countReservationsThisMonth(client.getId());

        // Check subscription and free haircut eligibility
        boolean hasFreeHaircut = false;
        if (client.isVIPSubscriber() && usageThisMonth < 3) {
            hasFreeHaircut = true;
        } else if (client.isNormalSubscriber() && usageThisMonth < 2) {
            hasFreeHaircut = true;
        }

        // Create reservation
        Reservation reservation = new Reservation();
        reservation.setDate(dto.getDate());
        reservation.setTime(dto.getTime());
        reservation.setHairstyleChosen(dto.getHairstyleChosen());
        reservation.setClient(client);
        reservation.setBarber(barber);

        if (hasFreeHaircut) {
            reservation.setStatus("CONFIRMED");
            notificationService.createNotification(
                    client,
                    "Reservation #" + reservation.getId() + " is confirmed and paid!"
            );

        } else {
            reservation.setStatus("PENDING_PAYMENT");
            notificationService.createNotification(
                    client,
                    "Reservation #" + reservation.getId() + " is confirmed and waiting for payment!"
            );
        }

        reservationRepository.save(reservation);
        notificationService.createNotification(
                barber,
                "Reservation #" + reservation.getId() + " you have a new reservation !"
        );

        // If payment is required, throw exception with reservation details
        if (!hasFreeHaircut) {
            throw new PaymentRequiredException(
                    "Payment required for this haircut",
                    reservation.getId(),
                    haircutPrice
            );
        }

        return reservation;
    }



    public Reservation updateStatus(Long reservationId, String newStatus) {
        // 1) Find the reservation
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        // 2) Update status
        reservation.setStatus(newStatus);
        notificationService.createNotification(
                reservation.getClient(),
                "Reservation #" + reservation.getId() + " is changed in status new status #!"+newStatus
        );
        // 3) Save
        return reservationRepository.save(reservation);
    }
    private int countReservationsThisMonth(Long clientId) {
        List<Reservation> all = reservationRepository.findAll();
        LocalDate now = LocalDate.now();
        int currentMonth = now.getMonthValue();
        int currentYear = now.getYear();

        return (int) all.stream()
                .filter(r -> r.getClient().getId().equals(clientId) &&
                        r.getDate().getYear() == currentYear &&
                        r.getDate().getMonthValue() == currentMonth &&
                        "CONFIRMED".equals(r.getStatus()))
                .count();
    }
    public List<Reservation> getReservationsByBarber(Long barberId) {
        return reservationRepository.findByBarberId(barberId);
    }

    public List<Reservation> getReservationsByClient(Long clientId) {
        return reservationRepository.findByClientId(clientId);
    }
}