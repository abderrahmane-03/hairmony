package hairmony.controller;

import hairmony.entities.Notification;
import hairmony.entities.User;
import hairmony.repository.NotificationRepository;
import hairmony.repository.UserRepository;
import hairmony.service.CustomUserDetails;
import hairmony.serviceInterfaces.NotificationServiceInf;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @GetMapping("/all")
    public ResponseEntity<List<Notification>> getUserNotifications(@AuthenticationPrincipal UserDetails userDetails) {
        if (!(userDetails instanceof CustomUserDetails)) {
            throw new IllegalStateException("Invalid UserDetails implementation");
        }
        Long userId = ((CustomUserDetails) userDetails).getUser().getId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Notification> notifications = notificationRepository.findByRecipientOrderByCreatedAtDesc(user);
        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        notification.setRead(true);
        notificationRepository.save(notification);
        return ResponseEntity.noContent().build();
    }
}
