import gymAdminService from '../services/gymAdminService.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../config/constants.js';
import { successResponse, errorResponse, createdResponse } from '../utils/responses.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const createGymAdmin = async (req, res) => {
    try {
        const admin = await gymAdminService.createAdmin(req.body);
        return createdResponse(res, admin, SUCCESS_MESSAGES.GYM_ADMIN_CREATED || 'Gym admin created');
    } catch (error) {
        return errorResponse(res, 500, error.message || ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

export const getGymAdmin = async (req, res) => {
    try {
        const admin = await gymAdminService.getAdminById(req.params.id);
        if (!admin) return errorResponse(res, 404, ERROR_MESSAGES.INVALID_INPUT);
        return successResponse(res, 200, SUCCESS_MESSAGES.GYM_ADMIN_RETRIEVED || 'Gym admin retrieved', admin);
    } catch (error) {
        return errorResponse(res, 500, error.message || ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

export const addGymToAdmin = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { gymId } = req.body;
        const admin = await gymAdminService.addGymToAdmin(adminId, gymId);
        return successResponse(res, 200, SUCCESS_MESSAGES.GYM_UPDATED || 'Gym added to admin', admin);
    } catch (error) {
        return errorResponse(res, 500, error.message || ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

export default {
    createGymAdmin,
    getGymAdmin,
    addGymToAdmin,
};

export const loginGymAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return errorResponse(res, 400, 'Email and password are required');

        const admin = await gymAdminService.findByEmail(email);
        if (!admin) return errorResponse(res, 401, 'Invalid email or password');

        const match = await bcrypt.compare(password, admin.password);
        if (!match) return errorResponse(res, 401, 'Invalid email or password');
        console.log(admin);
        const token = jwt.sign({ id: admin._id, role: 'gymAdmin' }, process.env.JWT_SECRET, { expiresIn: '30d' });

        return successResponse(res, 200, 'Gym admin logged in successfully', {
            _id: admin._id,
            username: admin.username,
            email: admin.email,
            gyms: admin.gyms,
            token,
        });
    } catch (error) {
        return errorResponse(res, 500, error.message || ERROR_MESSAGES.INVALID_INPUT, error);
    }
};
