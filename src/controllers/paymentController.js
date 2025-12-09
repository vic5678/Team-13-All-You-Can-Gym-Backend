import * as PaymentService from '../services/paymentService.js';
import * as subscriptionService from '../services/subscriptionService.js';
import { successResponse, errorResponse } from '../utils/responses.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../config/constants.js';

/**
 * Process payment for a subscription.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
export const processPayment = async (req, res) => {
    try {
        const { packageId } = req.params;
        const { cardNumber, expiryDate, cvv } = req.body;

        // Validate that packageId is provided
        if (!packageId) {
            return errorResponse(res, 400, 'Package ID is required', null);
        }

        // Find the subscription package by the string id field (not MongoDB _id)
        const subscriptionPackage = await subscriptionService.getSubscriptionPackageById(packageId);
        
        if (!subscriptionPackage || subscriptionPackage.status === 'error') {
            return errorResponse(
                res, 
                subscriptionPackage?.statusCode || 404, 
                subscriptionPackage?.message || 'Subscription package not found', 
                null
            );
        }

        // Build payment data with server-side values
        const paymentData = {
            cardNumber,
            expiryDate,
            cvv,
            amount: subscriptionPackage.price,  // Automatically set from package
            packageId: subscriptionPackage._id,  // Use MongoDB ObjectId for database operations
            userId: req.user.id,  // Get from authenticated user
        };

        const paymentResult = await PaymentService.processPayment(paymentData);
        
        if (paymentResult.success) {
            return successResponse(res, 200, SUCCESS_MESSAGES.PAYMENT_PROCESSED, paymentResult.data);
        } else {
            return errorResponse(res, 400, ERROR_MESSAGES.PAYMENT_FAILED, paymentResult.error);
        }
    } catch (error) {
        return errorResponse(res, 500, error.message || ERROR_MESSAGES.INVALID_INPUT, error);
    }
};