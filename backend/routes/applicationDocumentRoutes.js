// File: backend/routes/applicationDocumentRoutes.js
// Purpose: Define routes for application document operations (UPDATED)

import express from 'express';
import {
  getApplicationDocuments,
  addApplicationDocument,
  updateApplicationDocument,
  verifyApplicationDocument,
  deleteApplicationDocument,
  getDocumentVerificationStatus,
  getAvailableCertificateTypes
} from '../controllers/applicationDocumentController.js';
import { protect, programAdmin } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true }); // mergeParams to access :applicationId

// Application document routes
router.route('/')
  .get(protect, getApplicationDocuments)  // Get all documents for application
  .post(protect, addApplicationDocument); // Add document to application

router.route('/verification-status')
  .get(protect, getDocumentVerificationStatus); // Get verification status

router.route('/available-types')
  .get(protect, getAvailableCertificateTypes); // Get available certificate types for program

// Individual document routes
router.route('/:documentId')
  .put(protect, updateApplicationDocument)  // Update document
  .delete(protect, deleteApplicationDocument); // Delete document

router.route('/:documentId/verify')
  .put(protect, programAdmin, verifyApplicationDocument); // Verify document (Admin/Program Admin only)

export default router;