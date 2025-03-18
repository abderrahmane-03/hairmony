package hairmony.service;

import com.stripe.param.checkout.SessionCreateParams;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;

import hairmony.dto.ProductRequest;
import hairmony.dto.StripeResponse;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class StripeService {


    public StripeResponse checkoutProducts(ProductRequest productRequest, Map<String, String> metadata) {
        Stripe.apiKey = "sk_test_51P96uGRsGbsVRyquYCUoPfCE4a4jXhnkgNfNwFFL2NOymgaeNV1EEY0nuCt23aLIOdCF8Hsh89qP8CgR2e1woXO900kmr3C9Jq";

        SessionCreateParams.LineItem.PriceData.ProductData productData =
                SessionCreateParams.LineItem.PriceData.ProductData.builder()
                        .setName(productRequest.getName())
                        .build();

        SessionCreateParams.LineItem.PriceData priceData =
                SessionCreateParams.LineItem.PriceData.builder()
                        .setCurrency(productRequest.getCurrency() != null ? productRequest.getCurrency() : "USD")
                        .setUnitAmount(productRequest.getAmount())
                        .setProductData(productData)
                        .build();

        SessionCreateParams.LineItem lineItem =
                SessionCreateParams.LineItem.builder()
                        .setQuantity(productRequest.getQuantity())
                        .setPriceData(priceData)
                        .build();

        // Start building session parameters
        SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl("http://localhost:8443/payment/stripe-success?sessionId={CHECKOUT_SESSION_ID}")
                .setCancelUrl("http://localhost:8443/payment/stripe-cancel?sessionId={CHECKOUT_SESSION_ID}")
                .addLineItem(lineItem);

        // Incorporate metadata if provided
        if (metadata != null) {
            for (Map.Entry<String, String> entry : metadata.entrySet()) {
                paramsBuilder.putMetadata(entry.getKey(), entry.getValue());
            }
        }

        SessionCreateParams params = paramsBuilder.build();

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
    public StripeResponse checkoutProducts(ProductRequest productRequest) {
        Stripe.apiKey = "sk_test_51P96uGRsGbsVRyquYCUoPfCE4a4jXhnkgNfNwFFL2NOymgaeNV1EEY0nuCt23aLIOdCF8Hsh89qP8CgR2e1woXO900kmr3C9Jq";

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