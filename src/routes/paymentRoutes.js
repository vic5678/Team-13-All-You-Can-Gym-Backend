import express from 'express';
import { processPayment } from '../controllers/paymentController.js';
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
 * /payment/checkout/{packageId}:
 *   post:
 *     summary: Process a payment for a subscription package
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: packageId
 *         required: true
 *         schema:
 *           type: string
 *         description: The subscription package identifier (e.g., basic_monthly, premium_monthly)
 *         example: "basic_monthly"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cardNumber
 *               - expiryDate
 *               - cvv
 *             properties:
 *               cardNumber:
 *                 type: string
 *                 description: 16-digit card number
 *                 example: "4111111111111111"
 *               expiryDate:
 *                 type: string
 *                 description: Card expiry date (MM/YY, MM/YYYY, or YYYY-MM)
 *                 example: "12/25"
 *               cvv:
 *                 type: string
 *                 description: 3 or 4 digit CVV
 *                 example: "123"
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *       400:
 *         description: Bad request - Invalid payment details or package not found
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Subscription package not found
 *       500:
 *         description: Internal server error
 */
router.post('/checkout/:packageId', authenticate, processPayment);

export default router;