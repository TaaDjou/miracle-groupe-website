import { Router } from 'express';
import { verifyCertificate } from '../controllers/enrollmentController.js';

const router = Router();

router.get('/:enrollmentId/verify', verifyCertificate);

export default router;
