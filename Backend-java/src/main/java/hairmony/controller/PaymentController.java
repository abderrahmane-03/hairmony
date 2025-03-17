package hairmony.controller;

import hairmony.entities.Payment;
import hairmony.entities.User;
import hairmony.repository.PaymentRepository;
import hairmony.repository.UserRepository;
import hairmony.service.StripeService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import hairmony.dto.ProductRequest;
import hairmony.dto.StripeResponse;


@RestController
@RequestMapping("/payment")

@RequiredArgsConstructor
public class PaymentController {

    private final StripeService stripeService;       // from your Stripe integration
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;

    /**
     * Create a new Stripe checkout session.
     *
     * @param userId         ID of the user who is paying
     * @param productRequest Contains amount (in cents), quantity, name, currency
     */
    @PostMapping("/stripe-checkout")
    public ResponseEntity<StripeResponse> createCheckoutSession(
            @RequestParam Long userId,
            @RequestBody ProductRequest productRequest) {

        // 1) Find the user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2) Create a Payment record with status = "PENDING"
        Payment payment = new Payment();
        payment.setUser(user);
        payment.setAmount(productRequest.getAmount() / 100.0); // if 200 => $2.00
        payment.setMethod("STRIPE");
        payment.setDescription("Purchase " + productRequest.getName());
        payment.setStatus("PENDING");
        paymentRepository.save(payment);

        // 3) Call Stripe to create the session
        StripeResponse stripeResponse = stripeService.checkoutProducts(productRequest);

        // 4) Store the sessionId in your Payment record
        payment.setSessionId(stripeResponse.getSessionId());
        paymentRepository.save(payment);

        // 5) Return the session URL to the frontend so user can redirect
        return ResponseEntity.ok(stripeResponse);
    }

    /**
     * Stripe success callback. Stripe will redirect to this URL with ?sessionId=...
     */
    @GetMapping("/stripe-success")
    public ResponseEntity<Void> handleStripeSuccess(@RequestParam String sessionId, HttpServletResponse response) {
        Payment payment = paymentRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("No payment found for session: " + sessionId));

        double amountPaid = payment.getAmount();
        User user = payment.getUser();

        if (amountPaid == 10.0) {
            user.setUnlimitedAccess(true);
            userRepository.save(user);
        } else if (amountPaid == 5.0) {

            user.setLiveTrialsRemaining(1);
            userRepository.save(user);
        }else if (amountPaid == 2.0) {

            user.setFreeTrialsRemaining(1);
            userRepository.save(user);
        }

        // 1) Mark the Payment as SUCCESS
        payment.setStatus("SUCCESS");
        paymentRepository.save(payment);

        // 2) Redirect user to frontend's success page
        String frontendUrl = "http://localhost:4000/PaymentSuccess?sessionId=" + sessionId;
        response.setHeader("Location", frontendUrl);
        return ResponseEntity.status(302).build(); // HTTP 302 Found (Redirect)
    }


    /**
     * Stripe cancel callback.
     */
    @GetMapping("/stripe-cancel")
    public ResponseEntity<Void> handleStripeCancel(@RequestParam String sessionId, HttpServletResponse response) {
        String frontendUrl = "http://localhost:4000/PaymentCancel?sessionId=" + sessionId;
        response.setHeader("Location", frontendUrl);
        return ResponseEntity.status(302).build(); // 302 Redirect
    }


    @GetMapping("/details")
    public ResponseEntity<Payment> getPaymentDetails(@RequestParam String sessionId) {
        Payment payment = paymentRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new RuntimeException("Payment not found for session: " + sessionId));

        return ResponseEntity.ok(payment);
    }

}

