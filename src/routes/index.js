import express from 'express';
import announcementRoutes from './announcementRoutes.js';
import sessionRoute from './sessionRoutes.js';

const router = express.Router();

// Mounting routes
router.use('/announcements', announcementRoutes);
router.use('/sessions', sessionRoute);

export default router;