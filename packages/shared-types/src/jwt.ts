import type { UserRole } from './user';

// ==============================
// JWT TYPES
// ==============================

export interface JwtPayload {
  userId: string;

  email: string;

  role: UserRole;

  iat?: number;

  exp?: number;
}