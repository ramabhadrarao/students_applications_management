// backend/routes/applicationRoutes.js - UPDATED WITH DELETE ROUTES

import express from 'express';
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  submitApplication,
  deleteApplication,           // NEW
  bulkDeleteApplications,      // NEW
  getApplicationHistory,
  getApplicationStatistics,
  bulkUpdateApplications,
} from '../controllers/applicationController.js';
import { protect, admin, programAdmin } from '../middleware/authMiddleware.js';

// Import nested routes
import applicationDocumentRoutes from './applicationDocumentRoutes.js';

const router = express.Router();

// Nested routes for application documents
router.use('/:applicationId/documents', applicationDocumentRoutes);

// Statistics route (must be before /:id route)
router.route('/statistics')
  .get(protect, admin, getApplicationStatistics);

// Bulk operations routes (must be before /:id route)
router.route('/bulk')
  .put(protect, programAdmin, bulkUpdateApplications)
  .delete(protect, admin, bulkDeleteApplications);    // NEW - Bulk delete

// Main applications routes
router.route('/')
  .get(protect, getApplications)        // Get all applications with filtering
  .post(protect, createApplication);    // Create new application

// Individual application routes
router.route('/:id')
  .get(protect, getApplicationById)     // Get single application
  .put(protect, updateApplication)      // Update application
  .delete(protect, deleteApplication);  // NEW - Delete application

// Application-specific actions
router.route('/:id/submit')
  .put(protect, submitApplication);     // Submit application

router.route('/:id/history')
  .get(protect, getApplicationHistory); // Get application history

export default router;