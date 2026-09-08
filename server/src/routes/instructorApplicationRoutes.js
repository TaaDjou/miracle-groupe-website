import { Router } from 'express';
import {
  createInstructorApplication,
  getInstructorApplications,
  updateInstructorApplicationStatus,
} from '../controllers/instructorApplicationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/', createInstructorApplication);
router.get('/', protect, authorize('admin'), getInstructorApplications);
router.patch('/:id/status', protect, authorize('admin'), updateInstructorApplicationStatus);

export default router;
