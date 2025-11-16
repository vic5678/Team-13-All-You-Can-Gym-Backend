import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logRequests } from './middleware/logger.js';
import connectDB from './config/database.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectDB();

        app.use(logRequests);
        app.use(errorHandler);

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
    }
};

startServer();