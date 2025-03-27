import axios from "axios";

const API_URL = "http://localhost:8443/auth"; // Adjust based on your backend

export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    // response.data => { token, role, id }

    if (response.data.token) {
      sessionStorage.setItem("token", response.data.token);
    }
    if (response.data.role) {
      sessionStorage.setItem("role", response.data.role);
    }
    if (response.data.id) {
      sessionStorage.setItem("id", response.data.id.toString()); // store as string
    }

    window.dispatchEvent(new Event('login'));
    return response.data;
  } catch (error) {
    throw error.response?.data || "Login failed";
  }
};


export const logout = () => {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("role");
  sessionStorage.removeItem("id");
};

export const getToken = () => sessionStorage.getItem("token");
export const getRole = () => sessionStorage.getItem("role");
export const getUserId = () => sessionStorage.getItem("id"); 




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
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;
    if (status === 500) {
      logout();
    }
    return Promise.reject(error);
  }
);