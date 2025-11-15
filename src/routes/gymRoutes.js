import express from 'express';
import {
  getAllGyms,
  getGymById,
  createGym,
  updateGym,
  deleteGym,
  filterGyms,
  searchGyms
} from '../controllers/gymController.js';
import { authenticate } from '../middleware/auth.js';
import { ensureGymAdmin, authorizeGymForGymAdmin } from '../middleware/gymAdminAuth.js';

const router = express.Router();

// Route to get all partner gyms
router.get('/', getAllGyms);

// Route to filter gyms based on preferences
router.get('/filter', filterGyms);

// Route to search gyms by keyword or keywords
router.get('/search', searchGyms);

// Route to get a gym by ID
router.get('/:id', getGymById);

// Route to create a new gym (gym admin creates and becomes admin of the gym)
router.post('/', authenticate, ensureGymAdmin, createGym);

// Route to update an existing gym (gym admin only)
router.put('/:id', authenticate, ensureGymAdmin, authorizeGymForGymAdmin('id'), updateGym);

// Route to delete a gym (gym admin only)
router.delete('/:id', authenticate, ensureGymAdmin, authorizeGymForGymAdmin('id'), deleteGym);

export default router;