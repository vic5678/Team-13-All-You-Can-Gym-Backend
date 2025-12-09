import Payment from '../models/payment.js';
import * as SubscriptionService from './subscriptionService.js';

const parseExpiry = (expiry) => {
    // Accept formats: MM/YY, MM/YYYY, YYYY-MM, or ISO
    if (!expiry || typeof expiry !== 'string') return null;
    expiry = expiry.trim();
    // MM/YY or MM/YYYY
    const mmYY = expiry.match(/^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/);
    if (mmYY) {
        const month = parseInt(mmYY[1], 10);
        let year = parseInt(mmYY[2], 10);
        if (year < 100) year += 2000;
        // set date to last millisecond of month
        const d = new Date(year, month, 0, 23, 59, 59, 999);
        return d;
    }
    // YYYY-MM or ISO
    const iso = new Date(expiry);
    if (!isNaN(iso.getTime())) return iso;
    return null;
};

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
        // Validate required fields
        const { cardNumber, expiryDate, cvv, amount, userId, packageId } = paymentData || {};
        if (!userId) return { success: false, error: 'userId is required' };
        if (!packageId) return { success: false, error: 'packageId is required' };
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return { success: false, error: 'Invalid amount' };

        // card number: digits only, 16 digits
        const cardClean = String(cardNumber || '').replace(/\s+/g, '');
        if (!/^\d{16}$/.test(cardClean)) return { success: false, error: 'cardNumber must be a 16 digit number' };

        // cvv: 3 or 4 digits
        if (!/^[0-9]{3,4}$/.test(String(cvv || ''))) return { success: false, error: 'Invalid cvv' };

        // expiry date valid and not past
        const exp = parseExpiry(String(expiryDate || ''));
        if (!exp) return { success: false, error: 'Invalid expiry date format' };
        const now = new Date();
        if (exp < now) return { success: false, error: 'Card expiry date is in the past' };

        // Mock payment processing (replace with real gateway integration)
        const paymentResult = {
            transactionId: 'txn_' + Date.now(),
            status: 'success',
        };

        // Save payment record
        const payment = new Payment({
            transactionId: paymentResult.transactionId,
            status: paymentResult.status,
            amount: Number(amount),
            userId,
        });
        await payment.save();

        // Assign subscription package to user by calling subscription service
        // Use today's date as startDate
        try {
            console.log('[paymentService] Creating subscription for userId:', userId, 'packageId:', packageId);
            const subRes = await SubscriptionService.createSubscription(userId, packageId, new Date());
            console.log('[paymentService] Subscription result:', subRes);
            if (subRes && subRes.status === 'success') {
                return {
                    success: true,
                    data: { 
                        transactionId: payment.transactionId,
                        status: payment.status,
                        amount: payment.amount,
                        subscription: subRes.data 
                    },
                };
            } else {
                // Subscription creation failed; still return payment success but include error
                console.log('[paymentService] Subscription creation failed:', subRes);
                return {
                    success: true,
                    data: { 
                        transactionId: payment.transactionId,
                        status: payment.status,
                        amount: payment.amount
                    },
                    warning: 'Payment processed but subscription assignment failed',
                    subscriptionError: subRes,
                };
            }
        } catch (err) {
            console.error('[paymentService] Subscription creation threw error:', err);
            return {
                success: true,
                data: { 
                    transactionId: payment.transactionId,
                    status: payment.status,
                    amount: payment.amount
                },
                warning: 'Payment processed but subscription assignment threw an error',
                subscriptionError: err.message || String(err),
            };
        }
    } catch (error) {
        throw new Error('Payment processing failed: ' + error.message);
    }
};