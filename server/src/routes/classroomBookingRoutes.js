import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus,
} from '../controllers/classroomBookingController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/', createBooking);
router.get('/mine', getMyBookings);
router.get('/', authorize('admin'), getAllBookings);
router.patch('/:id/status', authorize('admin'), updateBookingStatus);

export default router;
