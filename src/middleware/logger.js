import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' })
    ],
});

// Middleware to log requests and responses
export const logRequests = (req, _res, next) => {
    logger.info({
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        query: req.query,
        params: req.params,
    });
    next();
};

// Middleware to log errors
export const logErrors = (err, _req, _res, next) => {
    logger.error({
        message: err.message,
        stack: err.stack,
    });
    next(err);
};