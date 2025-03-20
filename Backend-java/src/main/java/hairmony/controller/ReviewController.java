// hairmony/controller/ReviewController.java

package hairmony.controller;

import hairmony.dto.ReviewRequestDTO;
import hairmony.entities.Review;
import hairmony.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/rate")// consumes = "application/json" by default
    public Review createReview(@RequestBody ReviewRequestDTO dto) {
        return reviewService.createReview(dto);
    }
}
