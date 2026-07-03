import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import resumeRoutes from './routes/resume';
import interviewRoutes from './routes/interview';
import codingRoutes from './routes/coding';
import recruiterRoutes from './routes/recruiter';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(
  cors({
    origin: '*', // Allow all origins for dev simplicity, can narrow down later
    credentials: true,
  })
);

// Body Parser
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/recruiter', recruiterRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the InterviewAI API',
    status: 'Healthy',
    docs: '/api/docs',
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error.',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 InterviewAI server is running on http://localhost:${PORT}`);
});
