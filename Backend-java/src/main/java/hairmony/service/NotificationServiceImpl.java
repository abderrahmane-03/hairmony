package hairmony.service;

import hairmony.entities.Notification;
import hairmony.entities.User;
import hairmony.repository.NotificationRepository;
import hairmony.serviceInterfaces.NotificationServiceInf;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationServiceInf {

    private final NotificationRepository notificationRepository;

    @Override
    public void createNotification(User recipient, String message) {
        Notification notif = new Notification();
        notif.setRecipient(recipient);
        notif.setMessage(message);
        notif.setCreatedAt(LocalDateTime.now());
        notif.setRead(false);
        notificationRepository.save(notif);
    }
}
