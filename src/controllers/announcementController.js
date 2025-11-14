import announcementService from '../services/announcementService.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { successResponse, errorResponse } from '../utils/responses.js';

/**
 * Create a new announcement
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export const createAnnouncement = async (req, res) => {
    try {
        const announcement = await announcementService.createAnnouncement(req.body);
        return successResponse(res, 201, SUCCESS_MESSAGES.ANNOUNCEMENT_CREATED, announcement);
    } catch (error) {
        return errorResponse(res, 500, error.message || ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * Get all announcements
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export const getAnnouncements = async (req, res) => {
    try {
        const announcements = await announcementService.getAllAnnouncements();
        return successResponse(res, 200, SUCCESS_MESSAGES.ANNOUNCEMENTS_RETRIEVED, announcements);
    } catch (error) {
        return errorResponse(res, 500, error.message || ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * Get an announcement by ID
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export const getAnnouncementById = async (req, res) => {
    try {
        const announcement = await announcementService.getAnnouncementById(req.params.id);
        if (!announcement) {
            return errorResponse(res, 404, ERROR_MESSAGES.ANNOUNCEMENT_NOT_FOUND);
        }
        return successResponse(res, 200, SUCCESS_MESSAGES.ANNOUNCEMENT_RETRIEVED, announcement);
    } catch (error) {
        return errorResponse(res, 500, error.message || ERROR_MESSAGES.ANNOUNCEMENT_NOT_FOUND, error);
    }
};

/**
 * Update an announcement by ID
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export const updateAnnouncement = async (req, res) => {
    try {
        const announcement = await announcementService.updateAnnouncement(req.params.id, req.body);
        if (!announcement) {
            return errorResponse(res, 404, ERROR_MESSAGES.ANNOUNCEMENT_NOT_FOUND);
        }
        return successResponse(res, 200, SUCCESS_MESSAGES.ANNOUNCEMENT_UPDATED, announcement);
    } catch (error) {
        return errorResponse(res, 500, error.message || ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * Delete an announcement by ID
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export const deleteAnnouncement = async (req, res) => {
    try {
        const announcement = await announcementService.deleteAnnouncement(req.params.id);
        if (!announcement) {
            return errorResponse(res, 404, ERROR_MESSAGES.ANNOUNCEMENT_NOT_FOUND);
        }
        return successResponse(res, 200, SUCCESS_MESSAGES.ANNOUNCEMENT_DELETED);
    } catch (error) {
        return errorResponse(res, 500, error.message || ERROR_MESSAGES.INVALID_INPUT, error);
    }
};