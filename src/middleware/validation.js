import { body, param, validationResult } from 'express-validator';

/**
 * Validate the creation of a new session.
 */
export const validateCreateSession = [
    body('name').notEmpty().withMessage('Session name is required.'),
    body('dateTime').isISO8601().withMessage('Valid date and time is required.'),
    body('description').optional().isString().withMessage('Description must be a string.'),
    body('type').notEmpty().withMessage('Session type is required.'),
    body('capacity').isInt({ gt: 0 }).withMessage('Capacity must be a positive integer.'),
    body('trainerName').notEmpty().withMessage('Trainer name is required.'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    }
];

/**
 * Validate the user registration.
 */
export const validateUserRegistration = [
    body('username').notEmpty().withMessage('Username is required.'),
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        next();
    }
];
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

