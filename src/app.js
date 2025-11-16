import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logErrors, logRequests } from './middleware/logger.js';
import cors from 'cors';  

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:3001' }));  
// Middleware
app.use(express.json());
app.use(logRequests);
app.use(logErrors);

// Routes
app.use('/api', routes);

// Error handling middleware
app.use(errorHandler);

export default app;