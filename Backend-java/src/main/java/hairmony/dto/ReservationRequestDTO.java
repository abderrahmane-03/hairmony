package hairmony.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class ReservationRequestDTO {
    private Long clientId;
    private Long barberId;
    private LocalDate date;
    private LocalTime time;
    private String hairstyleChosen;
}
