import Announcement from '../models/announcement.js';
import Session from '../models/session.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { successResponse, errorResponse } from '../utils/responses.js';

/**
 * Create a new announcement
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export const createAnnouncement = async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        // Validate that sessionId is provided
        if (!sessionId) {
            return errorResponse(res, 400, 'Session ID is required');
        }
        
        // Verify that the session exists
        const session = await Session.findById(sessionId);
        if (!session) {
            return errorResponse(res, 404, ERROR_MESSAGES.SESSION_NOT_FOUND);
        }
        
        const announcement = new Announcement(req.body);
        await announcement.save();
        return successResponse(res, 201, SUCCESS_MESSAGES.ANNOUNCEMENT_CREATED, announcement);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * Get all announcements
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export const getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find();
        return successResponse(res, 200, SUCCESS_MESSAGES.ANNOUNCEMENTS_RETRIEVED, announcements);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * Get an announcement by ID
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export const getAnnouncementById = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) {
            return errorResponse(res, 404, ERROR_MESSAGES.ANNOUNCEMENT_NOT_FOUND);
        }
        return successResponse(res, 200, SUCCESS_MESSAGES.ANNOUNCEMENT_RETRIEVED, announcement);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.ANNOUNCEMENT_NOT_FOUND, error);
    }
};

/**
 * Update an announcement by ID
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export const updateAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!announcement) {
            return errorResponse(res, 404, ERROR_MESSAGES.ANNOUNCEMENT_NOT_FOUND);
        }
        return successResponse(res, 200, SUCCESS_MESSAGES.ANNOUNCEMENT_UPDATED, announcement);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * Delete an announcement by ID
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export const deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await Announcement.findByIdAndDelete(req.params.id);
        if (!announcement) {
            return errorResponse(res, 404, ERROR_MESSAGES.ANNOUNCEMENT_NOT_FOUND);
        }
        return successResponse(res, 204, SUCCESS_MESSAGES.ANNOUNCEMENT_DELETED);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.INVALID_INPUT, error);
    }
};