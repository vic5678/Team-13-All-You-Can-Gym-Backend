import Subscription from '../models/subscription.js';
import User from '../models/user.js';
import { successResponse, errorResponse } from '../utils/responses.js';

/**
 * Create a new subscription for a user.
 * @param {string} userId - The ID of the user.
 * @param {Object} subscriptionData - The subscription data.
 * @returns {Promise<Object>} - The created subscription.
 */
export const createSubscription = async (userId, subscriptionData) => {
    try {
        const subscription = new Subscription({
            userId,
            ...subscriptionData,
        });
        await subscription.save();
        return successResponse(subscription, 'Subscription created successfully.');
    } catch (error) {
        return errorResponse(error.message, 'Failed to create subscription.');
    }
};

/**
 * Get all subscriptions for a user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array>} - List of subscriptions.
 */
export const getUserSubscriptions = async (userId) => {
    try {
        const subscriptions = await Subscription.find({ userId });
        return successResponse(subscriptions, 'Subscriptions retrieved successfully.');
    } catch (error) {
        return errorResponse(error.message, 'Failed to retrieve subscriptions.');
    }
};

/**
 * Update a user's subscription.
 * @param {string} subscriptionId - The ID of the subscription.
 * @param {Object} updateData - The data to update.
 * @returns {Promise<Object>} - The updated subscription.
 */
export const updateSubscription = async (subscriptionId, updateData) => {
    try {
        const updatedSubscription = await Subscription.findByIdAndUpdate(subscriptionId, updateData, { new: true });
        return successResponse(updatedSubscription, 'Subscription updated successfully.');
    } catch (error) {
        return errorResponse(error.message, 'Failed to update subscription.');
    }
};

/**
 * Delete a user's subscription.
 * @param {string} subscriptionId - The ID of the subscription.
 * @returns {Promise<Object>} - Confirmation of deletion.
 */
export const deleteSubscription = async (subscriptionId) => {
    try {
        await Subscription.findByIdAndDelete(subscriptionId);
        return successResponse(null, 'Subscription deleted successfully.');
    } catch (error) {
        return errorResponse(error.message, 'Failed to delete subscription.');
    }
};