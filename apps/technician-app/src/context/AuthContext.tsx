// apps/technician-app/src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
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
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => ReturnType<typeof authApi.verifyOTP>;
  changePassword: (resetToken: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<TechnicianUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const handledTokensRef = useRef<Set<string>>(new Set());
  const isProcessingRef = useRef(false);

  // ✅ Bootstrap flag — state, not ref, so React respects ordering
  const [hasBootstrapped, setHasBootstrapped] = useState(false);

  // ──────────────────────────────────────────────────────────
  // 🔑 Core: validate a token and load the technician user
  // ──────────────────────────────────────────────────────────
  const processToken = async (token: string): Promise<boolean> => {
    if (isProcessingRef.current) return false;
    isProcessingRef.current = true;

    try {
      await AsyncStorage.setItem("auth_token", token);
      const response = await authApi.getMe();
      if (!response?.success || !response?.data) throw new Error("No user");

      const fetchedUser = response.data as TechnicianUser;
      if (fetchedUser.role !== "technician") {
        await AsyncStorage.removeItem("auth_token");
        await AsyncStorage.removeItem("auth_user");
        setUser(null);
        return false;
      }

      await AsyncStorage.setItem("auth_user", JSON.stringify(fetchedUser));
      setUser(fetchedUser);
      return true;
    } catch (error) {
      console.error("❌ processToken failed:", error);
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("auth_user");
      await AsyncStorage.removeItem("auth_refresh_token");
      setUser(null);
      return false;
    } finally {
      isProcessingRef.current = false;
    }
  };

  // ──────────────────────────────────────────────────────────
  // 🚩 Read persisted flags (onboarding + registered)
  //    Called from bootstrap ALWAYS — even on deep-link cold start
  // ──────────────────────────────────────────────────────────
  const loadFlags = async () => {
    try {
      const [onboarding, registered] = await Promise.all([
        AsyncStorage.getItem("onboardingCompleted"),
        AsyncStorage.getItem("registered"),
      ]);
      setHasCompletedOnboarding(onboarding === "true");
      setIsRegistered(registered === "true");
    } catch (error) {
      console.error("❌ loadFlags failed:", error);
    }
  };

  // ──────────────────────────────────────────────────────────
  // 🔗 Deep-link handler (warm start only)
  //    Does NOT touch isLoading — bootstrap owns that
  // ──────────────────────────────────────────────────────────
  const handleDeepLink = async (url: string) => {
    try {
      const { path, queryParams } = Linking.parse(url);
      const token = queryParams?.token ? String(queryParams.token) : null;

      if (path !== "technician-login" || !token) return;

      if (handledTokensRef.current.has(token)) {
        console.log("⏭️  Token already handled — skipping");
        return;
      }
      handledTokensRef.current.add(token);

      console.log("🔗 Deep link received, processing token");
      await processToken(token);

      // Strip token from URL to prevent re-fires
      try {
        await Linking.clearInitialURL();
      } catch (e) {
        // no-op on web
      }

      if (typeof window !== "undefined" && window.history?.replaceState) {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }
    } catch (error) {
      console.error("❌ handleDeepLink failed:", error);
    }
  };

  // ──────────────────────────────────────────────────────────
  // 👤 loadUser — read flags + stored token, then validate
  //    Does NOT touch isLoading — bootstrap owns that
  // ──────────────────────────────────────────────────────────
  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) return;

      handledTokensRef.current.add(token);
      await processToken(token);
    } catch (error) {
      console.error("❌ loadUser failed:", error);
      setUser(null);
    }
  };

  // ──────────────────────────────────────────────────
  // ✅ EFFECT 1: Bootstrap (runs once, ever)
  //    1. Always read flags first
  //    2. Then resolve token (deep-link priority, else stored)
  //    3. Only place that sets isLoading = false
  // ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        // 1. Always read flags — even on deep-link cold start
        await loadFlags();
        if (cancelled) return;

        // 2. Resolve initial URL for deep-link token
        let url: string | null = null;
        try {
          url = await Linking.getInitialURL();
        } catch (e) {
          console.warn("getInitialURL failed:", e);
        }
        if (cancelled) return;

        if (url) {
          console.log("🚀 Cold start with URL");
          await handleDeepLink(url);
        } else {
          await loadUser();
        }
      } catch (err) {
        console.error("Bootstrap failed:", err);
        if (!cancelled) {
          try {
            await loadUser();
          } catch {
            // swallow
          }
        }
      } finally {
        if (!cancelled) {
          setHasBootstrapped(true);
          setIsLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ──────────────────────────────────────────────────
  // ✅ EFFECT 2: Warm-start listener (only AFTER bootstrap)
  // ──────────────────────────────────────────────────
  useEffect(() => {
    if (!hasBootstrapped) return;

    const subscription = Linking.addEventListener("url", (event) => {
      console.log("🔥 Warm start with URL");
      handleDeepLink(event.url);
    });

    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasBootstrapped]);

  // ──────────────────────────────────────────────────────────
  // 🔐 Login (email + password)
  // ──────────────────────────────────────────────────────────
  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      console.log("login response", response);

      if (response?.success && response?.data) {
        const { token, refreshToken, user } = response.data;
        console.log("Login successful, received token and user:", {
          token,
          refreshToken,
          user,
        });

        if (user.role !== "technician") {
          throw new Error("Access denied. Technician account required.");
        }

        // if (!user.isVerified) {
        //   throw new Error(
        //     "Account pending approval. Please wait for admin verification.",
        //   );
        // }

        await AsyncStorage.setItem("auth_token", token);
        await AsyncStorage.setItem("auth_refresh_token", refreshToken);
        await AsyncStorage.setItem("auth_user", JSON.stringify(user));

        // ✅ PERSIST registration flag so refresh keeps Login as initial route
        await AsyncStorage.setItem("registered", "true");
        setIsRegistered(true);

        setUser(user as TechnicianUser);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Login failed");
    }
  };
  const sendOTP = async (email: string) => {
    try {
      const response = await authApi.sendOTP({ email });
      console.log("OTP response", response);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Failed to send OTP");
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    try {
      const response = await authApi.verifyOTP({ email, otp });
      console.log("OTP verification response", response);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Failed to verify OTP");
    }
  };

  const changePassword = async (resetToken: string, newPassword: string) => {
    try {
      const response = await authApi.changePassword({ resetToken, newPassword });
      console.log("Password change response", response);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Failed to change password");
    }
  };

  // ──────────────────────────────────────────────────────────
  // 📝 Register
  // ──────────────────────────────────────────────────────────
  const register = async (data: any): Promise<ApiResponse<AuthResponse>> => {
    try {
      console.log("Registering technician with data:", data);
      const response = await authApi.register({
        ...data,
        role: "technician",
      });
      console.log("Registration response:", response);

      if (response?.success) {
        // ✅ PERSIST registration flag so refresh keeps Login as initial route
        await AsyncStorage.setItem("registered", "true");
        setIsRegistered(true);
        return response;
      } else {
        console.error("Registration failed:", response);
        throw new Error("Registration failed");
      }
    } catch (error: any) {
      throw new Error(error.message || "Registration failed");
    }
  };

  // ──────────────────────────────────────────────────────────
  // 🚪 Logout — keep "registered" so refresh lands on Login
  // ──────────────────────────────────────────────────────────
  const logout = async () => {
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("auth_user");
    await AsyncStorage.removeItem("auth_refresh_token");
    // ❗ do NOT remove "registered" or "onboardingCompleted"
    setUser(null);
  };

  // ──────────────────────────────────────────────────────────
  // ✏️ Update user
  // ──────────────────────────────────────────────────────────
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
        sendOTP,
        verifyOTP,
        changePassword
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
