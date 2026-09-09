// apps/api-server/src/services/repairService.ts
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Review } from '../models/Review';
import { IRepair, Repair } from '../models/repair';

export class RepairService {
  
  // Create a new repair
//   static async createRepair(data: Partial<IRepair>): Promise<IRepair> {
//     try {
//       // Validate customer exists
//       const customer = await User.findById(data.customerId);
//       if (!customer) {
//         throw new Error('Customer not found');
//       }

//       // Set customer name and phone if not provided
//       if (!data.customerName) data.customerName = customer.name;
//       if (!data.customerPhone) data.customerPhone = customer.phone;

//       // Set technician if provided
//       if (data.technicianId) {
//         const technician = await User.findById(data.technicianId);
//         if (!technician) {
//           throw new Error('Technician not found');
//         }
//         if (technician.role !== 'technician') {
//           throw new Error('User is not a technician');
//         }
//       }

//       // Handle problemDescription alias
//       if (data.problemDescription && !data.issueDescription) {
//         data.issueDescription = data.problemDescription;
//       }

//       // Create repair
//       const repair = new Repair(data);
//       await repair.save();

//       // Populate customer details
//       await repair.populate('customer', 'name email phone avatar');
//       if (repair.technicianId) {
//         await repair.populate('technician', 'name email phone avatar technicianProfile');
//       }

//       return repair;
//     } catch (error: any) {
//       throw new Error(`Failed to create repair: ${error.message}`);
//     }
//   }

static async createRepair(data: any): Promise<IRepair> {
    try {
        
      let customerId = data.customerId;
      let customerName = data.customerName;
      let customerPhone = data.customerPhone;

      // If customerId is provided, verify it exists
      if (customerId) {
        const existingCustomer = await User.findById(customerId);
        if (!existingCustomer) {
          throw new Error('Customer not found');
        }
        // Use existing customer's name and phone if not provided
        if (!customerName) customerName = existingCustomer.name;
        if (!customerPhone) customerPhone = existingCustomer.phone;
      } else {
        // No customerId provided - we need to find or create a customer
        // First, try to find existing customer by phone
        const existingCustomer = await User.findOne({ 
          phone: customerPhone,
          role: 'customer' 
        });

        if (existingCustomer) {
          // Customer exists, use their ID
          customerId = existingCustomer._id.toString();
          customerName = existingCustomer.name;
          customerPhone = existingCustomer.phone;
        } else {
          // Customer doesn't exist - create a new customer
          // Check if we have enough info to create a customer
          if (!customerName || !customerPhone) {
            throw new Error('Customer name and phone are required to create a new customer');
          }

          // Check if user already exists with this phone
          const existingUser = await User.findOne({ phone: customerPhone });
          if (existingUser) {
            throw new Error(`User with phone ${customerPhone} already exists but is not a customer`);
          }

          // Create new customer
          const newCustomer = new User({
            name: customerName,
            phone: customerPhone,
            email: `${customerPhone}@temp.com`, // Temporary email
            password: `temp_${Date.now()}`, // Temporary password
            role: 'customer',
            isVerified: false,
          });

          await newCustomer.save();
          customerId = newCustomer._id.toString();
          
          console.log(`Created new customer: ${customerName} (${customerPhone})`);
        }
      }

      // Prepare repair data
      const repairData = {
        customerId: new mongoose.Types.ObjectId(customerId),
        technicianId: data.technicianId ? new mongoose.Types.ObjectId(data.technicianId) : undefined,
        customerName,
        customerPhone,
        deviceType: data.deviceType,
        brand: data.brand,
        deviceModel: data.deviceModel || data.model,
        serialNumber: data.serialNumber,
        issueDescription: data.problemDescription || data.issueDescription,
        problemDescription: data.problemDescription || data.issueDescription,
        status: data.status || 'pending',
        priority: data.priority || 'medium',
        charges: data.charges || 0,
        deposit: data.deposit || 0,
        estimatedDays: data.estimatedDays,
        estimatedCompletion: data.estimatedCompletion,
        notes: data.notes,
        deviceSpecs: data.deviceSpecs || {},
        images:data.images || [],
      };

      // Create repair
      const repair = new Repair(repairData);
      await repair.save();

      // Populate customer details
      await repair.populate('customer', 'name email phone avatar');
      if (repair.technicianId) {
        await repair.populate('technician', 'name email phone avatar technicianProfile');
      }

      return repair;
    } catch (error: any) {
      throw new Error(`Failed to create repair: ${error.message}`);
    }
  }

  // Get repair by ID
  static async getRepairById(repairId: string): Promise<IRepair | null> {
    try {
      const repair = await Repair.findById(repairId)
        .populate('customer', 'name email phone avatar')
        .populate('technician', 'name email phone avatar technicianProfile')
        .lean();

      return repair;
    } catch (error) {
      throw new Error('Failed to fetch repair');
    }
  }

  // Get repairs with filters
  static async getRepairs(filters: {
    technicianId?: string;
    customerId?: string;
    deviceType?: string;
    status?: string;
    priority?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    try {
      const {
        technicianId,
        customerId,
        deviceType,
        status,
        priority,
        startDate,
        endDate,
        search,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters;

      const skip = (page - 1) * limit;

      // Build filter
      const filter: any = {};

      if (technicianId) filter.technicianId = technicianId;
      if (customerId) filter.customerId = customerId;
      if (deviceType) filter.deviceType = deviceType;
      if (status) filter.status = status;
      if (priority) filter.priority = priority;

      // Date range
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      // Search filter
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        filter.$or = [
          { customerName: searchRegex },
          { customerPhone: searchRegex },
          { deviceType: searchRegex },
          { brand: searchRegex },
          { model: searchRegex },
          { serialNumber: searchRegex },
        ];
      }

      // Execute queries in parallel
      const [repairs, total] = await Promise.all([
        Repair.find(filter)
          .populate('customer', 'name email phone avatar')
          .populate('technician', 'name email phone avatar technicianProfile')
          .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Repair.countDocuments(filter),
      ]);

      // Get statistics
      const stats = await this.getRepairStats(filter);

      return {
        repairs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        stats,
      };
    } catch (error) {
      throw new Error('Failed to fetch repairs');
    }
  }

  // Get repair statistics
  static async getRepairStats(filter: any = {}) {
    try {
      const [total, statusStats, priorityStats, earningsStats] = await Promise.all([
        Repair.countDocuments(filter),
        Repair.aggregate([
          { $match: filter },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),
        Repair.aggregate([
          { $match: filter },
          {
            $group: {
              _id: '$priority',
              count: { $sum: 1 },
            },
          },
        ]),
        Repair.aggregate([
          { $match: { ...filter, status: 'completed' } },
          {
            $group: {
              _id: null,
              totalEarnings: { $sum: '$charges' },
              averageCharge: { $avg: '$charges' },
              minCharge: { $min: '$charges' },
              maxCharge: { $max: '$charges' },
            },
          },
        ]),
      ]);

      // Format stats
      const statusDistribution: any = {};
      statusStats.forEach((item: any) => {
        statusDistribution[item._id] = item.count;
      });

      const priorityDistribution: any = {};
      priorityStats.forEach((item: any) => {
        priorityDistribution[item._id] = item.count;
      });

      return {
        total,
        statusDistribution,
        priorityDistribution,
        earnings: earningsStats[0] || {
          totalEarnings: 0,
          averageCharge: 0,
          minCharge: 0,
          maxCharge: 0,
        },
        pending: statusDistribution.pending || 0,
        inProgress: statusDistribution['in-progress'] || 0,
        completed: statusDistribution.completed || 0,
        cancelled: statusDistribution.cancelled || 0,
      };
    } catch (error) {
      return {
        total: 0,
        statusDistribution: {},
        priorityDistribution: {},
        earnings: {
          totalEarnings: 0,
          averageCharge: 0,
          minCharge: 0,
          maxCharge: 0,
        },
        pending: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
      };
    }
  }

  // Update repair
  static async updateRepair(repairId: string, data: Partial<IRepair>): Promise<IRepair | null> {
    try {
      const repair = await Repair.findById(repairId);
      if (!repair) {
        throw new Error('Repair not found');
      }

      // If status is changing to completed, set completedAt
      if (data.status === 'completed' && repair.status !== 'completed') {
        data.completedAt = new Date();
      }

      // If technician is being assigned
      if (data.technicianId && !repair.technicianId) {
        const technician = await User.findById(data.technicianId);
        if (!technician) {
          throw new Error('Technician not found');
        }
        if (technician.role !== 'technician') {
          throw new Error('User is not a technician');
        }
      }

      // Handle problemDescription alias
      if (data.problemDescription && !data.issueDescription) {
        data.issueDescription = data.problemDescription;
      }

      // Update repair
      const updatedRepair = await Repair.findByIdAndUpdate(
        repairId,
        { ...data, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
        .populate('customer', 'name email phone avatar')
        .populate('technician', 'name email phone avatar technicianProfile');

      return updatedRepair;
    } catch (error: any) {
      throw new Error(`Failed to update repair: ${error.message}`);
    }
  }

  // Update repair status
  static async updateStatus(
    repairId: string,
    status: IRepair['status'],
    notes?: string
  ): Promise<IRepair | null> {
    try {
      const updateData: any = { status };
      
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }

      if (notes) {
        updateData.notes = notes;
      }

      const repair = await Repair.findByIdAndUpdate(
        repairId,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('customer', 'name email phone avatar')
        .populate('technician', 'name email phone avatar technicianProfile');

      if (!repair) {
        throw new Error('Repair not found');
      }

      return repair;
    } catch (error: any) {
      throw new Error(`Failed to update status: ${error.message}`);
    }
  }

  // Delete repair
  static async deleteRepair(repairId: string): Promise<{ message: string }> {
    try {
      const repair = await Repair.findById(repairId);
      if (!repair) {
        throw new Error('Repair not found');
      }

      // Check if there are reviews linked to this repair
      const reviewCount = await Review.countDocuments({ repairId });
      if (reviewCount > 0) {
        throw new Error('Cannot delete repair with existing reviews');
      }

      await Repair.findByIdAndDelete(repairId);
      return { message: 'Repair deleted successfully' };
    } catch (error: any) {
      throw new Error(`Failed to delete repair: ${error.message}`);
    }
  }

  // Get technician's repair stats
  static async getTechnicianStats(technicianId: string) {
    try {
      const filter = { technicianId };
      const stats = await this.getRepairStats(filter);
      
      // Get monthly breakdown
      const monthlyStats = await Repair.aggregate([
        { $match: { technicianId: new mongoose.Types.ObjectId(technicianId) } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            repairs: { $sum: 1 },
            earnings: { $sum: '$charges' },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
          },
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 6 },
      ]);

      return {
        ...stats,
        monthly: monthlyStats.map((item: any) => ({
          month: `${item._id.month}/${item._id.year}`,
          repairs: item.repairs,
          earnings: item.earnings,
          completed: item.completed,
        })),
      };
    } catch (error) {
      throw new Error('Failed to fetch technician stats');
    }
  }
}