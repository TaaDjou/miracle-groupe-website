import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import healthRoutes from './routes/healthRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import classroomRoutes from './routes/classroomRoutes.js';
import classroomBookingRoutes from './routes/classroomBookingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import coursePurchaseRoutes from './routes/coursePurchaseRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import instructorApplicationRoutes from './routes/instructorApplicationRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security headers
app.use(helmet());

// Restrict cross-origin requests to the configured frontend origin(s)
const allowedOrigins = (process.env.CLIENT_URL || '').split(',').map((o) => o.trim());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// HTTP request logging — concise in production, verbose in development
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Gzip compression for responses
app.use(compression());

// Parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic rate limiting on the API surface
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/classroom-bookings', classroomBookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/course-purchases', coursePurchaseRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/instructor-applications', instructorApplicationRoutes);

// 404 + centralized error handling
app.use(notFound);
app.use(errorHandler);

export default app;
