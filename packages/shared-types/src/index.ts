// // packages/shared-types/src/index.ts
// // import type { User } from '@fixmate/shared-types';
// export interface Booking {
//   id: string;
//   customerId: string;
//   technicianId?: string;
//   device: {
//     type: string;
//     brand: string;
//     model: string;
//   };
//   status: 'pending' | 'accepted' | 'completed';
//   createdAt: Date;
// }

// export interface Device {
//   id: string;
//   type: string;
//   brand: string;
//   model: string;
//   serialNumber: string;
//   purchaseDate: Date;
//   warranty: {
//     startDate: Date;
//     endDate: Date;
//   };
// }
// // packages/shared-types/src/index.ts

// // ============ USER TYPES ============
// export type UserRole = 'customer' | 'technician' | 'admin';

// export interface User {
//   id: string;
//   email: string;
//   phone?: string;
//   name: string;
//   role: UserRole;
//   avatar?: string;
//   isVerified: boolean;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface CustomerProfile extends User {
//   role: 'customer';
//   address?: {
//     street: string;
//     city: string;
//     state: string;
//     pincode: string;
//     coordinates?: [number, number];
//   };
//   devices: string[]; // Device IDs
// }

// export interface TechnicianProfile extends User {
//   role: 'technician';
//   specialties: string[];
//   experience: number;
//   rating: number;
//   totalJobs: number;
//   location: {
//     lat: number;
//     lng: number;
//     address: string;
//   };
//   availability: 'available' | 'busy' | 'offline';
//   isVerified: boolean;
//   documents: {
//     idProof: string;
//     license?: string;
//     certificates: string[];
//   };
// }

// export interface AdminProfile extends User {
//   role: 'admin';
//   permissions: string[];
//   department: string;
// }

// // ============ AUTH TYPES ============
// export interface LoginCredentials {
//   email: string;
//   password: string;
// }

// export interface RegisterCredentials {
//   email: string;
//   password: string;
//   name: string;
//   phone: string;
//   role: UserRole;
//   // Additional fields based on role
//   specialties?: string[];
//   experience?: number;
// }

// export interface AuthResponse {
//   user: User;
//   token: string;
//   refreshToken: string;
// }

// export interface AuthState {
//   user: User | null;
//   token: string | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   error: string | null;
// }

// // ============ JWT TYPES ============
// export interface JwtPayload {
//   userId: string;
//   email: string;
//   role: UserRole;
//   exp: number;
//   iat: number;
// }

// // ============ API TYPES ============
// // export interface ApiResponse<T = any> {
// //   success: boolean;
// //   data?: T;
// //   message?: string;
// //   error?: string;
// // }

// export interface ApiResponse<T = unknown> {
//   success: boolean;
//   data?: T;
//   message?: string;
//   error?: string;
// }
// export interface PaginatedResponse<T> {
//   data: T[];
//   total: number;
//   page: number;
//   limit: number;
// }

export * from './user';

export * from './auth';

// export * from './booking';

// export * from './device';

export * from './api';

export * from './jwt';