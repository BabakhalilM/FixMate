// apps/api-server/src/services/reviewService.ts
import { Repair } from '../models/repair';
import { Review } from '../models/Review';
import { User } from '../models/User';
import mongoose from 'mongoose';

export class ReviewService {
  
  // Get reviews for a technician
  static async getTechnicianReviews(
    technicianId: string,
    options: {
      page?: number;
      limit?: number;
      rating?: number;
      sortBy?: string;
    } = {}
  ) {
    const { page = 1, limit = 10, rating, sortBy = 'createdAt' } = options;
    const skip = (page - 1) * limit;

    const filter: any = { technicianId: new mongoose.Types.ObjectId(technicianId) };
    if (rating) filter.rating = rating;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('customerId', 'name email avatar')
        .populate('repairId', 'deviceType deviceModel')
        .sort({ [sortBy]: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    // Get stats
    const stats = await Review.calculateTechnicianRating(technicianId);
    const deviceStats = await Review.getDeviceStats(technicianId);

    return {
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        ...stats,
        deviceStats,
      },
    };
  }

  // Get reviews by a customer
  static async getCustomerReviews(
    customerId: string,
    options: { page?: number; limit?: number; rating?: number } = {}
  ) {
    const { page = 1, limit = 10, rating } = options;
    const skip = (page - 1) * limit;

    const filter: any = { customerId: new mongoose.Types.ObjectId(customerId) };
    if (rating) filter.rating = rating;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('technicianId', 'name email avatar technicianProfile')
        .populate('repairId', 'deviceType deviceModel')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    return {
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get reviews for a specific repair
  static async getRepairReviews(repairId: string) {
    return Review.find({ repairId: new mongoose.Types.ObjectId(repairId) })
      .populate('customerId', 'name email avatar')
      .populate('technicianId', 'name email')
      .sort({ createdAt: -1 });
  }

  // Get reviews by device type
  static async getDeviceReviews(
    deviceType: string,
    options: {
      technicianId?: string;
      customerId?: string;
      rating?: number;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { technicianId, customerId, rating, page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const filter: any = { deviceType };
    if (technicianId) filter.technicianId = new mongoose.Types.ObjectId(technicianId);
    if (customerId) filter.customerId = new mongoose.Types.ObjectId(customerId);
    if (rating) filter.rating = rating;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('customerId', 'name email avatar')
        .populate('technicianId', 'name email avatar technicianProfile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    return {
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Create a new review
  static async createReview(data: {
    rating: number;
    comment?: string;
    technicianId: string;
    customerId: string;
    repairId?: string;
    deviceType?: string;
    deviceModel?: string;
    isPublic?: boolean;
  }) {
    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Check if review already exists for this repair
    if (data.repairId) {
      const existingReview = await Review.findOne({
        repairId: new mongoose.Types.ObjectId(data.repairId),
        customerId: new mongoose.Types.ObjectId(data.customerId),
      });

      if (existingReview) {
        throw new Error('You have already reviewed this repair');
      }
    }

    // Check if repair exists and is completed
    if (data.repairId) {
      const repair = await Repair.findById(data.repairId);
      if (!repair) {
        throw new Error('Repair not found');
      }
      if (repair.status !== 'completed') {
        throw new Error('Can only review completed repairs');
      }
      if (repair.customerId.toString() !== data.customerId) {
        throw new Error('You are not authorized to review this repair');
      }
    }

    // Create review
    const review = new Review({
      rating: data.rating,
      comment: data.comment,
      technicianId: new mongoose.Types.ObjectId(data.technicianId),
      customerId: new mongoose.Types.ObjectId(data.customerId),
      repairId: data.repairId ? new mongoose.Types.ObjectId(data.repairId) : undefined,
      deviceType: data.deviceType,
      deviceModel: data.deviceModel,
      isPublic: data.isPublic !== undefined ? data.isPublic : true,
      isVerified: !!data.repairId, // Verified if linked to a repair
    });

    await review.save();

    // Update technician's average rating
    await this.updateTechnicianRating(data.technicianId);

    return review.populate([
      { path: 'customerId', select: 'name email avatar' },
      { path: 'repairId', select: 'deviceType deviceModel' },
    ]);
  }

  // Update technician's average rating
  static async updateTechnicianRating(technicianId: string) {
    const stats = await Review.calculateTechnicianRating(technicianId);
    
    await User.findByIdAndUpdate(
      technicianId,
      {
        $set: {
          'technicianProfile.averageRating': stats.averageRating,
          'technicianProfile.totalReviews': stats.totalReviews,
        },
      },
      { new: true }
    );

    return stats;
  }

  // Update a review
  static async updateReview(
    reviewId: string,
    userId: string,
    data: { rating?: number; comment?: string; isPublic?: boolean }
  ) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    // Only customer who created the review can update it
    if (review.customerId.toString() !== userId) {
      throw new Error('You are not authorized to update this review');
    }

    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      throw new Error('Rating must be between 1 and 5');
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { $set: data },
      { new: true }
    );

    // Update technician rating if rating changed
    if (data.rating !== undefined) {
      await this.updateTechnicianRating(review.technicianId.toString());
    }

    return updatedReview;
  }

  // Delete a review
  static async deleteReview(reviewId: string, userId: string) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    // Only customer who created the review can delete it
    if (review.customerId.toString() !== userId) {
      throw new Error('You are not authorized to delete this review');
    }

    await Review.findByIdAndDelete(reviewId);

    // Update technician rating
    await this.updateTechnicianRating(review.technicianId.toString());

    return { message: 'Review deleted successfully' };
  }

  // Check if a customer can review a repair
  static async canReview(repairId: string, customerId: string) {
    const repair = await Repair.findById(repairId);
    if (!repair) {
      return { canReview: false, message: 'Repair not found' };
    }

    if (repair.status !== 'completed') {
      return { canReview: false, message: 'Repair must be completed to review' };
    }

    if (repair.customerId.toString() !== customerId) {
      return { canReview: false, message: 'You are not the customer for this repair' };
    }

    const existingReview = await Review.findOne({
      repairId: new mongoose.Types.ObjectId(repairId),
      customerId: new mongoose.Types.ObjectId(customerId),
    });

    if (existingReview) {
      return { canReview: false, message: 'You have already reviewed this repair' };
    }

    return { canReview: true, message: 'You can review this repair' };
  }

  // Add response to a review (by technician)
  static async addResponse(reviewId: string, technicianId: string, response: string) {
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new Error('Review not found');
    }

    // Only the technician can respond
    if (review.technicianId.toString() !== technicianId) {
      throw new Error('You are not authorized to respond to this review');
    }

    return Review.findByIdAndUpdate(
      reviewId,
      {
        $set: {
          response,
          responseDate: new Date(),
        },
      },
      { new: true }
    );
  }
}