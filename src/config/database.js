import mongoose from 'mongoose';
import { MONGO_URI } from '../config/constants.js';

// Mock data for fallback
const mockData = {
    users: [
        { username: 'user1', email: 'user1@example.com' },
        { username: 'user2', email: 'user2@example.com' }
    ],
    gyms: [
        { name: 'Gym A', location: 'Location A' },
        { name: 'Gym B', location: 'Location B' }
    ],
    sessions: [
        { name: 'Yoga Class', dateTime: '2025-11-20T10:00:00Z', capacity: 20 },
        { name: 'HIIT Class', dateTime: '2025-11-21T11:00:00Z', capacity: 15 }
    ]
};

const connectDB = async () => {
    try {
        if (!MONGO_URI) {
            console.warn('Mongo URI not provided, using mock data.');
            // Here you can implement logic to use mock data if needed
            return;
        }
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully.');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

export default connectDB;