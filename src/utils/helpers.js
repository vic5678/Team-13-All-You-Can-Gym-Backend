export const formatResponse = (success, data = null, error = null, message = '') => {
    return {
        success,
        data,
        error,
        message,
    };
};

export const generateMockData = () => {
    return {
        users: [
            { id: 1, username: 'john_doe', email: 'john@example.com' },
            { id: 2, username: 'jane_doe', email: 'jane@example.com' },
        ],
        gyms: [
            { id: 1, name: 'Fitness Center', location: '123 Main St', rating: 4.5 },
            { id: 2, name: 'Health Club', location: '456 Elm St', rating: 4.0 },
        ],
        sessions: [
            { id: 1, name: 'Yoga Class', dateTime: '2025-11-20T10:00:00Z', capacity: 20 },
            { id: 2, name: 'Spin Class', dateTime: '2025-11-21T11:00:00Z', capacity: 15 },
        ],
    };
};