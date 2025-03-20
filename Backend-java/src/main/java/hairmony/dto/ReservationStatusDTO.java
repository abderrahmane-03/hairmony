package hairmony.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReservationStatusDTO {
    private String status; // e.g. "CANCELLED", "COMPLETED", etc.
}
