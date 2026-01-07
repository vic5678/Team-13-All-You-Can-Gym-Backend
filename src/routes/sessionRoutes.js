import express from 'express';
import {
  createSession,
  getAllSessions,
  getSessionById,
  updateSession,
  deleteSession,
  searchSessions
} from '../controllers/sessionController.js';
import { validateCreateSession } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';
import { ensureGymAdmin, authorizeSessionForGymAdmin } from '../middleware/gymAdminAuth.js';

const router = express.Router();

// Route to create a new session (gym admin only; must specify gymId in body)
router.post('/', validateCreateSession, createSession);

// Route to get all sessions
router.get('/', getAllSessions);

// Route to search sessions by name/keyword
router.get('/search', searchSessions);

// Route to get a session by ID
router.get('/:sessionId([0-9a-fA-F]{24})', getSessionById);

// Route to update a session (gym admin only)
router.put('/:sessionId([0-9a-fA-F]{24})', authenticate, ensureGymAdmin, authorizeSessionForGymAdmin(), updateSession);

// Route to delete a session (gym admin only)
router.delete('/:sessionId', authenticate, ensureGymAdmin, authorizeSessionForGymAdmin(), deleteSession);


export default router;