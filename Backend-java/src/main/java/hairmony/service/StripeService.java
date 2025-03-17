package hairmony.service;

import com.stripe.param.checkout.SessionCreateParams;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;

import hairmony.dto.ProductRequest;
import hairmony.dto.StripeResponse;
import org.springframework.stereotype.Service;

@Service
public class StripeService {


    public StripeResponse checkoutProducts(ProductRequest productRequest) {
        Stripe.apiKey = "sk";

        SessionCreateParams.LineItem.PriceData.ProductData productData =
                SessionCreateParams.LineItem.PriceData.ProductData.builder()
                        .setName(productRequest.getName())
                        .build();

        SessionCreateParams.LineItem.PriceData priceData =
                SessionCreateParams.LineItem.PriceData.builder()
                        .setCurrency(productRequest.getCurrency() != null ? productRequest.getCurrency() : "USD")
                        .setUnitAmount(productRequest.getAmount()) // e.g. 200 for $2.00
                        .setProductData(productData)
                        .build();

        SessionCreateParams.LineItem lineItem =
                SessionCreateParams.LineItem.builder()
                        .setQuantity(productRequest.getQuantity())
                        .setPriceData(priceData)
                        .build();

        SessionCreateParams params =
                SessionCreateParams.builder()
                        .setMode(SessionCreateParams.Mode.PAYMENT)
                        .setSuccessUrl("http://localhost:8443/payment/stripe-success?sessionId={CHECKOUT_SESSION_ID}")
                        .setCancelUrl("http://localhost:8443/payment/stripe-cancel?sessionId={CHECKOUT_SESSION_ID}")
                        .addLineItem(lineItem)
                        .build();

        Session session;
        try {
            session = Session.create(params);
        } catch (StripeException e) {
            throw new RuntimeException("Stripe session creation failed", e);
        }

        return StripeResponse.builder()
                .status("SUCCESS")
                .message("Payment session created")
                .sessionId(session.getId())
                .sessionUrl(session.getUrl())
                .build();
    }
}
