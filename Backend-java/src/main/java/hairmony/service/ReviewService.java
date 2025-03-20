// hairmony/service/ReviewService.java

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
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReservationRepository reservationRepository;
    private final BarberRepository barberRepository;
    private final ClientRepository clientRepository;
    private final NotificationService notificationService;

    public Review createReview(ReviewRequestDTO dto) {
        // 1) Load the Barber
        Barber barber = barberRepository.findById(dto.getBarberId())
                .orElseThrow(() -> new RuntimeException("Barber not found"));

        // 2) Load the Reservation
        Reservation reservation = reservationRepository.findById(dto.getReservationId())
                .orElseThrow(() -> new RuntimeException("Reservation not found"));

        // 3) (Optional) Load the Client
        Client client = null;
        if (dto.getClientId() != null) {
            client = clientRepository.findById(dto.getClientId())
                    .orElseThrow(() -> new RuntimeException("Client not found"));
        }

        // 4) Build the new Review
        Review review = new Review();
        review.setBarber(barber);
        review.setRating(dto.getRating());
        review.setComment(dto.getComment());
        review.setCreatedAt(LocalDateTime.now());
        review.setClient(client);
        review.setReservation(reservation);

        // 5) Calculate the new average rating for the Barber

        // 5a) Count how many existing reviews this barber has
        long reviewCount = reviewRepository.countByBarberId(barber.getId());

        // 5b) Current average
        double oldAverage = barber.getRating();  // e.g. if barber.getRating() is the average

        // 5c) Compute the new average
        double newAverage = ((oldAverage * reviewCount) + dto.getRating()) / (reviewCount + 1);

        // 5d) Update barber’s rating
        barber.setRating(newAverage);

        // 6) Save the Review
        Review savedReview = reviewRepository.save(review);

        // 7) Save the Barber with updated average rating
        barberRepository.save(barber);
        notificationService.createNotification(
                client,
                "Reservation #" + reservation.getId() + " is rated!"
        );
        notificationService.createNotification(
                barber,
                "Reservation #" + reservation.getId() + " is rated!"
        );

        return savedReview;
    }
}
