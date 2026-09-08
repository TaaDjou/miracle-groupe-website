import { Router } from 'express';
import { getStats, getUsers, getUserById, getAllCourses } from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.get('/courses', getAllCourses);

export default router;
