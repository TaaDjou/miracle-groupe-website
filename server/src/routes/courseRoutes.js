import { Router } from 'express';
import {
  getCourses,
  getMyCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../controllers/courseController.js';
import { submitFinalExamAttempt, getMyFinalExamAttempts } from '../controllers/quizController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', getCourses);
router.get('/mine', protect, authorize('instructor', 'admin'), getMyCourses);
router.get('/:id', optionalAuth, getCourseById);

router.post('/', protect, authorize('instructor', 'admin'), createCourse);
router.put('/:id', protect, authorize('instructor', 'admin'), updateCourse);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteCourse);

router.post('/:courseId/final-exam/attempts', protect, submitFinalExamAttempt);
router.get('/:courseId/final-exam/attempts', protect, getMyFinalExamAttempts);

export default router;
