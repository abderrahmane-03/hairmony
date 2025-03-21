package hairmony.service;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import hairmony.dto.ProductRequest;
import hairmony.dto.StripeResponse;
import hairmony.serviceInterfaces.StripeServiceInf;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class StripeServiceImpl implements StripeServiceInf {


    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    @Override
    public StripeResponse checkoutProducts(ProductRequest productRequest, Map<String, String> metadata) {
        Stripe.apiKey = stripeSecretKey;

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

        SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl("http://localhost:8443/payment/stripe-success?sessionId={CHECKOUT_SESSION_ID}")
                .setCancelUrl("http://localhost:8443/payment/stripe-cancel?sessionId={CHECKOUT_SESSION_ID}")
                .addLineItem(lineItem);

        if (metadata != null) {
            metadata.forEach(paramsBuilder::putMetadata);
        }

        SessionCreateParams params = paramsBuilder.build();
        try {
            Session session = Session.create(params);
            return StripeResponse.builder()
                    .status("SUCCESS")
                    .message("Payment session created")
                    .sessionId(session.getId())
                    .sessionUrl(session.getUrl())
                    .build();
        } catch (StripeException e) {
            throw new RuntimeException("Stripe session creation failed", e);
        }
    }

    @Override
    public StripeResponse checkoutProducts(ProductRequest productRequest) {
        // Overload that calls the other method with null metadata
        return checkoutProducts(productRequest, null);
    }
}
