import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/middleware';
import subscriptionRoutes from './routes/subscriptionRoutes';
import { initLifecycleAutomation } from './services/automation';

dotenv.config({ path: '.env.local' });

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Database Connector (Mock - assuming URI in .env)
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/subscription');
        console.log('MongoDB Connected to Lifecycle Backend');
    } catch (err) {
        console.error('Database connection failed', err);
        process.exit(1);
    }
};
connectDB();

// Health Check
app.get('/health', (req: Request, res: Response) => res.status(200).json({ status: 'ok' }));

// Route Mounting
app.use('/api/v2/subscriptions', subscriptionRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = 5001;
app.listen(PORT, () => {
    console.log(`Production Lifecycle Backend running on port ${PORT}`);
    console.log(`Endpoints available at /api/v2/subscriptions`);
    
    // Initialize Automated Lifecycle Controllers
    initLifecycleAutomation();
});
