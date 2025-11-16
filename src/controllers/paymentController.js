import * as PaymentService from '../services/paymentService.js';
import { successResponse, errorResponse } from '../utils/responses.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../config/constants.js';

/**
 * Process payment for a subscription.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
export const processPayment = async (req, res) => {
    try {
        const paymentData = req.body;
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

/**
 * Get payment history for a user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
export const getPaymentHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const paymentHistoryResult = await PaymentService.getPaymentHistory(userId);
        
        return successResponse(res, 200, SUCCESS_MESSAGES.PAYMENT_HISTORY_RETRIEVED, paymentHistoryResult.data);
    } catch (error) {
        return errorResponse(res, 500, error.message || ERROR_MESSAGES.INVALID_INPUT, error);
    }
};