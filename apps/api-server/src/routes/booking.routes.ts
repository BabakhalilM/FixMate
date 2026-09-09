// // apps/api-server/src/routes/booking.routes.ts
// import express from 'express';
// import { authenticate, isCustomer, isTechnician, isAdmin } from '../middleware/auth';

// const router = express.Router();

// // All booking routes require authentication
// router.use(authenticate);

// // Customer can create bookings
// router.post('/', isCustomer, createBooking);

// // Technician can view their assigned bookings
// router.get('/technician', isTechnician, getTechnicianBookings);

// // Admin can view all bookings
// router.get('/admin/all', isAdmin, getAllBookings);

// // Customer can view their bookings
// router.get('/customer', isCustomer, getCustomerBookings);

// // Technician can update booking status
// router.patch('/:id/status', isTechnician, updateBookingStatus);

// // Admin can delete bookings
// // router.delete('/:id', isAdmin, deleteBooking);

// export default router;