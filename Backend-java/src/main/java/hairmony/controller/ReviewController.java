package hairmony.controller;

import hairmony.dto.ReviewRequestDTO;
import hairmony.entities.Review;
import hairmony.serviceInterfaces.ReviewServiceInf;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewServiceInf reviewService;

    @PostMapping("/rate")
    public Review createReview(@RequestBody ReviewRequestDTO dto) {
        return reviewService.createReview(dto);
    }
}
