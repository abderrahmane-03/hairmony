package hairmony.service;

import hairmony.dto.ReviewRequestDTO;
import hairmony.entities.Barber;
import hairmony.entities.Client;
import hairmony.entities.Reservation;
import hairmony.entities.Review;
import hairmony.repository.BarberRepository;
import hairmony.repository.ClientRepository;
import hairmony.repository.ReservationRepository;
import hairmony.repository.ReviewRepository;
import hairmony.serviceInterfaces.NotificationServiceInf;
import hairmony.serviceInterfaces.ReviewServiceInf;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewServiceInf {

    private final ReviewRepository reviewRepository;
    private final ReservationRepository reservationRepository;
    private final BarberRepository barberRepository;
    private final ClientRepository clientRepository;
    private final NotificationServiceInf notificationService;

    @Override
    public Review createReview(ReviewRequestDTO dto) {
        Barber barber = barberRepository.findById(dto.getBarberId())
                .orElseThrow(() -> new RuntimeException("Barber not found"));

        Reservation reservation = reservationRepository.findById(dto.getReservationId())
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        Client client = null;
        if (dto.getClientId() != null) {
            client = clientRepository.findById(dto.getClientId())
                    .orElseThrow(() -> new RuntimeException("Client not found"));
        }

        Review review = new Review();
        review.setBarber(barber);
        review.setRating(dto.getRating());
        review.setComment(dto.getComment());
        review.setCreatedAt(LocalDateTime.now());
        review.setClient(client);
        review.setReservation(reservation);

        // Calculate the new average rating
        long reviewCount = reviewRepository.countByBarberId(barber.getId());
        double oldAverage = barber.getRating();
        double newAverage = ((oldAverage * reviewCount) + dto.getRating()) / (reviewCount + 1);

        barber.setRating(newAverage);

        Review savedReview = reviewRepository.save(review);
        barberRepository.save(barber);

        // Example notifications
        if (client != null) {
            notificationService.createNotification(
                    client,
                    "Reservation #" + reservation.getId() + " is rated!"
            );
        }
        notificationService.createNotification(
                barber,
                "Reservation #" + reservation.getId() + " was rated with " + dto.getRating() + " stars!"
        );

        return savedReview;
    }
}
