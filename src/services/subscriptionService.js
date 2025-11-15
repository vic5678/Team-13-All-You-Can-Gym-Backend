import Subscription from '../models/subscription.js';
import User from '../models/user.js';
import SubscriptionPackage from '../models/subscriptionPackage.js';
import { successResponse, errorResponse } from '../utils/responses.js';

/**
 * Get all subscription packages.
 * @returns {Promise<Object>} - List of subscription packages.
 */
export const getAllSubscriptionPackages = async () => {
    try {
        const packages = await SubscriptionPackage.find();
        return successResponse(packages, 'All subscription packages retrieved successfully');
    } catch (error) {
        return errorResponse(error.message, 'Failed to retrieve subscription packages');
    }
};

/**
 * Get a subscription package by its ID.
 * @param {string} packageId - The ID of the subscription package.
 * @returns {Promise<Object>} - The subscription package.
 */
export const getSubscriptionPackageById = async (packageId) => {
    try {
        const pkg = await SubscriptionPackage.findById(packageId);
        if (!pkg) {
            return errorResponse('Subscription package not found', 'Subscription package not found', 404);
        }
        return successResponse(pkg, 'Subscription package retrieved successfully');
    } catch (error) {
        return errorResponse(error.message, 'Failed to retrieve subscription package');
    }
};

/**
 * Create a new subscription for a user.
 * @param {string} userId - The ID of the user.
 * @param {string} subscriptionPackageId - The ID of the subscription package.
 * @param {Date} startDate - The start date of the subscription.
 * @returns {Promise<Object>} - The created subscription.
 */
export const createSubscription = async (userId, subscriptionPackageId, startDate) => {
    try {
        const subscriptionPackage = await SubscriptionPackage.findById(subscriptionPackageId);
        if (!subscriptionPackage) {
            return errorResponse('Subscription package not found', 'Subscription package not found', 404);
        }

        const sDate = new Date(startDate);
        const endDate = new Date(sDate.setDate(sDate.getDate() + subscriptionPackage.durationDays));

        const newSubscription = new Subscription({
            userId,
            packageId: subscriptionPackageId,
            startDate: new Date(startDate),
            endDate,
            isActive: true,
        });

        await newSubscription.save();
        await User.findByIdAndUpdate(userId, { isSubscribed: true, packageID: subscriptionPackage.id });

        return successResponse(newSubscription, 'Subscription created successfully.');
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
 * @param {string} userId - The ID of the user.
 * @param {string} subscriptionId - The ID of the subscription.
 * @param {Object} updateData - The data to update.
 * @returns {Promise<Object>} - The updated subscription.
 */
export const updateSubscription = async (userId, subscriptionId, updateData) => {
    try {
        const updatedSubscription = await Subscription.findOneAndUpdate(
            { _id: subscriptionId, userId },
            updateData,
            { new: true }
        );
        if (!updatedSubscription) {
            return errorResponse('Subscription not found', 'Subscription not found', 404);
        }
        return successResponse(updatedSubscription, 'Subscription updated successfully.');
    } catch (error) {
        return errorResponse(error.message, 'Failed to update subscription.');
    }
};

/**
 * Cancel a user's subscription.
 * @param {string} userId - The ID of the user.
 * @param {string} subscriptionId - The ID of the subscription.
 * @returns {Promise<Object>} - The canceled subscription.
 */
export const cancelSubscription = async (userId, subscriptionId) => {
    try {
        const canceledSubscription = await Subscription.findOneAndUpdate(
            { _id: subscriptionId, userId },
            { isActive: false },
            { new: true }
        );

        if (!canceledSubscription) {
            return errorResponse('Subscription not found', 'Subscription not found', 404);
        }

        await User.findByIdAndUpdate(userId, { isSubscribed: false, packageID: null });

        return successResponse(canceledSubscription, 'Subscription canceled successfully.');
    } catch (error) {
        return errorResponse(error.message, 'Failed to cancel subscription.');
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