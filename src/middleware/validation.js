import { body, param, validationResult } from 'express-validator';

/**
 * Validate incoming request data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array(),
        });
    }
    next();
};

/**
 * Validate announcement creation and update
 * Checks for required fields: content and sessionId
 */
export const validateCreateAnnouncement = [
    body('content')
        .trim()
        .notEmpty().withMessage('Content is required')
        .isString().withMessage('Content must be a string')
        .isLength({ min: 1 }).withMessage('Content cannot be empty'),
    body('sessionId')
        .notEmpty().withMessage('Session ID is required')
        .isMongoId().withMessage('Session ID must be a valid MongoDB ID'),
    validateRequest,
];

