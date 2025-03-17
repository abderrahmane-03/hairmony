import axios from "axios";

const API_URL = "http://localhost:8443/auth"; // Adjust based on your backend

export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    // response.data => { token, role, id }

    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    if (response.data.role) {
      localStorage.setItem("role", response.data.role);
    }
    if (response.data.id) {
      localStorage.setItem("id", response.data.id.toString()); // store as string
    }

    window.dispatchEvent(new Event('login'));
    return response.data;
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
export function getUserId() {
  return localStorage.getItem("id"); 
}


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
