import Subscription from '../models/subscription.js';
import User from '../models/user.js';
import SubscriptionPackage from '../models/subscriptionPackage.js';
import { successResponse, errorResponse } from '../utils/responses.js';

/**
 * Get all subscription packages.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
export const getAllSubscriptionPackages = async (req, res) => {
    try {
        const packages = await SubscriptionPackage.find();
        return successResponse(res, 200, 'All subscription packages retrieved successfully', packages);
    } catch (error) {
        return errorResponse(res, 500, 'Failed to retrieve subscription packages', error);
    }
};

/**
 * Get a subscription package by its string ID.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
export const getSubscriptionPackageById = async (req, res) => {
    try {
        const { id } = req.params;
        const pkg = await SubscriptionPackage.findOne({ id: id });

        if (!pkg) {
            return errorResponse(res, 404, 'Subscription package not found');
        }

        return successResponse(res, 200, 'Subscription package retrieved successfully', pkg);
    } catch (error) {
        return errorResponse(res, 500, 'Failed to retrieve subscription package', error);
    }
};

/**
 * Get all subscriptions for a user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
export const getUserSubscriptions = async (req, res) => {
    try {
        const { userId } = req.params;
        const subscriptions = await Subscription.find({ userId });

        return successResponse(res, 200, 'User subscriptions retrieved successfully', subscriptions);
    } catch (error) {
        return errorResponse(res, 500, 'Failed to retrieve subscriptions', error);
    }
};

/**
 * Create a new subscription for a user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
export const createSubscription = async (req, res) => {
    try {
        const { userId, subscriptionPackageId, startDate } = req.body;

        const subscriptionPackage = await SubscriptionPackage.findById(subscriptionPackageId);
        if (!subscriptionPackage) {
            return errorResponse(res, 404, 'Subscription package not found');
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

        return successResponse(res, 201, 'Subscription created successfully', newSubscription);
    } catch (error) {
        return errorResponse(res, 500, 'Failed to create subscription', error);
    }
};

/**
 * Update a user's subscription.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
export const updateSubscription = async (req, res) => {
    try {
        const { userId, subscriptionId } = req.params;
        const updatedData = req.body;

        const updatedSubscription = await Subscription.findOneAndUpdate(
            { _id: subscriptionId, userId },
            updatedData,
            { new: true }
        );

        if (!updatedSubscription) {
            return errorResponse(res, 404, 'Subscription not found');
        }

        return successResponse(res, 200, 'Subscription updated successfully', updatedSubscription);
    } catch (error) {
        return errorResponse(res, 500, 'Failed to update subscription', error);
    }
};

/**
 * Delete a user's subscription.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
export const cancelSubscription = async (req, res) => {
    try {
        const { userId, subscriptionId } = req.params;

        const canceledSubscription = await Subscription.findOneAndUpdate(
            { _id: subscriptionId, userId },
            { isActive: false },
            { new: true }
        );

        if (!canceledSubscription) {
            return errorResponse(res, 404, 'Subscription not found');
        }

        // Also update the user's main subscription status
        await User.findByIdAndUpdate(userId, { isSubscribed: false, packageID: null });

        return successResponse(res, 200, 'Subscription canceled successfully', canceledSubscription);
    } catch (error) {
        return errorResponse(res, 500, 'Failed to cancel subscription', error);
    }
};