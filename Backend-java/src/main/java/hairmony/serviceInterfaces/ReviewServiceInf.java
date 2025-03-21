package hairmony.serviceInterfaces;

import hairmony.dto.ReviewRequestDTO;
import hairmony.entities.Review;

public interface ReviewServiceInf {
    Review createReview(ReviewRequestDTO dto);
}
