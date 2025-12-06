// import express from 'express';
// import {
//   createAnnouncement,
//   getAnnouncements,
//   getAnnouncementById,
//   updateAnnouncement,
//   deleteAnnouncement
// } from '../controllers/announcementController.js';
// import { authenticate } from '../middleware/auth.js';
// import { validateCreateAnnouncement } from '../middleware/validation.js';
// import { ensureGymAdmin, authorizeSessionForGymAdmin, authorizeAnnouncementForGymAdmin } from '../middleware/gymAdminAuth.js';

// const router = express.Router();

// // Route to create a new announcement (gym admin only; must own session)
// router.post('/', authenticate, ensureGymAdmin, authorizeSessionForGymAdmin(), validateCreateAnnouncement, createAnnouncement);

// // Route to get all announcements
// router.get('/', getAnnouncements);

// // Route to get a specific announcement by ID
// router.get('/:id', getAnnouncementById);

// // Route to update an announcement (gym admin only)
// router.put('/:id', authenticate, ensureGymAdmin, authorizeAnnouncementForGymAdmin(), validateCreateAnnouncement, updateAnnouncement);

// // Route to delete an announcement (gym admin only)
// router.delete('/:id', authenticate, ensureGymAdmin, authorizeAnnouncementForGymAdmin(), deleteAnnouncement);

// export default router;