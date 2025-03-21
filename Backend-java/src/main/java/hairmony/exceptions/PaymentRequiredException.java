package hairmony.exceptions;

import lombok.Getter;

@Getter
public class PaymentRequiredException extends RuntimeException {
    private Long reservationId;
    private Double amount;

    public PaymentRequiredException(String message, Long reservationId, Double amount) {
        super(message);
        this.reservationId = reservationId;
        this.amount = amount;
    }


}