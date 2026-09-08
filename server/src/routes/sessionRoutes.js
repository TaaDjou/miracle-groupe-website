import { Router } from 'express';
import {
  getSessions,
  getMySessions,
  getMyRegistrations,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  registerForSession,
  unregisterFromSession,
} from '../controllers/sessionController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', getSessions);
router.get('/mine', protect, authorize('instructor', 'admin'), getMySessions);
router.get('/mine/registrations', protect, getMyRegistrations);
router.get('/:id', optionalAuth, getSessionById);

router.post('/', protect, authorize('instructor', 'admin'), createSession);
router.put('/:id', protect, authorize('instructor', 'admin'), updateSession);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteSession);

router.post('/:id/register', protect, registerForSession);
router.delete('/:id/register', protect, unregisterFromSession);

export default router;
