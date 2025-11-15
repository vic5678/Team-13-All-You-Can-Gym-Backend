import gymService from '../services/gymService.js';
import gymAdminService from '../services/gymAdminService.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import { successResponse, errorResponse } from '../utils/responses.js';

/**
 * @description Get all partner gyms
 * @route GET /gyms
 * @access Public
 */
export const getAllGyms = async (req, res) => {
    try {
        const gyms = await gymService.getAllGyms();
        return successResponse(res, 200, SUCCESS_MESSAGES.GYMS_RETRIEVED, gyms);
    } catch (error) {
        return errorResponse(res, 500, error.message || ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * @description Get gym by ID
 * @route GET /gyms/:id
 * @access Public
 */
export const getGymById = async (req, res) => {
    try {
        const gym = await gymService.getGymById(req.params.id);
        if (!gym) {
            return errorResponse(res, 404, ERROR_MESSAGES.GYM_NOT_FOUND);
        }
        return successResponse(res, 200, SUCCESS_MESSAGES.GYM_RETRIEVED, gym);
    } catch (error) {
        return errorResponse(res, 500, error.message || ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * @description Create a new gym
 * @route POST /gyms
 * @access Private
 */
export const createGym = async (req, res) => {
    try {
        const gym = await gymService.createGym(req.body);
        // If the request is made by an authenticated gymAdmin, attach the gym to their account
        try {
            if (req.user?.id) {
                await gymAdminService.addGymToAdmin(req.user.id, gym._id);
            }
        } catch (err) {
            // ignore admin linking errors
        }
        return successResponse(res, 201, SUCCESS_MESSAGES.GYM_CREATED, gym);
    } catch (error) {
        return errorResponse(res, 500, error.message || ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * @description Update a gym by ID
 * @route PUT /gyms/:id
 * @access Private
 */
export const updateGym = async (req, res) => {
    try {
        const gym = await gymService.updateGym(req.params.id, req.body);
        if (!gym) {
            return errorResponse(res, 404, ERROR_MESSAGES.GYM_NOT_FOUND);
        }
        return successResponse(res, 200, SUCCESS_MESSAGES.GYM_UPDATED, gym);
    } catch (error) {
        return errorResponse(res, 500, error.message || ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * @description Delete a gym by ID
 * @route DELETE /gyms/:id
 * @access Private
 */
export const deleteGym = async (req, res) => {
    try {
        const gym = await gymService.deleteGym(req.params.id);
        if (!gym) {
            return errorResponse(res, 404, ERROR_MESSAGES.GYM_NOT_FOUND);
        }
        return successResponse(res, 204, SUCCESS_MESSAGES.GYM_DELETED);
    } catch (error) {
        return errorResponse(res, 500, error.message || ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * @description Filter gyms based on query parameters
 * @route GET /gyms/filter
 * @access Public
 */
export const filterGyms = async (req, res) => {
    const { distance, latitude, longitude, sessionType } = req.query;
    try {
        const filteredGyms = await gymService.filterGyms({ distance, latitude, longitude, sessionType });
        return successResponse(res, 200, SUCCESS_MESSAGES.GYMS_FILTERED, filteredGyms);
    } catch (error) {
        return errorResponse(res, 500, error.message || ERROR_MESSAGES.INVALID_INPUT, error);
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
        const gyms = await gymService.searchGyms(keyword);
        return successResponse(res, 200, SUCCESS_MESSAGES.GYMS_SEARCHED, gyms);
    } catch (error) {
        return errorResponse(res, 500, error.message || ERROR_MESSAGES.INVALID_INPUT, error);
    }
};