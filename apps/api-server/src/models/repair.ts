// apps/api-server/src/models/Repair.ts
import mongoose, { Schema, Document } from 'mongoose';
export interface RepairImage {
  url: string;
  publicId?: string;
  type?: "before" | "during" | "after";
}

export interface IRepair extends Document {
  customerId: mongoose.Types.ObjectId;
  technicianId?: mongoose.Types.ObjectId;
  customerName?: string; // Denormalized for quick access
  customerPhone?: string; // Denormalized for quick access
  deviceType: string;
  brand?: string;
  deviceModel?: string;
  serialNumber?: string;
  issueDescription?: string;
  problemDescription?: string; // Alias for issueDescription
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  charges?: number;
  deposit?: number;
  estimatedDays?: string;
  estimatedCompletion?: Date;
  completedAt?: Date;
  notes?: string;
  images: RepairImage[];
  deviceSpecs?: Record<string, any>; // Dynamic device specifications
  createdAt: Date;
  updatedAt: Date;
}

const RepairSchema = new Schema<IRepair>({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  technicianId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  customerPhone: {
    type: String,
    required: true,
  },
  deviceType: {
    type: String,
    required: true,
    index: true,
  },
  brand: {
    type: String,
    trim: true,
  },
  deviceModel: {
    type: String,
    trim: true,
  },
  serialNumber: {
    type: String,
    trim: true,
  },
  issueDescription: {
    type: String,
    required: true,
  },
  problemDescription: {
    type: String,
    // This can be an alias or separate field
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending',
    index: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  charges: {
    type: Number,
    min: 0,
  },
  deposit: {
    type: Number,
    min: 0,
  },
  estimatedDays: {
    type: String,
    trim: true,
  },
  estimatedCompletion: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  notes: {
    type: String,
    trim: true,
  },
  images: [
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
    },
    type: {
      type: String,
      enum: ["before", "during", "after"],
    },
  },
],
  deviceSpecs: {
    type: Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
RepairSchema.index({ technicianId: 1, status: 1 });
RepairSchema.index({ customerId: 1, status: 1 });
RepairSchema.index({ deviceType: 1, status: 1 });
RepairSchema.index({ createdAt: -1 });

// Pre-save middleware to set customerName and customerPhone if not provided
RepairSchema.pre('save', async function(next) {
  if (this.isNew && (!this.customerName || !this.customerPhone)) {
    try {
      const User = mongoose.model('User');
      const customer = await User.findById(this.customerId);
      if (customer) {
        if (!this.customerName) this.customerName = customer.name;
        if (!this.customerPhone) this.customerPhone = customer.phone;
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  }
  next();
});

// Virtual field for customer details
RepairSchema.virtual('customer', {
  ref: 'User',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true,
});

RepairSchema.virtual('technician', {
  ref: 'User',
  localField: 'technicianId',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtuals are included in JSON
RepairSchema.set('toJSON', { virtuals: true });
RepairSchema.set('toObject', { virtuals: true });

export const Repair = mongoose.model<IRepair>('Repair', RepairSchema);