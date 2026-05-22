import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import apiRouter from './routes/api.js';

// Load environmental variables
dotenv.config();

// Establish database connection
connectDB();

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow connections from Vite frontend development environments
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Express status check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Bind API routing rules
app.use('/api', apiRouter);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('💥 Server Error Unhandled:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Configure listener port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 SVP Carpenter Tracker Backend live on port: ${PORT} [${process.env.NODE_ENV}]`);
});
