import express from 'express';
import testRoute from './testRoute.js';

const router = express.Router();

// Mounting routes
router.use('/test', testRoute);

export default router;