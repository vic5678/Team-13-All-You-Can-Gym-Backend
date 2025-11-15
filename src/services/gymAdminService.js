import GymAdmin from '../models/gymAdmin.js';
import Gym from '../models/gym.js';
import bcrypt from 'bcryptjs';
import { ERROR_MESSAGES } from '../config/constants.js';

class GymAdminService {
    async createAdmin(adminData) {
        try {
            // Hash password before saving
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(adminData.password, salt);
            const admin = new GymAdmin({
                ...adminData,
                password: hashed,
            });
            return await admin.save();
        } catch (error) {
            throw new Error(ERROR_MESSAGES.INVALID_INPUT);
        }
    }

    async findByEmail(email) {
        try {
            return await GymAdmin.findOne({ email });
        } catch (error) {
            throw new Error(ERROR_MESSAGES.INVALID_INPUT);
        }
    }

    async getAdminById(adminId) {
        try {
            return await GymAdmin.findById(adminId).populate('gyms');
        } catch (error) {
            throw new Error(ERROR_MESSAGES.INVALID_INPUT);
        }
    }

    async addGymToAdmin(adminId, gymId) {
        try {
            const admin = await GymAdmin.findById(adminId);
            if (!admin) throw new Error(ERROR_MESSAGES.INVALID_INPUT);
            if (!admin.gyms.map(g => g.toString()).includes(gymId.toString())) {
                admin.gyms.push(gymId);
                await admin.save();
            }
            return admin;
        } catch (error) {
            throw error;
        }
    }

    async ownsGym(adminId, gymId) {
        try {
            const admin = await GymAdmin.findById(adminId);
            if (!admin) return false;
            return admin.gyms.map(g => g.toString()).includes(gymId.toString());
        } catch (error) {
            return false;
        }
    }

    async ownsSession(adminId, sessionId) {
        try {
            // find a gym that includes this session
            const gym = await Gym.findOne({ sessions: sessionId }, { _id: 1 });
            if (!gym) return false;
            return await this.ownsGym(adminId, gym._id);
        } catch (error) {
            return false;
        }
    }

    async ownsAnnouncement(adminId, announcement) {
        try {
            // announcement param can be an announcement id or object
            const announcementId = typeof announcement === 'string' ? announcement : announcement?._id;
            const Announcement = (await import('../models/announcement.js')).default;
            const ann = await Announcement.findById(announcementId);
            if (!ann) return false;
            const sessionId = ann.sessionId;
            return await this.ownsSession(adminId, sessionId);
        } catch (error) {
            return false;
        }
    }
}

export default new GymAdminService();
