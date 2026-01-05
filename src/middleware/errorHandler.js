/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 */

/**
 * Centralized error handling middleware.
 * @param {Error} err - The error object.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
export const errorHandler = (err, _req, res) => {
    console.error(err.stack);

    const statusCode = err.status || 500;
    const response = {
        success: false,
        data: null,
        error: {
            message: err.message || 'Internal Server Error',
            code: statusCode,
        },
    };

    res.status(statusCode).json(response);
};

export default errorHandler;