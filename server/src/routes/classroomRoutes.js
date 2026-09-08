import { Router } from 'express';
import {
  getClassrooms,
  getClassroomById,
  createClassroom,
  updateClassroom,
  deleteClassroom,
} from '../controllers/classroomController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, getClassrooms);
router.get('/:id', optionalAuth, getClassroomById);

router.post('/', protect, authorize('admin'), createClassroom);
router.put('/:id', protect, authorize('admin'), updateClassroom);
router.delete('/:id', protect, authorize('admin'), deleteClassroom);

export default router;
