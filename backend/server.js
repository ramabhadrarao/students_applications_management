// File: backend/server.js
// Purpose: Main server file with all routes including new controllers

import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';

// Import route files
import userRoutes from './routes/userRoutes.js';
import programRoutes from './routes/programRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import certificateTypeRoutes from './routes/certificateTypeRoutes.js';
import fileUploadRoutes from './routes/fileUploadRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import applicationDocumentRoutes from './routes/applicationDocumentRoutes.js';
import programCertificateRequirementRoutes from './routes/programCertificateRequirementRoutes.js';

// Load env vars
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/certificate-types', certificateTypeRoutes);
app.use('/api/files', fileUploadRoutes);
app.use('/api/notifications', notificationRoutes);

// Nested routes for application documents
app.use('/api/applications/:applicationId/documents', applicationDocumentRoutes);
// Nested routes for program certificate requirements
app.use('/api/programs/:programId/certificates', programCertificateRequirementRoutes);

// Serve static files (uploads)
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/dist')));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send('API is running....');
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);