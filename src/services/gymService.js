import Gym from '../models/gym.js';
import { ERROR_MESSAGES } from '../config/constants.js';

/**
 * Service to handle business logic related to gyms.
 */
class GymService {
    /**
     * Get all partner gyms.
     * @returns {Promise<Array>} List of gyms.
     */
    async getAllGyms() {
        try {
            const gyms = await Gym.find();
            return gyms;
        } catch (error) {
            throw new Error(ERROR_MESSAGES.INVALID_INPUT);
        }
    }

    /**
     * Get a gym by ID.
     * @param {string} gymId - The ID of the gym to retrieve.
     * @returns {Promise<Object>} The gym object.
     */
    async getGymById(gymId) {
        try {
            const gym = await Gym.findById(gymId);
            if (!gym) {
                throw new Error(ERROR_MESSAGES.GYM_NOT_FOUND);
            }
            return gym;
        } catch (error) {
            throw new Error(ERROR_MESSAGES.INVALID_INPUT);
        }
    }

    /**
     * Create a new gym.
     * @param {Object} gymData - The data for the new gym.
     * @returns {Promise<Object>} The created gym object.
     */
    async createGym(gymData) {
        try {
            const gym = new Gym(gymData);
            await gym.save();
            return gym;
        } catch (error) {
            throw new Error(ERROR_MESSAGES.INVALID_INPUT);
        }
    }

    /**
     * Update a gym by ID.
     * @param {string} gymId - The ID of the gym to update.
     * @param {Object} gymData - The updated data for the gym.
     * @returns {Promise<Object>} The updated gym object.
     */
    async updateGym(gymId, gymData) {
        try {
            const gym = await Gym.findByIdAndUpdate(gymId, gymData, { new: true });
            if (!gym) {
                throw new Error(ERROR_MESSAGES.GYM_NOT_FOUND);
            }
            return gym;
        } catch (error) {
            throw new Error(ERROR_MESSAGES.INVALID_INPUT);
        }
    }

    /**
     * Delete a gym by ID.
     * @param {string} gymId - The ID of the gym to delete.
     * @returns {Promise<void>}
     */
    async deleteGym(gymId) {
        try {
            const result = await Gym.findByIdAndDelete(gymId);
            if (!result) {
                throw new Error(ERROR_MESSAGES.GYM_NOT_FOUND);
            }
        } catch (error) {
            throw new Error(ERROR_MESSAGES.INVALID_INPUT);
        }
    }
}

export default new GymService();