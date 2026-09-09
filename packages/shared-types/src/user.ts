export type UserRole = "customer" | "technician" | "admin";

// =====================================
// Base User
// =====================================

export interface BaseUser {
  id: string | number;
  email: string;
  phone?: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// =====================================
// Customer
// =====================================

export interface CustomerProfile {
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    coordinates?: [number, number];
  };

  devices: string[];
}

export interface CustomerUser extends BaseUser {
  role: "customer";
  profile: CustomerProfile;
}

// =====================================
// Technician
// =====================================

export interface TechnicianProfile {
  specialties: string[];
  experience: number;
  rating: number;
  totalJobs: number;

  location: {
    lat: number;
    lng: number;
    address: string;
  };

  availability: "available" | "busy" | "offline";

  documents: {
    idProof: string;
    license?: string;
    certificates: string[];
  };
}

export interface TechnicianUser extends BaseUser {
  role: "technician";
  profile: TechnicianProfile;
}

// =====================================
// Admin
// =====================================

export interface AdminProfile {
  permissions: string[];
  department: string;
}

export interface AdminUser extends BaseUser {
  role: "admin";
  profile: AdminProfile;
}

// =====================================
// User Profile / Logged-in User
// =====================================

export type UserProfile = CustomerUser | TechnicianUser | AdminUser;
