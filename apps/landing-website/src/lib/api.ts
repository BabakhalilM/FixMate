// lib/api.ts
import axios from "axios";
import Cookies from "js-cookie";
import type { LoginCredentials, RegisterData, AuthResponse, ApiResponse } from "@fixmate/shared-types";
import { authApi } from "./apicall";
// import authApi from "@fixmate/api-client";

// API Base URL - your Node.js backend
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor - add auth token to every request
api.interceptors.request.use(
  (config) => {
    // Get token from cookies or localStorage
    const token =
      Cookies.get("auth_token") || localStorage.getItem("auth_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return response.data; // Return only the data
  },
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove("auth_token");
      Cookies.remove("auth_user");
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");

      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login")
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

export const loginUser = async (
  credentials: LoginCredentials,
): Promise<ApiResponse<AuthResponse>> => {
  try {
    const response = await authApi.login(credentials);
    if (response?.success && response?.data) {
      const { token, refreshToken, user } = response.data;

      Cookies.set("auth_token", token, { expires: 7 }); // 7 days
      Cookies.set("auth_refresh_token", refreshToken, { expires: 30 });
      Cookies.set("auth_user", JSON.stringify(user), { expires: 7 });

      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_refresh_token", refreshToken);
      localStorage.setItem("auth_user", JSON.stringify(user));
    }

    return response;
  } catch (error: any) {
    throw error.response?.data || { success: false, error: "Login failed" };
  }
};

// Register API call
export const registerUser = async (
  data: RegisterData,
): Promise<ApiResponse<AuthResponse>> => {
  try {
    const response = await authApi.register(data);
    return response ;
  } catch (error: any) {
    throw (
      error.response?.data || { success: false, error: "Registration failed" }
    );
  }
};

// Logout API call
export const logoutUser = async (): Promise<void> => {
  try {
    // Call logout API
    await api.post("/auth/logout");
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    Cookies.remove("auth_token");
    Cookies.remove("auth_refresh_token");
    Cookies.remove("auth_user");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_refresh_token");
    localStorage.removeItem("auth_user");

    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await api.get("/auth/me");
    return response.data.data;
  } catch (error) {
    return null;
  }
};

// Refresh token
export const refreshToken = async (): Promise<string | null> => {
  try {
    const refreshToken =
      Cookies.get("auth_refresh_token") ||
      localStorage.getItem("auth_refresh_token");
    if (!refreshToken) return null;

    const response = await api.post("/auth/refresh-token", { refreshToken });
    const newToken = response.data.data.token;

    // Update tokens
    Cookies.set("auth_token", newToken, { expires: 7 });
    localStorage.setItem("auth_token", newToken);

    return newToken;
  } catch (error) {
    return null;
  }
};
