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


export default router;