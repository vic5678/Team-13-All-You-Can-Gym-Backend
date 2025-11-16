import express from 'express';
import { processPayment, getPaymentHistory } from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Payment processing
 */

/**
 * @swagger
 * /payment/checkout:
 *   post:
 *     summary: Process a payment for a subscription
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cardNumber:
 *                 type: string
 *               expiryDate:
 *                 type: string
 *               cvv:
 *                 type: string
 *               amount:
 *                 type: number
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Bad request
 */
router.post('/checkout', authenticate, processPayment);

/**
 * @swagger
 * /users/{userId}/payments:
 *   get:
 *     summary: Retrieve payment history for a user
 *     tags: [Users, Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: A list of payment transactions
 *       404:
 *         description: User not found
 */
router.get('/users/:userId/payments', authenticate, getPaymentHistory);


export default router;