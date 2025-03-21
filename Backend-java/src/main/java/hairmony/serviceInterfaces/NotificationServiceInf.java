package hairmony.serviceInterfaces;

import hairmony.entities.User;

public interface NotificationServiceInf {
    void createNotification(User recipient, String message);
}
