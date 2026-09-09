// apps/api-server/src/models/Review.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  rating: number; // 1-5
  comment?: string;
  technicianId: mongoose.Types.ObjectId; // Reference to technician user
  customerId: mongoose.Types.ObjectId; // Reference to customer user
  repairId?: mongoose.Types.ObjectId; // Optional reference to repair
  deviceType?: string; // AC, Refrigerator, TV, etc.
  deviceModel?: string;
  isPublic: boolean;
  isVerified: boolean; // Verified repair review
  response?: string; // Technician's response to review
  responseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Define static methods interface
interface IReviewModel extends Model<IReview> {
  calculateTechnicianRating(technicianId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: number[];
  }>;
  getDeviceStats(technicianId: string): Promise<Array<{
    _id: string;
    count: number;
    averageRating: number;
  }>>;
  getTechnicianRatingDistribution(technicianId: string): Promise<Array<{
    _id: number;
    count: number;
  }>>;
}

const ReviewSchema = new Schema<IReview, IReviewModel>({
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    maxlength: 1000,
    trim: true,
  },
  technicianId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  repairId: {
    type: Schema.Types.ObjectId,
    ref: 'Repair',
    index: true,
    sparse: true, // Allows null/undefined values
  },
  deviceType: {
    type: String,
    index: true,
    trim: true,
  },
  deviceModel: {
    type: String,
    trim: true,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  response: {
    type: String,
    maxlength: 500,
    trim: true,
  },
  responseDate: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Compound index to prevent duplicate reviews for same repair
ReviewSchema.index(
  { repairId: 1, customerId: 1 }, 
  { unique: true, sparse: true }
);

// Index for efficient queries
ReviewSchema.index({ technicianId: 1, rating: 1 });
ReviewSchema.index({ deviceType: 1, rating: 1 });
ReviewSchema.index({ customerId: 1, rating: 1 });
ReviewSchema.index({ createdAt: -1 });

// Index for finding reviews by date range
ReviewSchema.index({ technicianId: 1, createdAt: -1 });

// Static method to calculate technician rating
ReviewSchema.statics.calculateTechnicianRating = async function(
  technicianId: string
): Promise<{
  averageRating: number;
  totalReviews: number;
  ratingDistribution: number[];
}> {
  const objectId = new mongoose.Types.ObjectId(technicianId);
  
  const result = await this.aggregate([
    { 
      $match: { 
        technicianId: objectId,
        isPublic: true, // Only count public reviews
      } 
    },
    {
      $group: {
        _id: '$technicianId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratings: { $push: '$rating' }
      }
    }
  ]);

  if (result.length === 0) {
    return { 
      averageRating: 0, 
      totalReviews: 0, 
      ratingDistribution: [0, 0, 0, 0, 0] 
    };
  }

  // Calculate rating distribution (index 0 = 1 star, index 4 = 5 stars)
  const distribution = [0, 0, 0, 0, 0];
  result[0].ratings.forEach((rating: number) => {
    if (rating >= 1 && rating <= 5) {
      distribution[rating - 1]++;
    }
  });

  return {
    averageRating: Math.round(result[0].averageRating * 10) / 10, // Round to 1 decimal
    totalReviews: result[0].totalReviews,
    ratingDistribution: distribution,
  };
};

// Method to get device-specific stats
ReviewSchema.statics.getDeviceStats = async function(
  technicianId: string
): Promise<Array<{
  _id: string;
  count: number;
  averageRating: number;
}>> {
  const objectId = new mongoose.Types.ObjectId(technicianId);
  
  return this.aggregate([
    { 
      $match: { 
        technicianId: objectId,
        deviceType: { $nin: [null, ''] },
        isPublic: true,
      } 
    },
    {
      $group: {
        _id: '$deviceType',
        count: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      }
    },
    { 
      $project: {
        _id: 1,
        count: 1,
        averageRating: { $round: ['$averageRating', 1] },
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Method to get rating distribution for a technician
ReviewSchema.statics.getTechnicianRatingDistribution = async function(
  technicianId: string
): Promise<Array<{
  _id: number;
  count: number;
}>> {
  const objectId = new mongoose.Types.ObjectId(technicianId);
  
  return this.aggregate([
    { 
      $match: { 
        technicianId: objectId,
        isPublic: true,
      } 
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      }
    },
    { $sort: { _id: -1 } } // Sort by rating descending
  ]);
};

// Pre-save hook to set isVerified if repairId exists
ReviewSchema.pre('save', function(next) {
  if (this.repairId) {
    this.isVerified = true;
  }
  next();
});

// Pre-save hook to trim strings
ReviewSchema.pre('save', function(next) {
  if (this.comment) this.comment = this.comment.trim();
  if (this.deviceType) this.deviceType = this.deviceType.trim();
  if (this.deviceModel) this.deviceModel = this.deviceModel.trim();
  if (this.response) this.response = this.response.trim();
  next();
});

// Virtual for getting technician name (populated)
ReviewSchema.virtual('technician', {
  ref: 'User',
  localField: 'technicianId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for getting customer name (populated)
ReviewSchema.virtual('customer', {
  ref: 'User',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true,
});

// Virtual for getting repair details (populated)
ReviewSchema.virtual('repair', {
  ref: 'Repair',
  localField: 'repairId',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtuals are included in JSON output
ReviewSchema.set('toJSON', { virtuals: true });
ReviewSchema.set('toObject', { virtuals: true });

export const Review = mongoose.model<IReview, IReviewModel>('Review', ReviewSchema);