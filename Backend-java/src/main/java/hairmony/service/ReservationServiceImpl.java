package hairmony.service;

import hairmony.dto.ReservationRequestDTO;
import hairmony.entities.*;
import hairmony.exceptions.PaymentRequiredException;
import hairmony.repository.*;
import hairmony.serviceInterfaces.NotificationServiceInf;
import hairmony.serviceInterfaces.ReservationServiceInf;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservationServiceImpl implements ReservationServiceInf {

    private final ReservationRepository reservationRepository;
    private final ClientRepository clientRepository;
    private final BarberRepository barberRepository;
    private final HaircutRepository haircutRepository;
    private final NotificationServiceInf notificationService;

    @Override
    public Reservation createReservation(ReservationRequestDTO dto) {
        Client client = clientRepository.findById(dto.getClientId())
                .orElseThrow(() -> new RuntimeException("Client not found"));
        Barber barber = barberRepository.findById(dto.getBarberId())
                .orElseThrow(() -> new RuntimeException("Barber not found"));

        Haircuts haircut = haircutRepository.findByNameContainingIgnoreCase(dto.getHairstyleChosen())
                .stream().findFirst().orElse(null);
        double haircutPrice = (haircut != null) ? haircut.getPrice() : 20.0;

        int usageThisMonth = countReservationsThisMonth(client.getId());

        boolean hasFreeHaircut = false;
        if (client.isVIPSubscriber() && usageThisMonth < 3) {
            hasFreeHaircut = true;
        } else if (client.isNormalSubscriber() && usageThisMonth < 2) {
            hasFreeHaircut = true;
        }

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
                    "Reservation for " + reservation.getHairstyleChosen() + " is confirmed and paid!"
            );
        }
        if(reservation.isPaid == true){
            reservation.setPaid(true);
            notificationService.createNotification(
                    client,
                    "your reservation is paid congrats"+ reservation.getHairstyleChosen()
            );
        }
            else {
            reservation.setStatus("PENDING_PAYMENT");
            notificationService.createNotification(
                    client,
                    "Reservation for " + reservation.getHairstyleChosen() + " is confirmed and waiting for payment!"
            );
        }

        reservationRepository.save(reservation);

        notificationService.createNotification(
                barber,
                "New reservation for " + reservation.getHairstyleChosen()
        );

        if (!hasFreeHaircut) {
            throw new PaymentRequiredException(
                    "Payment required for this haircut",
                    reservation.getId(),
                    haircutPrice
            );
        }

        return reservation;
    }

    @Override
    public Reservation updateStatus(Long reservationId, String newStatus) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        reservation.setStatus(newStatus);
        reservationRepository.save(reservation);

        notificationService.createNotification(
                reservation.getClient(),
                "Reservation #" + reservation.getId() + " changed status to: " + newStatus
        );
        return reservation;
    }

    @Override
    public List<Reservation> getReservationsByBarber(Long barberId) {
        return reservationRepository.findByBarberId(barberId);
    }

    @Override
    public List<Reservation> getReservationsByClient(Long clientId) {
        return reservationRepository.findByClientId(clientId);
    }

    private int countReservationsThisMonth(Long clientId) {
        List<Reservation> all = reservationRepository.findAll();
        LocalDate now = LocalDate.now();
        int currentMonth = now.getMonthValue();
        int currentYear = now.getYear();

        return (int) all.stream()
                .filter(r -> r.getClient().getId().equals(clientId)
                        && r.getDate().getYear() == currentYear
                        && r.getDate().getMonthValue() == currentMonth
                        && "CONFIRMED".equals(r.getStatus()))
                .count();
    }
}
