// apps/api-server/src/routes/reviewRoutes.ts
import express from 'express';
// import { reviewController } from '../controllers/reviewcontroller';
import { authenticate } from '../middleware/auth';
import { reviewController } from '../controllers/reviewController';
// import { reviewController } from '../controllers/reviewController';
// import { auth } from '../middleware/auth';

const reviewrouter = express.Router();

// Public routes (with optional auth)
reviewrouter.get('/', reviewController.getReviews);
reviewrouter.get('/technician/:technicianId', reviewController.getTechnicianReviews);
reviewrouter.get('/customer/:customerId', reviewController.getCustomerReviews);
reviewrouter.get('/repair/:repairId', reviewController.getRepairReviews);
reviewrouter.get('/device/:deviceType', reviewController.getDeviceReviews);
reviewrouter.get('/technician/:technicianId/stats', reviewController.getTechnicianStats);
reviewrouter.get('/can-review/:repairId/:customerId', reviewController.canReview);

// Protected routes (require authentication)
reviewrouter.post('/', authenticate, reviewController.createReview);
reviewrouter.put('/:id', authenticate, reviewController.updateReview);
reviewrouter.delete('/:id', authenticate, reviewController.deleteReview);
reviewrouter.post('/:id/response', authenticate, reviewController.addResponse);

export default reviewrouter;