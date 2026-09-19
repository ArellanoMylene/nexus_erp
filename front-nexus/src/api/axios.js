import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    // 404 = "not found / no data" — expected in many places, callers handle it
    // Only log unexpected errors (5xx, network, etc.)
    if (status !== 404) {
      console.error("API Error:", error.response?.data || error.message);
    }
    return Promise.reject(error);
  },
);

export default api;
