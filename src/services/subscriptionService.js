import Subscription from '../models/subscription.js';
import User from '../models/user.js';
import SubscriptionPackage from '../models/subscriptionPackage.js';

/**
 * Get all subscription packages.
 * @returns {Promise<Object>} - List of subscription packages.
 */
export const getAllSubscriptionPackages = async () => {
    try {
        const packages = await SubscriptionPackage.find();
        return { status: 'success', data: packages, message: 'All subscription packages retrieved successfully' };
    } catch (error) {
        return { status: 'error', message: 'Failed to retrieve subscription packages', data: error.message, statusCode: 500 };
    }
};

/**
 * Get a subscription package by its ID.
 * @param {string} packageId - The ID of the subscription package (string id field like 'basic_monthly', not MongoDB _id).
 * @returns {Promise<Object>} - The subscription package.
 */
export const getSubscriptionPackageById = async (packageId) => {
    try {
        const pkg = await SubscriptionPackage.findById(packageId);
        if (!pkg) {
            return { status: 'error', message: 'Subscription package not found', statusCode: 404 };
        }
        return pkg;
    } catch (error) {
        return { status: 'error', message: 'Failed to retrieve subscription package', data: error.message, statusCode: 500 };
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
            return { status: 'error', message: 'Subscription package not found', statusCode: 404 };
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

        return { status: 'success', data: newSubscription, message: 'Subscription created successfully.', statusCode: 201 };
    } catch (error) {
        return { status: 'error', message: 'Failed to create subscription.', data: error.message, statusCode: 500 };
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
        return { status: 'success', data: subscriptions, message: 'Subscriptions retrieved successfully.' };
    } catch (error) {
        return { status: 'error', message: 'Failed to retrieve subscriptions.', data: error.message, statusCode: 500 };
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
            return { status: 'error', message: 'Subscription not found', statusCode: 404 };
        }
        return { status: 'success', data: updatedSubscription, message: 'Subscription updated successfully.' };
    } catch (error) {
        return { status: 'error', message: 'Failed to update subscription.', data: error.message, statusCode: 500 };
    }
};

/**
 * Deletes a user's subscription.
 * @param {string} userId - The ID of the user.
 * @param {string} subscriptionId - The ID of the subscription.
 * @returns {Promise<Object>} - The deleted subscription.
 */
export const cancelSubscription = async (userId, subscriptionId) => {
    try {
        const deletedSubscription = await Subscription.findOneAndDelete(
            { _id: subscriptionId, userId }
        );

        if (!deletedSubscription) {
            return { status: 'error', message: 'Subscription not found or user does not have permission to delete it.', statusCode: 404 };
        }

        // Find if the user has any other active subscriptions before setting isSubscribed to false
        const otherSubscriptions = await Subscription.findOne({ userId, isActive: true });
        if (!otherSubscriptions) {
            await User.findByIdAndUpdate(userId, { isSubscribed: false, packageID: null });
        }


        return { status: 'success', data: deletedSubscription, message: 'Subscription deleted successfully.' };
    } catch (error) {
        return { status: 'error', message: 'Failed to delete subscription.', data: error.message, statusCode: 500 };
    }
};