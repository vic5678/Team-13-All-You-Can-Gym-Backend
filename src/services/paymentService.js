import Payment from '../models/payment.js';

/**
 * Processes a payment for a subscription.
 * @param {Object} paymentData - The payment data.
 * @param {string} paymentData.cardNumber - The card number.
 * @param {string} paymentData.expiryDate - The card expiry date.
 * @param {string} paymentData.cvv - The card CVV.
 * @param {number} paymentData.amount - The amount to be charged.
 * @returns {Promise<Object>} - The result of the payment processing.
 */
export const processPayment = async (paymentData) => {
    try {
        // Mock payment processing logic
        const paymentResult = {
            transactionId: 'txn_123456',
            status: 'success',
        };

        // Save payment to the database
        const payment = new Payment({
            transactionId: paymentResult.transactionId,
            status: paymentResult.status,
            amount: paymentData.amount,
            userId: paymentData.userId,
        });
        await payment.save();

        return {
            success: true,
            data: paymentResult,
            error: null,
        };
    } catch (error) {
        throw new Error('Payment processing failed: ' + error.message);
    }
};

/**
 * Retrieves payment history for a user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Object>} - The user's payment history.
 */
export const getPaymentHistory = async (userId) => {
    try {
        const paymentHistory = await Payment.find({ userId });

        return {
            success: true,
            data: paymentHistory,
            error: null,
        };
    } catch (error) {
        throw new Error('Failed to retrieve payment history: ' + error.message);
    }
};