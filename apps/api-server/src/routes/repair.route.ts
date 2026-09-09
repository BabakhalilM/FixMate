// apps/api-server/src/routes/repairRoutes.ts
import express from 'express';
import { authenticate, isTechnician } from '../middleware/auth';
import { repairController } from '../controllers/sevice.controller';

const repairRouter = express.Router();

// Public routes (with optional auth)
repairRouter.get('/', repairController.getRepairs);
repairRouter.get('/stats', repairController.getRepairStats);
repairRouter.get('/technician/:technicianId/stats', repairController.getTechnicianStats);
repairRouter.get('/:id', repairController.getRepairById);

repairRouter.post('/auto-fill', authenticate, repairController.autoFillFromImages);

// Protected routes (require authentication)
repairRouter.post('/create', authenticate,isTechnician, repairController.createRepair);
repairRouter.put('/:id', authenticate, repairController.updateRepair);
repairRouter.patch('/:id/status', authenticate, repairController.updateStatus);
repairRouter.delete('/:id', authenticate, repairController.deleteRepair);

export default repairRouter;