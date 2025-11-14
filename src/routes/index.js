import express from 'express';
import sessionRoute from './sessionRoutes.js';
import userRouter from './userRoutes.js';

const router = express.Router();

// Mounting routes
router.use('/sessions', sessionRoute);
router.use('/users', userRouter);

export default router;