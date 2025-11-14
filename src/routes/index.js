import express from 'express';
import sessionRoute from './sessionRoutes.js';

const router = express.Router();

// Mounting routes
router.use('/sessions', sessionRoute);

export default router;