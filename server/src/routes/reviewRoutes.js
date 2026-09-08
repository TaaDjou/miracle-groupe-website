import { Router } from 'express';
import { createOrUpdateReview, getCourseReviews, getFeaturedReviews, deleteReview } from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/featured', getFeaturedReviews);
router.get('/course/:courseId', getCourseReviews);
router.post('/', protect, createOrUpdateReview);
router.delete('/:id', protect, deleteReview);

export default router;
