export const successResponse = (res, statusCode, message, data) => {
    return res.status(statusCode || 200).json({
        success: true,
        message,
        data,
    });
};

export const createdResponse = (res, data, message = 'Resource created successfully') => {
    return res.status(201).json({
        success: true,
        data,
        message,
    });
};

export const errorResponse = (res, statusCode, message, error) => {
    return res.status(statusCode || 500).json({
        success: false,
        message,
        error: error ? error.message : 'An internal server error occurred',
    });
};

export const notFoundResponse = (res, message = 'Resource not found') => {
    return res.status(404).json({
        success: false,
        message,
    });
};

export const validationErrorResponse = (res, errors) => {
    return res.status(400).json({
        success: false,
        errors,
        message: 'Validation error',
    });
};