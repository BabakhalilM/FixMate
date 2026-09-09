// apps/technician-app/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {
  ApiResponse,
  AuthResponse,
  TechnicianUser,
} from "@fixmate/shared-types";
import { authApi } from "@/services/apicall";

interface AuthContextType {
  user: TechnicianUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: React.Dispatch<React.SetStateAction<boolean>>;

  isRegistered: boolean;
  setIsRegistered: React.Dispatch<React.SetStateAction<boolean>>;

  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<ApiResponse<AuthResponse>>;
  logout: () => Promise<void>;
  updateUser: (user: TechnicianUser) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<TechnicianUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const onboarding = await AsyncStorage.getItem("onboardingCompleted");

      const registered = await AsyncStorage.getItem("registered");

      setHasCompletedOnboarding(onboarding === "true");
      setIsRegistered(registered === "true");

      // --------------------------------
      // 1. Check token from URL
      // --------------------------------

      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get("token");

      let token = await AsyncStorage.getItem("auth_token");

      if (urlToken) {
        console.log("Token received from main application");

        token = urlToken;

        await AsyncStorage.setItem("auth_token", urlToken);

        // Remove token from URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }

      // --------------------------------
      // 2. No token → not authenticated
      // --------------------------------

      if (!token) {
        console.log("No authentication token");
        return;
      }

      // --------------------------------
      // 3. Get current user from backend
      // --------------------------------

      console.log("Getting user from /auth/me");

      const response = await authApi.getMe();

      console.log("GET ME RESPONSE:", response);

      if (!response?.success || !response?.data) {
        throw new Error("Unable to get user");
      }

      const user = response.data;

      // --------------------------------
      // 4. Verify role
      // --------------------------------

      if (user.role !== "technician") {
        console.error("User is not a technician");

        await AsyncStorage.removeItem("auth_token");
        await AsyncStorage.removeItem("auth_user");

        return;
      }

      // --------------------------------
      // 5. Store user
      // --------------------------------

      await AsyncStorage.setItem("auth_user", JSON.stringify(user));

      // --------------------------------
      // 6. Set authenticated user
      // --------------------------------

      setUser(user as TechnicianUser);
    } catch (error) {
      console.error("Failed to load user:", error);

      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("auth_user");
      await AsyncStorage.removeItem("auth_refresh_token");

      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // const response = await axios.post(`${API_URL}/auth/login`, {
      //   email,
      //   password,
      // });
      const response = await authApi.login({ email, password });
      console.log("login response", response);
      if (response?.success && response?.data) {
        const { token, refreshToken, user } = response.data;

        if (user.role !== "technician") {
          throw new Error("Access denied. Technician account required.");
        }

        if (user.isVerified) {
          // need to update this code ! after building
          throw new Error(
            "Account pending approval. Please wait for admin verification.",
          );
        }

        await AsyncStorage.setItem("auth_token", token);
        await AsyncStorage.setItem("auth_refresh_token", refreshToken);
        await AsyncStorage.setItem("auth_user", JSON.stringify(user));
        setUser(user as TechnicianUser);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Login failed");
    }
  };

  const register = async (data: any): Promise<ApiResponse<AuthResponse>> => {
    try {
      // const response = await axios.post(`${API_URL}/auth/register`, {
      //   ...data,
      //   role: "technician",
      // });
      console.log("Registering technician with data:", data);
      const response = await authApi.register({ ...data, role: "technician" });
      console.log("Registration response:", response);
      if (response?.success) {
        return response;
      } else {
        console.error("Registration failed:", response);
        throw new Error("Registration failed");
      }
    } catch (error: any) {
      //  catch (error: any) {
      //   console.error("Registration error:", error);
      //   throw new Error(error.response?.data?.error || "Registration failed");
      // }
      throw new Error(error.message || "Registration failed");
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("auth_user");
    await AsyncStorage.removeItem("auth_refresh_token");
    setUser(null);
  };

  const updateUser = async (updatedUser: TechnicianUser) => {
    await AsyncStorage.setItem("auth_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        hasCompletedOnboarding,
        setHasCompletedOnboarding,
        isRegistered,
        setIsRegistered,
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
