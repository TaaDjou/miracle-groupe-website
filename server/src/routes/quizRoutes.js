import { Router } from 'express';
import { submitQuizAttempt, getMyAttempts } from '../controllers/quizController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/:courseId/lessons/:lessonId/attempts', submitQuizAttempt);
router.get('/:courseId/lessons/:lessonId/attempts', getMyAttempts);

export default router;
