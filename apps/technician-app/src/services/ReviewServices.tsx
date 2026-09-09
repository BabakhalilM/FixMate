import api from "./apicall";

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  technicianId: string;
  customerId: string;
  repairId?: string;
  deviceType?: string;
  deviceModel?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  technician?: {
    id: string;
    name: string;
    avatar?: string;
  };
  customer?: {
    id: string;
    name: string;
    avatar?: string;
  };
  repair?: {
    id: string;
    deviceType: string;
    deviceModel?: string;
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    [key: number]: number; // 1: 5, 2: 3, 3: 10, 4: 20, 5: 30
  };
  latestReviews: Review[];
  deviceStats: {
    [deviceType: string]: {
      count: number;
      averageRating: number;
    };
  };
}

export interface CreateReviewData {
  rating: number;
  comment?: string;
  technicianId: string;
  customerId: string;
  repairId?: string;
  deviceType?: string;
  deviceModel?: string;
  isPublic?: boolean;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
  isPublic?: boolean;
}

class ReviewService {
  private static instance: ReviewService;
  
  static getInstance(): ReviewService {
    if (!ReviewService.instance) {
      ReviewService.instance = new ReviewService();
    }
    return ReviewService.instance;
  }

  // Get all reviews (with filters)
  async getReviews(filters?: {
    technicianId?: string;
    customerId?: string;
    repairId?: string;
    deviceType?: string;
    rating?: number;
    minRating?: number;
    maxRating?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: 'rating' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ reviews: Review[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const response = await api.get(`/reviews?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }
  }

  // Get reviews for a specific technician
  async getTechnicianReviews(
    technicianId: string,
    options?: {
      page?: number;
      limit?: number;
      rating?: number;
      sortBy?: 'rating' | 'createdAt';
    }
  ): Promise<{ reviews: Review[]; total: number; stats: ReviewStats }> {
    try {
        console.log(`Fetching reviews for technicianId: ${technicianId} with options:`, options)
      const queryParams = new URLSearchParams();
      queryParams.append('technicianId', technicianId);
      if (options?.page) queryParams.append('page', options.page.toString());
      if (options?.limit) queryParams.append('limit', options.limit.toString());
      if (options?.rating) queryParams.append('rating', options.rating.toString());
      if (options?.sortBy) queryParams.append('sortBy', options.sortBy);
      
      const response = await api.get(`/reviews/technician/${technicianId}?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching technician reviews:', error);
      throw error;
    }
  }

  // Get reviews given by a specific customer
  async getCustomerReviews(
    customerId: string,
    options?: {
      page?: number;
      limit?: number;
      rating?: number;
    }
  ): Promise<{ reviews: Review[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('customerId', customerId);
      if (options?.page) queryParams.append('page', options.page.toString());
      if (options?.limit) queryParams.append('limit', options.limit.toString());
      if (options?.rating) queryParams.append('rating', options.rating.toString());
      
      const response = await api.get(`/reviews/customer/${customerId}?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer reviews:', error);
      throw error;
    }
  }

  // Get reviews for a specific repair
  async getRepairReviews(repairId: string): Promise<Review[]> {
    try {
      const response = await api.get(`/reviews/repair/${repairId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching repair reviews:', error);
      throw error;
    }
  }

  // Get review by ID
  async getReviewById(id: string): Promise<Review> {
    try {
      const response = await api.get(`/reviews/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching review:', error);
      throw error;
    }
  }

  // Create a new review
  async createReview(data: CreateReviewData): Promise<Review> {
    try {
      // Validate rating
      if (data.rating < 1 || data.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
      
      const response = await api.post('/reviews', data);
      return response.data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  // Update a review
  async updateReview(id: string, data: UpdateReviewData): Promise<Review> {
    try {
      if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
        throw new Error('Rating must be between 1 and 5');
      }
      
      const response = await api.put(`/reviews/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  }

  // Delete a review
  async deleteReview(id: string): Promise<void> {
    try {
      await api.delete(`/reviews/${id}`);
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }

  // Get review statistics for a technician
  async getTechnicianReviewStats(technicianId: string): Promise<ReviewStats> {
    try {
      const response = await api.get(`/reviews/technician/${technicianId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching technician review stats:', error);
      throw error;
    }
  }

  // Get reviews with filters for a specific device type
  async getDeviceReviews(deviceType: string, filters?: {
    technicianId?: string;
    customerId?: string;
    rating?: number;
    page?: number;
    limit?: number;
  }): Promise<{ reviews: Review[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('deviceType', deviceType);
      if (filters?.technicianId) queryParams.append('technicianId', filters.technicianId);
      if (filters?.customerId) queryParams.append('customerId', filters.customerId);
      if (filters?.rating) queryParams.append('rating', filters.rating.toString());
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      
      const response = await api.get(`/reviews/device/${deviceType}?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching device reviews:', error);
      throw error;
    }
  }

  // Check if a customer can review a technician for a specific repair
  async canReview(repairId: string, customerId: string): Promise<{ canReview: boolean; message?: string }> {
    try {
      const response = await api.get(`/reviews/can-review/${repairId}/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      throw error;
    }
  }
}

export default ReviewService.getInstance();