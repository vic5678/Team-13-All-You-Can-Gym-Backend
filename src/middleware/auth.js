import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { ERROR_MESSAGES } from '../config/constants.js';

/**
 * Middleware to authenticate users using JWT.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
export const authenticate = async (req, res, next) => {
    // next();
    // return;
    
    try {
        // Get token from headers
        const token = req.headers.authorization?.split(' ')[1];

        // Check if token is provided
        if (!token) {
            return res.status(401).json({
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
            });
        }

        // Verify token
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user info to request object
        next(); // Proceed to the next middleware or route handler
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: ERROR_MESSAGES.INVALID_TOKEN,
        });
    }
};

/**
 * Middleware to authorize if the user is accessing their own resource.
 * It checks if the authenticated user's ID matches the 'userId' parameter in the route.
 * This should be used after the `authenticate` middleware.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
export const authorizeSelf = (req, res, next) => {
    if (req.user?.id !== req.params.userId) {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: You do not have permission to perform this action on another user\'s resource.',
        });
    }
    next();
};