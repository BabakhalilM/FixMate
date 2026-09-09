import type {
  UserRole,
  UserProfile,
} from "./user";

// =====================================
// Login
// =====================================

export interface LoginCredentials {
  email: string;
  password: string;
}

// =====================================
// Registration
// =====================================

export interface BaseRegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface CustomerRegisterData
  extends BaseRegisterData {
  role: "customer";
}

export interface AdminRegisterData
  extends BaseRegisterData {
  role: "admin";
}

export interface TechnicianRegisterData
  extends BaseRegisterData {
  role: "technician";

  profile: {
    specialties: string[];
    experience: number;

    location: string;

    coordinates: {
      lat: number;
      lng: number;
    };

    availability: boolean;

    certifications: string[];
  };
}

export type RegisterData =
  | CustomerRegisterData
  | TechnicianRegisterData
  | AdminRegisterData;

// =====================================
// Auth Response
// =====================================

export interface AuthResponse {
  user: UserProfile;
  token: string;
  refreshToken: string;
}

// =====================================
// Auth State
// =====================================

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}