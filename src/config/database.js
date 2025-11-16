import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import Session from '../models/session.js';
import User from '../models/user.js';
import Gym from '../models/gym.js';
import Announcement from '../models/announcement.js';
import GymAdmin from '../models/gymAdmin.js';
import Payment from '../models/payment.js';
import Subscription from '../models/subscription.js';
import SubscriptionPackage from '../models/subscriptionPackage.js';

// Mock data for fallback
const mockData = {
    users: [
        { username: 'user1', email: 'user1@example.com', password: 'password123', isSubscribed: true, packageID: 'premium_monthly' },
        { username: 'user2', email: 'user2@example.com', password: 'password456', isSubscribed: false, packageID: null },
        { username: 'user3', email: 'user3@example.com', password: 'password789', isSubscribed: true, packageID: 'basic_monthly' }
    ],
    gyms: [
        {
            name: 'Power Gym Downtown',
            location: '123 Main St, Metropolis',
            latitude: 40.7128,
            longitude: -74.0060,
            rating: 4.5,
            sessions: [],
            keywords: ['Powerlifting', 'Yoga', 'Strength']
        },
        {
            name: 'FitLife Studio',
            location: '456 Elm St, Smallville',
            latitude: 38.8977,
            longitude: -77.0365,
            rating: 4.2,
            sessions: [],
            keywords: ['HIIT', 'Cardio', 'Yoga']
        }
    ],
    sessions: [
        { name: 'Yoga Class with Jane', dateTime: '2025-11-20T10:00:00Z', description: 'A relaxing yoga session for all levels.', type: 'Yoga', capacity: 20, trainerName: 'Jane Doe' },
        { name: 'HIIT Class with John', dateTime: '2025-11-21T11:00:00Z', description: 'High-Intensity Interval Training for maximum calorie burn.', type: 'HIIT', capacity: 15, trainerName: 'John Smith' }
    ]
    ,
    subscriptionPackages: [
        { id: 'basic_monthly', name: 'Basic Monthly', description: 'Access to the gym and up to 10 sessions per month.', price: 29.99, durationDays: 30, sessionLimit: 10 },
        { id: 'premium_monthly', name: 'Premium Monthly', description: 'Unlimited access to the gym and up to 30 sessions per month.', price: 49.99, durationDays: 30, sessionLimit: 30 },
        { id: 'basic_yearly', name: 'Basic Yearly', description: 'A full year of gym access with up to 120 sessions.', price: 299.99, durationDays: 365, sessionLimit: 120 },
        { id: 'premium_yearly', name: 'Premium Yearly', description: 'The ultimate package with unlimited gym access and up to 365 sessions for the entire year.', price: 499.99, durationDays: 365, sessionLimit: 365 }
    ],
    gymAdmins: [
        { username: 'admin1', email: 'admin1@example.com', password: 'adminpass1' },
        { username: 'admin2', email: 'admin2@example.com', password: 'adminpass2' }
    ],
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
            const salt = await bcrypt.genSalt(10);
            for (let user of mockData.users) {
                user.password = await bcrypt.hash(user.password, salt);
            }
            const [insertedUsers, insertedGyms, insertedPackages] = await Promise.all([
                User.insertMany(mockData.users),
                Gym.insertMany(mockData.gyms),
                SubscriptionPackage.insertMany(mockData.subscriptionPackages),
            ]);
            // Create gym admins and associate each with a gym
            const gymAdminData = mockData.gymAdmins.map((g, idx) => ({
                username: g.username,
                email: g.email,
                password: g.password,
                gyms: [insertedGyms[idx % insertedGyms.length]._id]
            }));
            // Hash admin passwords
            for (let admin of gymAdminData) {
                admin.password = await bcrypt.hash(admin.password, salt);
            }
            const insertedGymAdmins = await GymAdmin.insertMany(gymAdminData);
            // Insert sessions now, associate each session with a gym
            const sessionsToInsert = mockData.sessions.map((s, idx) => ({
                ...s,
                gymId: insertedGyms[idx % insertedGyms.length]._id,
            }));
            const insertedSessions = await Session.insertMany(sessionsToInsert);
            // Link sessions into their respective gyms' sessions arrays
            if (insertedGyms && insertedGyms.length >= 1 && insertedSessions && insertedSessions.length >= 1) {
                const updates = insertedSessions.map(sess => Gym.findByIdAndUpdate(sess.gymId, { $addToSet: { sessions: sess._id } }));
                await Promise.all(updates);
            }

            // Create subscriptions for users
            const premiumPackage = insertedPackages.find(p => p.id === 'premium_monthly');
            const basicPackage = insertedPackages.find(p => p.id === 'basic_monthly');
            
            // Create subscription for user1 with premium plan
            if (premiumPackage && insertedUsers.length > 0) {
                const user1 = insertedUsers[0];
                const subscriptionData = {
                    userId: user1._id,
                    packageId: premiumPackage._id,
                    startDate: new Date(),
                    endDate: new Date(new Date().setDate(new Date().getDate() + premiumPackage.durationDays)),
                    isActive: true,
                };
                await Subscription.create(subscriptionData);
                // Update user's subscription status
                await User.findByIdAndUpdate(user1._id, { isSubscribed: true, packageID: premiumPackage.id });
            }
            
            // Create subscription for user3 with basic plan
            if (basicPackage && insertedUsers.length > 2) {
                const user3 = insertedUsers[2];
                const subscriptionData = {
                    userId: user3._id,
                    packageId: basicPackage._id,
                    startDate: new Date(),
                    endDate: new Date(new Date().setDate(new Date().getDate() + basicPackage.durationDays)),
                    isActive: true,
                };
                await Subscription.create(subscriptionData);
                // Update user's subscription status
                await User.findByIdAndUpdate(user3._id, { isSubscribed: true, packageID: basicPackage.id });
            }

            const announcements = [
                { content: 'IMPORTANT! Yoga Session time moved!', sessionId: insertedSessions[0]._id },
                { content: 'Reminder: Power Gym maintenance scheduled for November 25th from 10 PM to 2 AM. We apologize for any inconvenience.', sessionId: insertedSessions[1]._id }
            ];
            await Announcement.insertMany(announcements);
            console.log('In-memory database populated with mock data.');
            const users = await User.find({});
            console.log('User IDs created:');
            users.forEach(user => console.log(user._id));
            const admins = await GymAdmin.find({});
            console.log('GymAdmin IDs created:');
            admins.forEach(a => console.log(a._id));
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