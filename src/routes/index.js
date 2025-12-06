import express from 'express';
// import announcementRoutes from './announcementRoutes.js';
import sessionRoute from './sessionRoutes.js';
import userRouter from './userRoutes.js';
import gymRoutes from './gymRoutes.js';
import gymAdminRoutes from './gymAdminRoutes.js';
import subscriptionRoutes from './subscriptionRoutes.js';
import paymentRoutes from './paymentRoutes.js';

const router = express.Router();

// Mounting routes
// router.use('/announcements', announcementRoutes);
router.use('/sessions', sessionRoute);
router.use('/subscriptions', subscriptionRoutes);
router.use('/users', userRouter);
router.use('/gyms', gymRoutes);
router.use('/gymAdmins', gymAdminRoutes);
router.use('/payments', paymentRoutes);

export default router;