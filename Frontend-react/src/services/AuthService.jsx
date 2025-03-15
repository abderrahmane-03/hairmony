import axios from "axios";

const API_URL = "http://localhost:8443/auth"; // Adjust based on your backend

export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    if (response.data.role) {
      localStorage.setItem("role", response.data.role);
    }
    window.dispatchEvent(new Event('login'));
    return response.data; // { token: "...", role: "BARBER" or "CLIENT" }
  } catch (error) {
    throw error.response?.data || "Login failed";
  }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
};

export const getToken = () => localStorage.getItem("token");
export const getRole = () => localStorage.getItem("role");

export const isAuthenticated = () => !!getToken();

// Add Axios interceptor to attach token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
