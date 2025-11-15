import Gym from '../models/gym.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { successResponse, errorResponse } from '../utils/responses.js';

/**
 * @description Get all partner gyms
 * @route GET /gyms
 * @access Public
 */
export const getAllGyms = async (req, res) => {
    try {
        const gyms = await Gym.find();
        return successResponse(res, 200, SUCCESS_MESSAGES.GYMS_RETRIEVED, gyms);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * @description Get gym by ID
 * @route GET /gyms/:id
 * @access Public
 */
export const getGymById = async (req, res) => {
    try {
        const gym = await Gym.findById(req.params.id);
        if (!gym) {
            return errorResponse(res, 404, ERROR_MESSAGES.GYM_NOT_FOUND);
        }
        return successResponse(res, 200, SUCCESS_MESSAGES.GYM_RETRIEVED, gym);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * @description Create a new gym
 * @route POST /gyms
 * @access Private
 */
export const createGym = async (req, res) => {
    try {
        const gym = new Gym(req.body);
        await gym.save();
        return successResponse(res, 201, SUCCESS_MESSAGES.GYM_CREATED, gym);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * @description Update a gym by ID
 * @route PUT /gyms/:id
 * @access Private
 */
export const updateGym = async (req, res) => {
    try {
        const gym = await Gym.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!gym) {
            return errorResponse(res, 404, ERROR_MESSAGES.GYM_NOT_FOUND);
        }
        return successResponse(res, 200, SUCCESS_MESSAGES.GYM_UPDATED, gym);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * @description Delete a gym by ID
 * @route DELETE /gyms/:id
 * @access Private
 */
export const deleteGym = async (req, res) => {
    try {
        const gym = await Gym.findByIdAndDelete(req.params.id);
        if (!gym) {
            return errorResponse(res, 404, ERROR_MESSAGES.GYM_NOT_FOUND);
        }
        return successResponse(res, 204, SUCCESS_MESSAGES.GYM_DELETED);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * @description Filter gyms based on query parameters
 * @route GET /gyms/filter
 * @access Public
 */
export const filterGyms = async (req, res) => {
    const { distance, sessionType, available } = req.query;
    try {
        const query = {};
        if (distance) query.distance = { $lte: distance };
        if (sessionType) query.sessionType = sessionType;
        if (available !== undefined) query.available = available;

        const gyms = await Gym.find(query);
        return successResponse(res, 200, SUCCESS_MESSAGES.GYMS_FILTERED, gyms);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * @description Search for gyms by keyword
 * @route GET /gyms/search
 * @access Public
 */
export const searchGyms = async (req, res) => {
    const { keyword } = req.query;
    try {
        const query = keyword ? { name: { $regex: keyword, $options: 'i' } } : {};
        const gyms = await Gym.find(query);
        return successResponse(res, 200, SUCCESS_MESSAGES.GYMS_SEARCHED, gyms);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.INVALID_INPUT, error);
    }
};