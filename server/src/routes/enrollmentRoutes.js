import { Router } from 'express';
import {
  enroll,
  getMyEnrollments,
  getEnrollmentForCourse,
  markLessonComplete,
  getCertificate,
} from '../controllers/enrollmentController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/', enroll);
router.get('/mine', getMyEnrollments);
router.get('/course/:courseId', getEnrollmentForCourse);
router.get('/course/:courseId/certificate', getCertificate);
router.patch('/:courseId/lessons/:lessonId/complete', markLessonComplete);

export default router;
