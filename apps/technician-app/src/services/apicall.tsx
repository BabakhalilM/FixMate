import axios from "axios";
import { ApiClient, createAuthApi } from "@fixmate/api-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.TECHNICIAN_PUBLIC_API_URL ||"http://localhost:5000/api" ||"http://192.168.137.1:5000/api";

export const apiClient = new ApiClient({
  baseUrl: API_URL,

  getToken: async () => {
    const token = await AsyncStorage.getItem("auth_token");
    return token;
  },
});
export const authApi = createAuthApi(apiClient);

const api = axios.create({
  baseURL: process.env.API_URL ||"http://localhost:5000/api" || "http://192.168.137.1:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error getting token:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 401) {
        // Unauthorized - clear token and redirect to login
        await AsyncStorage.removeItem("auth_token");
        await AsyncStorage.removeItem("auth_user");
        // You can emit an event here to navigate to login
      }
    }
    return Promise.reject(error);
  },
);

export default api;
