// src/contexts/NotificationsContext.jsx
import  { createContext, useContext, useReducer, useEffect } from "react";
import { getNotifications, markAsRead } from "../services/NotificationsService";
import { useAuth } from "./AuthContext";

const NotificationsContext = createContext();

const initialState = {
  notifications: [],
  loading: false,
  error: null,
};

function notificationsReducer(state, action) {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_NOTIFICATIONS":
      return { ...state, notifications: action.payload, loading: false };
    case "MARK_AS_READ":
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

// eslint-disable-next-line react/prop-types
export function NotificationsProvider({ children }) {
  const [state, dispatch] = useReducer(notificationsReducer, initialState);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return;
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const data = await getNotifications();
        dispatch({ type: "SET_NOTIFICATIONS", payload: data });
      } catch (err) {
        dispatch({ type: "SET_ERROR", payload: err.message || "Failed to load notifications" });
      }
    };

    fetchData();
  }, [isAuthenticated]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      dispatch({ type: "MARK_AS_READ", payload: notificationId });
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        notifications: state.notifications,
        loading: state.loading,
        error: state.error,
        markAsRead: handleMarkAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
