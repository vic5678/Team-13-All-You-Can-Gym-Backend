import Gym from '../models/gym.js';
import Session from '../models/session.js';
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
        const gym = await Gym.findById(gymId);
        return gym; // Return null if not found, let controller handle it
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
        const gym = await Gym.findByIdAndUpdate(gymId, gymData, { new: true });
        if (!gym) {
            throw new Error(ERROR_MESSAGES.GYM_NOT_FOUND);
        }
        return gym;
    }

    /**
     * Delete a gym by ID.
     * @param {string} gymId - The ID of the gym to delete.
     * @returns {Promise<Object>} The deleted gym object.
     */
    async deleteGym(gymId) {
        const result = await Gym.findByIdAndDelete(gymId);
        if (!result) {
            throw new Error(ERROR_MESSAGES.GYM_NOT_FOUND);
        }
        return result;
    }

    /**
     * Filter gyms based on sessionType and distance from user location.
     * @param {Object} filterParams - Filter parameters
     * @param {string} filterParams.sessionType - Filter by session type
     * @param {number} filterParams.latitude - User latitude
     * @param {number} filterParams.longitude - User longitude
     * @param {number} filterParams.distance - Max distance in km
     * @returns {Promise<Array>} Filtered list of gyms.
     */
    async filterGyms({ sessionType, latitude, longitude, distance }) {
        const query = {};

        // If a sessionType filter is provided, find sessions matching that type
        // and filter gyms that reference those session IDs
        if (sessionType) {
            const sessions = await Session.find({ type: { $regex: sessionType, $options: 'i' } }, { _id: 1 });
            const sessionIds = sessions.map(s => s._id);
            if (sessionIds.length === 0) {
                // No sessions match the requested type — return empty list
                return [];
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
                    const distanceInKm = this.calculateDistance(userLat, userLon, gym.latitude, gym.longitude);
                    console.log(`Gym: ${gym.name}, Distance: ${distanceInKm.toFixed(2)} km`);
                    
                    // If maxDistance is provided, filter by it; otherwise include all
                    if (maxDistance !== null && !isNaN(maxDistance)) {
                        return distanceInKm <= maxDistance;
                    }
                    return true;
                });
            }
        }

        return filteredGyms;
    }

    /**
     * Search gyms by keyword in name or keywords array.
     * @param {string} keyword - The keyword to search for in gym name or keywords array.
     * @returns {Promise<Array>} List of matching gyms.
     */
    async searchGyms(keyword) {
        try {
            // Return all gyms if no keyword or empty keyword
            if (!keyword || keyword.trim() === '') {
                return await Gym.find();
            }
            const query = {
                $or: [
                    { name: { $regex: keyword, $options: 'i' } },
                    { keywords: { $in: [new RegExp(keyword, 'i')] } }
                ]
            };
            return await Gym.find(query);
        } catch (error) {
            throw new Error(ERROR_MESSAGES.INVALID_INPUT);
        }
    }

    /**
     * Calculate distance between two points on Earth using Haversine formula.
     * @param {number} lat1 - User latitude
     * @param {number} lon1 - User longitude
     * @param {number} lat2 - Gym latitude
     * @param {number} lon2 - Gym longitude
     * @returns {number} Distance in kilometers
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}

export default new GymService();