import Gym from '../models/gym.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';
import Session from '../models/session.js';
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
    const { distance, latitude, longitude, sessionType } = req.query;
    try {
        const query = {};

        // If a sessionType filter is provided, find sessions matching that type
        // and filter gyms that reference those session IDs
        if (sessionType) {
            const sessions = await Session.find({ type: { $regex: sessionType, $options: 'i' } }, { _id: 1 });
            const sessionIds = sessions.map(s => s._id);
            if (sessionIds.length === 0) {
                // No sessions match the requested type — return empty list
                return successResponse(res, 200, SUCCESS_MESSAGES.GYMS_FILTERED, []);
            }
            query.sessions = { $in: sessionIds };
        }

        const gyms = await Gym.find(query);

        // Filter gyms by distance if user latitude and longitude provided
        let filteredGyms = gyms;
        if (latitude && longitude) {
            const userLat = parseFloat(latitude);
            const userLon = parseFloat(longitude);
            const maxDistance = distance ? parseFloat(distance) : null;

            if (!isNaN(userLat) && !isNaN(userLon)) {
                filteredGyms = gyms.filter(gym => {
                    const distanceInKm = calculateDistance(userLat, userLon, gym.latitude, gym.longitude);
                    console.log(`Gym: ${gym.name}, Distance: ${distanceInKm.toFixed(2)} km`);
                    
                    // If maxDistance is provided, filter by it; otherwise include all
                    if (maxDistance !== null && !isNaN(maxDistance)) {
                        return distanceInKm <= maxDistance;
                    }
                    return true;
                });
            }
        }

        return successResponse(res, 200, SUCCESS_MESSAGES.GYMS_FILTERED, filteredGyms);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.INVALID_INPUT, error);
    }
};

/**
 * Calculate distance between two points on Earth using Haversine formula.
 * @param {number} lat1 - User latitude
 * @param {number} lon1 - User longitude
 * @param {number} lat2 - Gym latitude
 * @param {number} lon2 - Gym longitude
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * @description Search for gyms by keyword
 * @route GET /gyms/search
 * @access Public
 */
export const searchGyms = async (req, res) => {
    const { keyword, keywords } = req.query;
    try {
        let query = {};
        // Support 'keywords' (comma-separated) to search gyms by their keywords array
        if (keywords) {
            const keywordsArray = keywords.split(',').map(k => k.trim()).filter(Boolean);
            if (keywordsArray.length > 0) {
                // use case-insensitive regex for each provided keyword
                query.keywords = { $in: keywordsArray.map(k => new RegExp(k, 'i')) };
            }
        } else if (keyword) {
            // fallback: search by gym name (existing behavior)
            query = { name: { $regex: keyword, $options: 'i' } };
        }

        const gyms = await Gym.find(query);
        return successResponse(res, 200, SUCCESS_MESSAGES.GYMS_SEARCHED, gyms);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.INVALID_INPUT, error);
    }
};