import gymAdminService from '../services/gymAdminService.js';
import GymAdmin from '../models/gymAdmin.js';
import { ERROR_MESSAGES } from '../config/constants.js';

/**
 * Ensure the authenticated user is a GymAdmin. Attaches `req.gymAdmin`.
 */
export const ensureGymAdmin = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: ERROR_MESSAGES.UNAUTHORIZED_ACCESS });
        }
        const admin = await GymAdmin.findById(userId);
        if (!admin) {
            return res.status(403).json({ success: false, message: 'Forbidden: Not a gym admin' });
        }
        req.gymAdmin = admin;
        next();
    } catch (error) {
        return res.status(500).json({ success: false, message: ERROR_MESSAGES.INVALID_INPUT });
    }
};

export const authorizeGymForGymAdmin = (paramName = 'id') => {
    return async (req, res, next) => {
        try {
            const adminId = req.user?.id;
            const gymId = req.params[paramName] || req.body.gymId;
            if (!gymId) return res.status(400).json({ success: false, message: 'Gym id required' });
            const owns = await gymAdminService.ownsGym(adminId, gymId);
            if (!owns) return res.status(403).json({ success: false, message: 'Forbidden: you do not manage this gym' });
            next();
        } catch (error) {
            return res.status(500).json({ success: false, message: ERROR_MESSAGES.INVALID_INPUT });
        }
    };
};

export const authorizeSessionForGymAdmin = () => {
    return async (req, res, next) => {
        try {
            const adminId = req.user?.id;
            const sessionId = req.params.sessionId || req.body.sessionId;
            if (!sessionId) return res.status(400).json({ success: false, message: 'Session id required' });
            const owns = await gymAdminService.ownsSession(adminId, sessionId);
            if (!owns) return res.status(403).json({ success: false, message: 'Forbidden: you do not manage the gym for this session' });
            next();
        } catch (error) {
            return res.status(500).json({ success: false, message: ERROR_MESSAGES.INVALID_INPUT });
        }
    };
};

export const authorizeAnnouncementForGymAdmin = () => {
    return async (req, res, next) => {
        try {
            const adminId = req.user?.id;
            const announcementId = req.params.id || req.body.announcementId;
            if (!announcementId) return res.status(400).json({ success: false, message: 'Announcement id required' });
            const owns = await gymAdminService.ownsAnnouncement(adminId, announcementId);
            if (!owns) return res.status(403).json({ success: false, message: 'Forbidden: you do not manage the gym for this announcement' });
            next();
        } catch (error) {
            return res.status(500).json({ success: false, message: ERROR_MESSAGES.INVALID_INPUT });
        }
    };
};
