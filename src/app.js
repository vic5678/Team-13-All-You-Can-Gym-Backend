import express from 'express';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logErrors, logRequests } from './middleware/logger.js';
import cors from 'cors';  

dotenv.config();

const app = express();
app.use(cors({ origin: '*' })); // Enable CORS for all origins
// Middleware
app.use(express.json());
app.use(logRequests);
app.use(logErrors);

// Routes
// Mount API routes under both `/api` and root for backwards compatibility
app.use('/api', routes);
app.use('/', routes);

// Error handling middleware
app.use(errorHandler);

export default app;