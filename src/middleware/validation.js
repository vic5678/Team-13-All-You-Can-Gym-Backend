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