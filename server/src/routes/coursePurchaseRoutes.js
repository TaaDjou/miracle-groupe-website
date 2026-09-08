import { Router } from 'express';
import {
  createPurchase,
  getMyPurchases,
  getAllPurchases,
  updatePurchaseStatus,
} from '../controllers/coursePurchaseController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.post('/', createPurchase);
router.get('/mine', getMyPurchases);
router.get('/', authorize('admin'), getAllPurchases);
router.patch('/:id/status', authorize('admin'), updatePurchaseStatus);

export default router;
