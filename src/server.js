import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logRequests } from './middleware/logger.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mockdb';

const startServer = async () => {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        app.use(logRequests);
        app.use(errorHandler);

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
};

startServer();