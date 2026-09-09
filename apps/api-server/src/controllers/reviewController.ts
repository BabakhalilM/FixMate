// apps/api-server/src/controllers/reviewController.ts
import { Request, Response } from 'express';
import { ReviewService } from '../services/reviewServices';
import { AuthRequest } from '../middleware/auth';

export const reviewController = {
  // Get reviews (with filters)
  async getReviews(req: AuthRequest, res: Response) {
    try {
      const {
        technicianId,
        customerId,
        repairId,
        deviceType,
        rating,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
      } = req.query;

      let result;

      if (technicianId) {
        result = await ReviewService.getTechnicianReviews(
          technicianId as string,
          { page: Number(page), limit: Number(limit), rating: Number(rating), sortBy: sortBy as string }
        );
      } else if (customerId) {
        result = await ReviewService.getCustomerReviews(
          customerId as string,
          { page: Number(page), limit: Number(limit), rating: Number(rating) }
        );
      } else if (repairId) {
        result = await ReviewService.getRepairReviews(repairId as string);
      } else if (deviceType) {
        result = await ReviewService.getDeviceReviews(
          deviceType as string,
          { page: Number(page), limit: Number(limit), rating: Number(rating) }
        );
      } else {
        // Default: get all reviews (paginated)
        result = await ReviewService.getTechnicianReviews('', { page: Number(page), limit: Number(limit) });
      }

      res.json(result);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  },

  // Get technician reviews
  async getTechnicianReviews(req: AuthRequest, res: Response) {
    try {
      const { technicianId } = req.params;
      const { page = 1, limit = 10, rating, sortBy = 'createdAt' } = req.query;

      const result = await ReviewService.getTechnicianReviews(
        technicianId,
        {
          page: Number(page),
          limit: Number(limit),
          rating: rating ? Number(rating) : undefined,
          sortBy: sortBy as string,
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Error fetching technician reviews:', error);
      res.status(500).json({ error: 'Failed to fetch technician reviews' });
    }
  },

  // Get customer reviews
  async getCustomerReviews(req: AuthRequest, res: Response) {
    try {
      const { customerId } = req.params;
      const { page = 1, limit = 10, rating } = req.query;

      const result = await ReviewService.getCustomerReviews(
        customerId,
        {
          page: Number(page),
          limit: Number(limit),
          rating: rating ? Number(rating) : undefined,
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Error fetching customer reviews:', error);
      res.status(500).json({ error: 'Failed to fetch customer reviews' });
    }
  },

  // Get repair reviews
  async getRepairReviews(req: AuthRequest, res: Response) {
    try {
      const { repairId } = req.params;
      const reviews = await ReviewService.getRepairReviews(repairId);
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching repair reviews:', error);
      res.status(500).json({ error: 'Failed to fetch repair reviews' });
    }
  },

  // Get device reviews
  async getDeviceReviews(req: AuthRequest, res: Response) {
    try {
      const { deviceType } = req.params;
      const { technicianId, customerId, rating, page = 1, limit = 10 } = req.query;

      const result = await ReviewService.getDeviceReviews(
        deviceType,
        {
          technicianId: technicianId as string,
          customerId: customerId as string,
          rating: rating ? Number(rating) : undefined,
          page: Number(page),
          limit: Number(limit),
        }
      );

      res.json(result);
    } catch (error) {
      console.error('Error fetching device reviews:', error);
      res.status(500).json({ error: 'Failed to fetch device reviews' });
    }
  },

  // Create review
  async createReview(req: AuthRequest, res: Response) {
    try {
      const review = await ReviewService.createReview({
        ...req.body,
        customerId: req.user.id, // Get from auth middleware
      });

      res.status(201).json(review);
    } catch (error: any) {
      console.error('Error creating review:', error);
      res.status(400).json({ error: error.message || 'Failed to create review' });
    }
  },

  // Update review
  async updateReview(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { rating, comment, isPublic } = req.body;

      const review = await ReviewService.updateReview(
        id,
        req.user.id,
        { rating, comment, isPublic }
      );

      res.json(review);
    } catch (error: any) {
      console.error('Error updating review:', error);
      res.status(400).json({ error: error.message || 'Failed to update review' });
    }
  },

  // Delete review
  async deleteReview(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await ReviewService.deleteReview(id, req.user.id);
      res.json(result);
    } catch (error: any) {
      console.error('Error deleting review:', error);
      res.status(400).json({ error: error.message || 'Failed to delete review' });
    }
  },

  // Check if can review
  async canReview(req: AuthRequest, res: Response) {
    try {
      const { repairId, customerId } = req.params;
      const result = await ReviewService.canReview(repairId, customerId);
      res.json(result);
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      res.status(500).json({ error: 'Failed to check review eligibility' });
    }
  },

  // Add response to review
  async addResponse(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { response } = req.body;

      const review = await ReviewService.addResponse(id, req.user.id, response);
      res.json(review);
    } catch (error: any) {
      console.error('Error adding response:', error);
      res.status(400).json({ error: error.message || 'Failed to add response' });
    }
  },

  // Get technician stats
  async getTechnicianStats(req: AuthRequest, res: Response) {
    try {
      const { technicianId } = req.params;
      const stats = await ReviewService.updateTechnicianRating(technicianId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching technician stats:', error);
      res.status(500).json({ error: 'Failed to fetch technician stats' });
    }
  },
};