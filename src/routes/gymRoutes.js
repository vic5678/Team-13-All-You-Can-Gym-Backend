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

const router = express.Router();

// Route to get all partner gyms
router.get('/', getAllGyms);

// Route to filter gyms based on preferences
router.get('/filter', filterGyms);

// Route to search gyms by keyword or keywords
router.get('/search', searchGyms);

// Route to get a gym by ID
router.get('/:id', getGymById);

// Route to create a new gym
router.post('/', createGym);

// Route to update an existing gym
router.put('/:id', updateGym);

// Route to delete a gym
router.delete('/:id', deleteGym);

export default router;