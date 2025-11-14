import mongoose from 'mongoose';

/**
 * Announcement Schema
 * @typedef {Object} Announcement
 * @property {string} content - The content of the announcement.
 * @property {string} sessionId - The ID of the session associated with this announcement.
 * @property {Date} createdAt - The date the announcement was created.
 * @property {Date} updatedAt - The date the announcement was last updated.
 */

const announcementSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
    },
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true,
    },
}, {
    timestamps: true,
});

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;