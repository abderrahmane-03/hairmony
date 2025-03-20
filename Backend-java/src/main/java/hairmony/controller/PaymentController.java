package hairmony.controller;

import hairmony.dto.ProductRequest;
import hairmony.dto.StripeResponse;
import hairmony.entities.*;
import hairmony.repository.*;
import hairmony.service.NotificationService;
import hairmony.service.ReservationService;
import hairmony.service.StripeService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.stripe.model.checkout.Session;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final StripeService stripeService;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final ReservationService reservationService;
    private final ReservationRepository reservationRepository;
    private final HaircutRepository haircutRepository;
    private final NotificationService notificationService;

    @PostMapping("/stripe-checkout")
    public ResponseEntity<StripeResponse> createCheckoutSession(
            @RequestParam Long userId,
            @RequestBody ProductRequest productRequest) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Payment payment = new Payment();
        payment.setUser(user);
        payment.setAmount(productRequest.getAmount() / 100.0);
        payment.setMethod("STRIPE");
        payment.setDescription("Purchase " + productRequest.getName());
        payment.setStatus("PENDING");
        paymentRepository.save(payment);

        StripeResponse stripeResponse = stripeService.checkoutProducts(productRequest);
        payment.setSessionId(stripeResponse.getSessionId());
        paymentRepository.save(payment);

        return ResponseEntity.ok(stripeResponse);
    }

    @PostMapping("/stripe-checkout-reservation")
    public ResponseEntity<StripeResponse> createReservationCheckoutSession(
            @RequestParam Long reservationId,
            @RequestParam Long userId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));
        if (!"PENDING_PAYMENT".equals(reservation.getStatus())) {
            throw new RuntimeException("Reservation is not pending payment");
        }

        Haircuts haircut = haircutRepository.findByNameContainingIgnoreCase(reservation.getHairstyleChosen())
                .stream().findFirst().orElse(null);
        double amount = (haircut != null) ? haircut.getPrice() : 20.0;

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Payment payment = new Payment();
        payment.setUser(user);
        payment.setAmount(amount);
        payment.setMethod("STRIPE");
        payment.setDescription("Payment for reservation " + reservationId);
        payment.setStatus("PENDING");
        paymentRepository.save(payment);

        ProductRequest productRequest = new ProductRequest();
        productRequest.setAmount((long) (amount * 100));
        productRequest.setQuantity(1L);
        productRequest.setName("Haircut Reservation");
        productRequest.setCurrency("usd");

        Map<String, String> metadata = new HashMap<>();
        metadata.put("reservationId", String.valueOf(reservationId));

        StripeResponse stripeResponse = stripeService.checkoutProducts(productRequest, metadata);
        payment.setSessionId(stripeResponse.getSessionId());
        paymentRepository.save(payment);

        return ResponseEntity.ok(stripeResponse);
    }

    @GetMapping("/stripe-success")
    public ResponseEntity<Void> handleStripeSuccess(
            @RequestParam String sessionId,
            HttpServletResponse response) throws Exception {
        Payment payment = paymentRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("No payment found for session: " + sessionId));
        payment.setStatus("SUCCESS");
        paymentRepository.save(payment);

        double amountPaid = payment.getAmount();
        User user = payment.getUser();

        Session session = Session.retrieve(sessionId);
        String reservationIdStr = session.getMetadata().get("reservationId");

        if (reservationIdStr != null) {
            Long reservationId = Long.parseLong(reservationIdStr);
            Reservation reservation = reservationRepository.findById(reservationId)
                    .orElseThrow(() -> new RuntimeException("Reservation not found"));
            reservation.setStatus("CONFIRMED");
            reservationRepository.save(reservation);
        } else if (amountPaid == 70.0) {
            user.setUnlimitedAccess(true);
            user.setVIPSubscriber(true);
            userRepository.save(user);
            notificationService.createNotification(
                    user,
                    "You are a VIP user now Congratulations!"
            );
        }else if (amountPaid == 40.0) {
            user.setNormalSubscriber(true);
            userRepository.save(user);
            notificationService.createNotification(
                    user,
                    "You are a Subscriber now Congratulations!"
            );
        }else if (amountPaid == 10.0) {
            user.setUnlimitedAccess(true);
            userRepository.save(user);
            notificationService.createNotification(
                    user,
                    "You have UnlimitedAccess now Congratulations!"
            );
        } else if (amountPaid == 5.0) {
            user.setLiveTrialsRemaining(1);
            userRepository.save(user);
            notificationService.createNotification(
                    user,
                    "You have 1 more live camera detection now Congratulations!"
            );
        } else if (amountPaid == 2.0) {
            user.setFreeTrialsRemaining(1);
            userRepository.save(user);
            notificationService.createNotification(
                    user,
                    "You have 1 more upload face detection now Congratulations!"
            );
        }

        String frontendUrl = "http://localhost:4000/PaymentSuccess?sessionId=" + sessionId;
        response.setHeader("Location", frontendUrl);
        return ResponseEntity.status(302).build();
    }

    @GetMapping("/stripe-cancel")
    public ResponseEntity<Void> handleStripeCancel(
            @RequestParam String sessionId,
            HttpServletResponse response) {
        String frontendUrl = "http://localhost:4000/PaymentCancel?sessionId=" + sessionId;
        response.setHeader("Location", frontendUrl);
        return ResponseEntity.status(302).build();
    }

    @GetMapping("/details")
    public ResponseEntity<Payment> getPaymentDetails(@RequestParam String sessionId) {
        Payment payment = paymentRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Payment not found for session: " + sessionId));
        return ResponseEntity.ok(payment);
    }
}