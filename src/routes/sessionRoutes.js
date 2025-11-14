import express from 'express';
import {
  createSession,
  getAllSessions,
  getSessionById,
  updateSession,
  deleteSession,
  searchSessions
} from '../controllers/sessionController.js';

const router = express.Router();

// Route to create a new session
router.post('/', createSession);

// Route to get all sessions
router.get('/', getAllSessions);

// Route to search sessions by name/keyword
router.get('/search', searchSessions);

// Route to get a session by ID
router.get('/:sessionId([0-9a-fA-F]{24})', getSessionById);

// Route to update a session
router.put('/:sessionId([0-9a-fA-F]{24})', updateSession);

// Route to delete a session
router.delete('/:sessionId', deleteSession);


export default router;