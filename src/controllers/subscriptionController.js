import * as subscriptionService from '../services/subscriptionService.js';
import { successResponse, errorResponse, createdResponse } from '../utils/responses.js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../config/constants.js';

/**
 * Get all subscription packages.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
export const getAllSubscriptionPackages = async (req, res) => {
    try {
        const result = await subscriptionService.getAllSubscriptionPackages();
        if (result.status === 'error') {
            return errorResponse(res, result.statusCode, result.message, result.data);
        }
        return successResponse(res, 200, SUCCESS_MESSAGES.SUBSCRIPTION_PACKAGES_RETRIEVED, result.data);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.SUBSCRIPTION_PACKAGES_NOT_FOUND, error.message);
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
        const result = await subscriptionService.getSubscriptionPackageById(id);

        if (result.status === 'error') {
            return errorResponse(res, result.statusCode, result.message);
        }

        return successResponse(res, 200, SUCCESS_MESSAGES.SUBSCRIPTION_PACKAGE_RETRIEVED, result);
    } catch (error) {
        return errorResponse(res, 500, ERROR_MESSAGES.SUBSCRIPTION_PACKAGE_NOT_FOUND, error.message);
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
        const result = await subscriptionService.getUserSubscriptions(userId);

        if (result.status === 'error') {
            return errorResponse(res, result.statusCode, result.message, result.data);
        }
        return successResponse(res, 200, SUCCESS_MESSAGES.SUBSCRIPTION_RETRIEVED, result.data);
    } catch (error) {
        return errorResponse(res, 500, 'Failed to retrieve subscriptions', error.message);
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
        const result = await subscriptionService.createSubscription(userId, subscriptionPackageId, startDate);

        if (result.status === 'error') {
            return errorResponse(res, result.statusCode, result.message, result.data);
        }

        return createdResponse(res, result.data, result.message);
    } catch (error) {
        return errorResponse(res, 500, 'Failed to create subscription', error.message);
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

        const result = await subscriptionService.updateSubscription(userId, subscriptionId, updatedData);

        if (result.status === 'error') {
            return errorResponse(res, result.statusCode, result.message);
        }

        return successResponse(res, 200, result.message, result.data);
    } catch (error) {
        return errorResponse(res, 500, 'Failed to update subscription', error.message);
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
        const result = await subscriptionService.cancelSubscription(userId, subscriptionId);

        if (result.status === 'error') {
            return errorResponse(res, result.statusCode, result.message);
        }

        return successResponse(res, 200, result.message, result.data);
    } catch (error) {
        return errorResponse(res, 500, 'Failed to cancel subscription', error.message);
    }
};