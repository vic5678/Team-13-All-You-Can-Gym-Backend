import sessionService from '../services/sessionService.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { successResponse, errorResponse, createdResponse } from '../utils/responses.js';

/**
 * Create a new session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createSession = async (req, res) => {
    try {
        const newSession = await sessionService.createSession(req.body);
        return createdResponse(res, newSession, SUCCESS_MESSAGES.SESSION_CREATED);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * Get all sessions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllSessions = async (req, res) => {
    try {
        const sessions = await sessionService.getAllSessions();
        return successResponse(res, 200, SUCCESS_MESSAGES.SESSION_RETRIEVED, sessions);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * Get session by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getSessionById = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await sessionService.getSessionById(sessionId);
        if (!session) {
            return errorResponse(res, 404, ERROR_MESSAGES.SESSION_NOT_FOUND);
        }
        return successResponse(res, 200, SUCCESS_MESSAGES.SESSION_RETRIEVED, session);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.SESSION_NOT_FOUND, error);
    }
};

/**
 * Update a session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const updatedSession = await sessionService.updateSession(sessionId, req.body);
        if (!updatedSession) {
            return errorResponse(res, 404, ERROR_MESSAGES.SESSION_NOT_FOUND);
        }
        return successResponse(res, 200, SUCCESS_MESSAGES.SESSION_UPDATED, updatedSession);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * Delete a session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const deletedSession = await sessionService.deleteSession(sessionId);
        if (!deletedSession) {
            return errorResponse(res, 404, ERROR_MESSAGES.SESSION_NOT_FOUND);
        }
        return res.status(204).send();
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * Search for sessions by keyword.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
export const searchSessions = async (req, res) => {
    try {
        const { keyword } = req.query;
        const sessions = await sessionService.searchSessions(keyword);
        return successResponse(res, 200, SUCCESS_MESSAGES.SESSION_RETRIEVED, sessions);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.INVALID_INPUT, error);
    }
};