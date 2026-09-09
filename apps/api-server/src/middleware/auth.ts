// apps/api-server/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { JwtPayload, UserRole } from '@fixmate/shared-types';

export interface AuthRequest extends Request {
  user?: any;
  token?: string;
}

// Verify JWT token
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    // console.log('Authenticating request:', req.method, req.originalUrl);
    const authHeader = req.headers.authorization;
    // console.log('Authorization header:', authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const token = authHeader.split(' ')[1];
    req.token = token;

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as JwtPayload;
    // console.log("decoded data",decoded);
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    // console.log("user details",user);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
};

// Role-based authorization
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Role ${req.user.role} is not authorized to access this resource`,
      });
    }

    next();
  };
};

// Check if user is customer
export const isCustomer = authorize('customer');

// Check if user is technician
export const isTechnician = authorize('technician');

// Check if user is admin
export const isAdmin = authorize('admin');

// Check if user is technician or admin
export const isTechnicianOrAdmin = authorize('technician', 'admin');

// Check if user is customer or admin
export const isCustomerOrAdmin = authorize('customer', 'admin');