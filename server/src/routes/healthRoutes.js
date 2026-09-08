import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    dbState: mongoose.connection.readyState, // 1 = connected
    timestamp: new Date().toISOString(),
  });
});

export default router;
