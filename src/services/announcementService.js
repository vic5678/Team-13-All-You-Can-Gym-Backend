import Announcement from '../models/announcement.js';
import Session from '../models/session.js';
import { ERROR_MESSAGES } from '../config/constants.js';

/**
 * Service to handle business logic related to announcements.
 */
class AnnouncementService {
    /**
     * Create a new announcement.
     * @param {Object} announcementData - The data for the announcement.
     * @returns {Promise<Object>} - The created announcement.
     * @throws {Error} - If sessionId is missing or session doesn't exist.
     */
    async createAnnouncement(announcementData) {
        try {
            const { sessionId } = announcementData;
            
            // Validate that sessionId is provided
            if (!sessionId) {
                throw new Error('Session ID is required');
            }
            
            // Verify that the session exists
            const session = await Session.findById(sessionId);
            if (!session) {
                throw new Error(ERROR_MESSAGES.SESSION_NOT_FOUND);
            }
            
            const announcement = new Announcement(announcementData);
            return await announcement.save();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all announcements.
     * @returns {Promise<Array>} - List of announcements.
     */
    async getAllAnnouncements() {
        try {
            return await Announcement.find();
        } catch (error) {
            throw new Error(ERROR_MESSAGES.INVALID_INPUT);
        }
    }

    /**
     * Get an announcement by ID.
     * @param {string} id - The ID of the announcement.
     * @returns {Promise<Object>} - The announcement.
     */
    async getAnnouncementById(id) {
        try {
            return await Announcement.findById(id);
        } catch (error) {
            throw new Error(ERROR_MESSAGES.ANNOUNCEMENT_NOT_FOUND);
        }
    }

    /**
     * Update an announcement by ID.
     * @param {string} id - The ID of the announcement.
     * @param {Object} updateData - The data to update.
     * @returns {Promise<Object>} - The updated announcement.
     */
    async updateAnnouncement(id, updateData) {
        try {
            return await Announcement.findByIdAndUpdate(id, updateData, { new: true });
        } catch (error) {
            throw new Error(ERROR_MESSAGES.INVALID_INPUT);
        }
    }

    /**
     * Delete an announcement by ID.
     * @param {string} id - The ID of the announcement.
     * @returns {Promise<Object>} - The deleted announcement.
     */
    async deleteAnnouncement(id) {
        try {
            return await Announcement.findByIdAndDelete(id);
        } catch (error) {
            throw new Error(ERROR_MESSAGES.INVALID_INPUT);
        }
    }
}

export default new AnnouncementService();