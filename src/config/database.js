import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Session from '../models/session.js';
// import User from '../models/User.js';
// import Gym from '../models/Gym.js';
// import Announcement from '../models/announcement.js';
// import Paymnent from '../models/payment.js';
// import Subscription from '../models/subscription.js';
// import SubscriptionPackage from '../models/subscriptionPackage.js';

// Mock data for fallback
const mockData = {
    // users: [
    //     { username: 'user1', email: 'user1@example.com' },
    //     { username: 'user2', email: 'user2@example.com' }
    // ],
    // gyms: [
    //     { name: 'Gym A', location: 'Location A' },
    //     { name: 'Gym B', location: 'Location B' }
    // ],
    sessions: [
        { name: 'Yoga Class', dateTime: '2025-11-20T10:00:00Z', description: 'A relaxing yoga session for all levels.', type: 'Group', capacity: 20, trainerName: 'Jane Doe' },
        { name: 'HIIT Class', dateTime: '2025-11-21T11:00:00Z', description: 'High-Intensity Interval Training for maximum calorie burn.', type: 'Group', capacity: 15, trainerName: 'John Smith' }
    ]
};

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.warn('Mongo URI not provided, using mock data in-memory server.');
            const mongod = await MongoMemoryServer.create();
            const uri = mongod.getUri();
            await mongoose.connect(uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('In-memory MongoDB connected successfully.');
            // Populate the in-memory DB with mockData
            await Promise.all([
                // User.insertMany(mockData.users),
                // Gym.insertMany(mockData.gyms),
                Session.insertMany(mockData.sessions),
            ]);
            console.log('In-memory database populated with mock data.');
            return;
        }
        await mongoose.connect(process.env.MONGO_URI, {
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