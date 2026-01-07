import GymAdmin from '../models/gymAdmin.js';
import Gym from '../models/gym.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { ERROR_MESSAGES } from '../config/constants.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";

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
        const admin = await GymAdmin.findById(adminId);
        if (!admin) throw new Error(ERROR_MESSAGES.INVALID_INPUT);
        if (!admin.gyms.map(g => g.toString()).includes(gymId.toString())) {
            admin.gyms.push(gymId);
            await admin.save();
        }
        return admin;
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

    async loginAdmin(email, password) {
        // Validate input
        if (!email || !password) {
            throw new Error("Email/username and password are required");
        }

        const identifier = email; // could be "admin1" or "admin1@example.com"

        // Find admin by email or username
        const admin = await GymAdmin.findOne({
            $or: [{ email: identifier }, { username: identifier }],
        });

        if (!admin) {
            throw new Error("Invalid email or password");
        }

        // Verify password
        const match = await bcrypt.compare(password, admin.password);
        if (!match) {
            throw new Error("Invalid email or password");
        }

        // Log JWT secret for debugging
        console.log("JWT_SECRET used for gymAdmin login:", JWT_SECRET);

        // Generate JWT token
        const token = jwt.sign(
            { id: admin._id, role: "gymAdmin" },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Return admin data with token
        return {
            _id: admin._id,
            username: admin.username,
            email: admin.email,
            gyms: admin.gyms,
            token,
        };
    }
}

export default new GymAdminService();