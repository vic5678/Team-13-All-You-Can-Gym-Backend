import express from 'express';
import { createGymAdmin, getGymAdmin, addGymToAdmin, loginGymAdmin } from '../controllers/gymAdminController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Create a new gym admin (open or restricted depending on app policy)
router.post('/', createGymAdmin);

// Login gym admin
router.post('/login', loginGymAdmin);

// Get gym admin details
router.get('/:id', authenticate, getGymAdmin);

// Add a gym to admin (admin only)
router.post('/:adminId/gyms', authenticate, addGymToAdmin);

export default router;
