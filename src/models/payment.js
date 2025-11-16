import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       required:
 *         - transactionId
 *         - status
 *         - amount
 *         - userId
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the payment.
 *         transactionId:
 *           type: string
 *           description: The ID from the payment processor.
 *         status:
 *           type: string
 *           description: The status of the payment (e.g., success, failed).
 *           enum: [success, failed, pending]
 *         amount:
 *           type: number
 *           description: The payment amount.
 *         userId:
 *           type: Schema.Types.ObjectId
 *           ref: 'User'
 *           description: The ID of the user who made the payment.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the payment was created.
 *       example:
 *         id: 60d0fe4f5311236168a109ca
 *         transactionId: txn_123456789
 *         status: success
 *         amount: 29.99
 *         userId: 60d0fe4f5311236168a109cb
 *         createdAt: 2025-11-13T10:00:00.000Z
 */
const paymentSchema = new Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['success', 'failed', 'pending'],
    },
    amount: {
        type: Number,
        required: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});

const Payment = model('Payment', paymentSchema);

export default Payment;