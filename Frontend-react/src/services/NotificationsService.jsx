// services/NotificationService.js
import axios from "../config/interceptor";

const API_URL = "http://localhost:8443"; // Adjust based on your backend

export const getNotifications = async () => {
  try {
    const response = await axios.get(`${API_URL}/notifications/all`);
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const markAsRead = async (notificationId) => {
  try {
    await axios.patch(`${API_URL}/notifications/${notificationId}/read`);
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};