import axios from "axios";
import { useAuth } from "@/hooks/use-auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Set Content-Type header only if not already set (for file uploads)
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token and user data
      localStorage.removeItem("token");
      const auth = useAuth.getState();
      auth.setUser(null);
      auth.setToken(null);
      
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/auth/login')) {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api; 