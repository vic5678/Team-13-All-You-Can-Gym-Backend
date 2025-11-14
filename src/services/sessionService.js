import Session from '../models/session.js';

/**
 * Service to handle session-related business logic.
 */
class SessionService {
    /**
     * Create a new session.
     * @param {Object} sessionData - The session data to create.
     * @returns {Promise<Object>} - The created session.
     */
    async createSession(sessionData) {
        try {
            const session = new Session(sessionData);
            return await session.save();
        } catch (error) {
            throw new Error('Error creating session: ' + error.message);
        }
    }

    /**
     * Get all sessions.
     * @returns {Promise<Array>} - List of all sessions.
     */
    async getAllSessions() {
        try {
            return await Session.find();
        } catch (error) {
            throw new Error('Error retrieving sessions: ' + error.message);
        }
    }

    /**
     * Get a session by ID.
     * @param {string} sessionId - The ID of the session to retrieve.
     * @returns {Promise<Object>} - The session object.
     */
    async getSessionById(sessionId) {
        try {
            return await Session.findById(sessionId);
        } catch (error) {
            throw new Error('Error retrieving session: ' + error.message);
        }
    }

    /**
     * Update a session by ID.
     * @param {string} sessionId - The ID of the session to update.
     * @param {Object} updateData - The data to update the session with.
     * @returns {Promise<Object>} - The updated session.
     */
    async updateSession(sessionId, updateData) {
        try {
            return await Session.findByIdAndUpdate(sessionId, updateData, { new: true });
        } catch (error) {
            throw new Error('Error updating session: ' + error.message);
        }
    }

    /**
     * Delete a session by ID.
     * @param {string} sessionId - The ID of the session to delete.
     * @returns {Promise<Object>} - The deleted session.
     */
    async deleteSession(sessionId) {
        try {
            return await Session.findByIdAndDelete(sessionId);
        } catch (error) {
            throw new Error('Error deleting session: ' + error.message);
        }
    }

    /**
     * Search for sessions by keyword.
     * @param {string} keyword - The keyword to search for in session names.
     * @returns {Promise<Array>} - List of matching sessions.
     */
    async searchSessions(keyword) {
        try {
            if (!keyword || keyword.trim() === '') {
                return [];
            }
            const query = {
                $or: [
                    { name: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } }
                ]
            };
            return await Session.find(query);
        } catch (error) {
            throw new Error('Error searching sessions: ' + error.message);
        }
    }
}

export default new SessionService();