import express from 'express';
import announcementRoutes from './announcementRoutes.js';
import sessionRoute from './sessionRoutes.js';
import userRouter from './userRoutes.js';
import gymRoutes from './gymRoutes.js';

const router = express.Router();

// Mounting routes
router.use('/announcements', announcementRoutes);
router.use('/sessions', sessionRoute);
router.use('/users', userRouter);
router.use('/gyms', gymRoutes);

export default router;