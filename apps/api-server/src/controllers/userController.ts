// apps/api-server/src/controllers/userController.ts
import { Request, Response } from "express";
import { User } from "../models/User";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Repair } from "../models/repair";
import { AuthRequest } from "../middleware/auth";

export const userController = {
  // Get all users (with filters)
  async getUsers(req: Request, res: Response) {
    try {
      const { role, search, page = 1, limit = 10 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const filter: any = {};

      if (role) filter.role = role;

      if (search) {
        const searchRegex = new RegExp(search as string, "i");
        filter.$or = [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
        ];
      }

      const [users, total] = await Promise.all([
        User.find(filter)
          .select("-password")
          .skip(skip)
          .limit(Number(limit))
          .sort({ createdAt: -1 })
          .lean(),
        User.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: users,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch users",
      });
    }
  },

  // Get user by ID
  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      const user = await User.findById(id).select("-password").lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user",
      });
    }
  },

  // Search users
  async searchUsers(req: Request, res: Response) {
    try {
      console.log("Search users request received with query:", req.query);
      const { q, role, limit = 20 } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const searchRegex = new RegExp(q as string, "i");
      const filter: any = {
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
        ],
      };

      if (role) {
        filter.role = role;
      }

      const users = await User.find(filter)
        .select("name email phone avatar role")
        .limit(Number(limit))
        .sort({ name: 1 })
        .lean();

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search users",
      });
    }
  },
  async searchCustomer(req: Request, res: Response) {
    try {
      console.log("Search users request received with query:", req.query);
      const { q, role, limit = 20 } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const searchRegex = new RegExp(q as string, "i");
      const filter: any = {
        role: "customer",
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
        ],
      };

      if (role) {
        filter.role = role;
      }

      const users = await User.find(filter)
        .select("name email phone avatar role")
        .limit(Number(limit))
        .sort({ name: 1 })
        .lean();

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search users",
      });
    }
  },

  // Create user
  async createUser(req: Request, res: Response) {
    try {
      const { name, email, phone, password, role, profile } = req.body;

      // Validate required fields
      if (!name || !email || !phone || !password) {
        return res.status(400).json({
          success: false,
          message: "Name, email, phone, and password are required",
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { phone }],
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email or phone already exists",
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = new User({
        name,
        email: email.toLowerCase(),
        phone,
        password: hashedPassword,
        role: role || "customer",
        isVerified: role === "customer" ? true : false, // Auto-verify customers
        technicianProfile: role === "technician" ? profile : null,
      });

      await user.save();

      // Return user without password
      const userResponse = user.toObject();
      delete (userResponse as Partial<typeof userResponse>).password;

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: userResponse,
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create user",
      });
    }
  },

  // Create customer (simplified)
  async createCustomer(req: Request, res: Response) {
    try {
      const { name, phone, email } = req.body;

      if (!name || !phone) {
        return res.status(400).json({
          success: false,
          message: "Name and phone are required",
        });
      }

      // Check if customer already exists
      let customer = await User.findOne({ phone });

      if (customer) {
        // If customer exists, return them
        if (customer.role !== "customer") {
          return res.status(400).json({
            success: false,
            message: "User with this phone exists but is not a customer",
          });
        }

        const { password, ...customerResponse } = customer.toObject();

        return res.json({
          success: true,
          message: "Customer already exists",
          data: customerResponse,
        });
      }

      // Generate temporary email if not provided
      const tempEmail = email || `${phone}@temp.customer.com`;

      // Generate temporary password
      const tempPassword = `temp_${Date.now()}`;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);

      // Create new customer
      customer = new User({
        name,
        phone,
        email: tempEmail.toLowerCase(),
        password: hashedPassword,
        role: "customer",
        isVerified: true,
      });

      await customer.save();

      const { password, ...customerResponse } = customer.toObject();

      res.status(201).json({
        success: true,
        message: "Customer created successfully",
        data: customerResponse,
        tempPassword, // Only sent on creation for first time
      });
    } catch (error: any) {
      console.error("Error creating customer:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create customer",
      });
    }
  },

  // Update user
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      // Remove sensitive fields
      delete updateData.password;
      delete updateData._id;
      delete updateData.__v;

      // If updating email, check if it's already taken
      if (updateData.email) {
        const existingUser = await User.findOne({
          email: updateData.email,
          _id: { $ne: id },
        });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Email already in use",
          });
        }
      }

      // If updating phone, check if it's already taken
      if (updateData.phone) {
        const existingUser = await User.findOne({
          phone: updateData.phone,
          _id: { $ne: id },
        });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Phone number already in use",
          });
        }
      }

      const user = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true },
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "User updated successfully",
        data: user,
      });
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update user",
      });
    }
  },

  // Delete user
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID",
        });
      }

      const user = await User.findByIdAndDelete(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete user",
      });
    }
  },

  // Get user profile (authenticated user)
  async getProfile(req: Request, res: Response) {
    try {
      const user = await User.findById(req.user?.id).select("-password").lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch profile",
      });
    }
  },

  // Update profile (authenticated user)
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const updateData = req.body;

      // Remove sensitive fields
      delete updateData.password;
      delete updateData._id;
      delete updateData.__v;
      delete updateData.role; // Can't change role

      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true },
      ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: user,
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update profile",
      });
    }
  },

  // Get customers list
  async getCustomers(req: Request, res: Response) {
    try {
      const { search, page = 1, limit = 10 } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const filter: any = { role: "customer" };

      if (search) {
        const searchRegex = new RegExp(search as string, "i");
        filter.$or = [
          { name: searchRegex },
          { phone: searchRegex },
          { email: searchRegex },
        ];
      }

      const [customers, total] = await Promise.all([
        User.find(filter)
          .select("name email phone avatar createdAt")
          .skip(skip)
          .limit(Number(limit))
          .sort({ createdAt: -1 })
          .lean(),
        User.countDocuments(filter),
      ]);

      res.json({
        success: true,
        data: customers,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      });
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch customers",
      });
    }
  },
  async getMyCustomers(req: AuthRequest, res: Response) {
    try {
      // console.log("Fetching customers for technician:", req.user);
      if (!req.user || !req.user._id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      // console.log("Fetching customers for technician:", req.user._id);

      const technicianId = req.user._id;

      const repairs = await Repair.find({
        technicianId,
      })
        .populate("customerId", "name email phone avatar")
        .sort({ createdAt: -1 })
        .lean();
      // console.log("repairs", repairs);
      // build unique customer list...
      const customerMap = new Map();
      // console.log("Fetched repairs for technician:", repairs);

      for (const repair of repairs) {
        const customer = repair.customerId as any;

        if (!customer) continue;

        const customerId = customer._id?.toString();

        if (!customerId) continue;

        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            id: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            avatar: customer.avatar,
            serviceCount: 1,
            lastService: repair.createdAt,
          });
        } else {
          const existing = customerMap.get(customerId);

          existing.serviceCount += 1;

          if (new Date(repair.createdAt) > new Date(existing.lastService)) {
            existing.lastService = repair.createdAt;
          }
        }
      }

      const customers = Array.from(customerMap.values());

      return res.json({
        success: true,
        data: customers,
      });
    } catch (error) {
      console.error("Error fetching technician customers:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch customers",
      });
    }
  },
  async getMyTechnicians(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }
      const CustomerId = req.user.id;

      const repairs = await Repair.find({
        CustomerId,
      })
        .populate("TechnicianId", "name email phone avatar")
        .sort({ createdAt: -1 })
        .lean();

      const technicianMap = new Map();

      for (const repair of repairs) {
        const technician = repair.technicianId as any;

        if (!technician) continue;

        const technicianId = technician._id.toString();

        if (!technicianMap.has(technicianId)) {
          technicianMap.set(technicianId, {
            id: technician._id,
            name: technician.name,
            email: technician.email,
            phone: technician.phone,
            avatar: technician.avatar,
            serviceCount: 1,
            lastService: repair.createdAt,
          });
        } else {
          const existing = technicianMap.get(technicianId);

          existing.serviceCount += 1;

          if (new Date(repair.createdAt) > new Date(existing.lastService)) {
            existing.lastService = repair.createdAt;
          }
        }
      }

      const technicians = Array.from(technicianMap.values());

      return res.json({
        success: true,
        data: technicians,
      });
    } catch (error) {
      console.error("Error fetching technician customers:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch customers",
      });
    }
  },
};
