package hairmony.serviceInterfaces;


import hairmony.dto.ProductRequest;
import hairmony.dto.StripeResponse;

import java.util.Map;

public interface StripeServiceInf {
    StripeResponse checkoutProducts(ProductRequest productRequest, Map<String, String> metadata);
    StripeResponse checkoutProducts(ProductRequest productRequest);
}
