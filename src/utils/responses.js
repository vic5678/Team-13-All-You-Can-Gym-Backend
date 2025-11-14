export const successResponse = (res, data, message = 'Operation successful') => {
    return res.status(200).json({
        success: true,
        data,
        message,
    });
};

export const createdResponse = (res, data, message = 'Resource created successfully') => {
    return res.status(201).json({
        success: true,
        data,
        message,
    });
};

export const errorResponse = (res, error, message = 'An error occurred') => {
    return res.status(error.status || 500).json({
        success: false,
        error,
        message,
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