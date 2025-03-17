package hairmony.controller;

import hairmony.entities.User;
import hairmony.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/usage")
@RequiredArgsConstructor
public class UsageController {

    private final UserRepository userRepository;

    @GetMapping("/check")
    public Map<String, String> checkUsage(@RequestParam String feature, @RequestParam Long userId) {
        // 1. Load user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. If user has unlimited access => OK
        if (user.isUnlimitedAccess()) {
            return Map.of("status", "OK");
        }

        // 3. If user has free trial left => decrement
        if ("upload".equals(feature)) {
            if (user.getFreeTrialsRemaining() > 0) {
                user.setFreeTrialsRemaining(user.getFreeTrialsRemaining() - 1);
                userRepository.save(user);
                return Map.of("status", "OK");
            } else {
                // Or check if user paid for this feature
                return Map.of("status", "NEED_PAYMENT", "message", "Pay $2 for another upload");
            }
        } else if ("live".equals(feature)) {
            if (user.getLiveTrialsRemaining() > 0) {
                user.setLiveTrialsRemaining(user.getLiveTrialsRemaining() - 1);
                userRepository.save(user);
                return Map.of("status", "OK");
            } else {
                return Map.of("status", "NEED_PAYMENT", "message", "Pay $5 to use Live Detection");
            }
        }

        // default
        return Map.of("status", "NEED_PAYMENT", "message", "Payment required");
    }
}
