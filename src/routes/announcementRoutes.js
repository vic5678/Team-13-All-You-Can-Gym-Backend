import express from 'express';
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
} from '../controllers/announcementController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Route to create a new announcement
router.post('/', authenticate, createAnnouncement);

// Route to get all announcements
router.get('/', getAnnouncements);

// Route to get a specific announcement by ID
router.get('/:id', getAnnouncementById);

// Route to update an announcement
router.put('/:id', authenticate, updateAnnouncement);

// Route to delete an announcement
router.delete('/:id', authenticate, deleteAnnouncement);

export default router;