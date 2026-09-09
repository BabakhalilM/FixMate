// apps/api-server/src/controllers/auth.controller.ts
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { AuthRequest } from "../middleware/auth";
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ApiResponse,
} from "@fixmate/shared-types";
import type { SignOptions } from "jsonwebtoken";

// generate JWT token
const generateToken = (userId: string, email: string, role: string) => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
  };

  return jwt.sign(
    { userId, email, role },
    process.env.JWT_SECRET || "secret",
    options,
  );
};

// Generate refresh token
const generateRefreshToken = (userId: string) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET || "refresh-secret",
    { expiresIn: "30d" },
  );
};

// ============ REGISTER ============
export const register = async (
  req: Request<{}, {}, RegisterData>,
  res: Response<ApiResponse<AuthResponse>>,
) => {
  try {
    const { email, password, name, phone, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "User already exists with this email or phone",
      });
    }

    let profile = {};

    if (role === "technician") {
      const profileData = req.body.profile;

      if (!profileData) {
        return res.status(400).json({
          success: false,
          error: "Technician profile is required",
        });
      }

      profile = {
        specialties: profileData.specialties,
        experience: profileData.experience,
        rating: 0,
        totalJobs: 0,
        location: {
          lat: profileData.coordinates.lat,
          lng: profileData.coordinates.lng,
          address: profileData.location,
        },
        availability: profileData.availability ? "available" : "offline",
        documents: {
          idProof: "",
          certificates: profileData.certifications,
        },
      };
    } else if (role === "customer") {
      profile = {
        address: {
          street: "",
          city: "",
          state: "",
          pincode: "",
        },
        devices: [],
      };
    } else if (role === "admin") {
      profile = {
        permissions: ["manage_all"],
        department: "admin",
      };
    }

    // Create user
    const user = new User({
      email,
      password,
      name,
      phone,
      role: role || "customer",
      profile,
      isVerified: false, // Will need email verification
      createdAt: new Date() + "",
      updatedAt: new Date() + "",
    });

    await user.save();

    // Generate tokens
    const token = generateToken(user._id, user.email, user.role);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt + "",
          updatedAt: user.updatedAt + "",
          profile: user.profile,
        },
        token,
        refreshToken,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Registration failed",
    });
  }
};

// ============ LOGIN ============
export const login = async (
  req: Request<{}, {}, LoginCredentials>,
  res: Response<ApiResponse<AuthResponse>>,
) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Generate tokens
    const token = generateToken(user._id, user.email, user.role);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt + "",
          updatedAt: user.updatedAt + "",
          profile: user.profile,
        },
        token,
        refreshToken,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Login failed",
    });
  }
};

// ============ REFRESH TOKEN ============
export const refreshToken = async (
  req: Request,
  res: Response<ApiResponse<{ token: string }>>,
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: "Refresh token required",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || "refresh-secret",
    ) as { userId: string };

    // Check if user exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    // Generate new token
    const newToken = generateToken(user._id, user.email, user.role);

    res.json({
      success: true,
      data: { token: newToken },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Invalid refresh token",
    });
  }
};

// ============ LOGOUT ============
export const logout = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    // In a real app, you might want to blacklist the token
    // For now, we just return success
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Logout failed",
    });
  }
};

// ============ GET CURRENT USER ============
export const getMe = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get user",
    });
  }
};
