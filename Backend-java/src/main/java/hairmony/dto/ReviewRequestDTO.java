// hairmony/dto/ReviewRequestDTO.java

package hairmony.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewRequestDTO {
    private Long barberId;   // which barber is being rated
    private int rating;      // the star rating (1..5)
    private String comment;  // optional text
    private Long clientId;
    private Long reservationId;   // optionally track which client wrote it
}
