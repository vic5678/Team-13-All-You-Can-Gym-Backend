import express from 'express';
import announcementRoutes from './announcementRoutes.js';
import sessionRoute from './sessionRoutes.js';
import userRouter from './userRoutes.js';

const router = express.Router();

// Mounting routes
router.use('/announcements', announcementRoutes);
router.use('/sessions', sessionRoute);
router.use('/users', userRouter);

export default router;