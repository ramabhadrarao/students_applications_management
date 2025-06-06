// File: backend/routes/certificateTypeRoutes.js
// Purpose: Define routes for certificate type operations

import express from 'express';
import {
  getCertificateTypes,
  getCertificateTypeById,
  createCertificateType,
  updateCertificateType,
  deleteCertificateType
} from '../controllers/certificateTypeController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Main certificate types routes
router.route('/')
  .get(getCertificateTypes)  // Public route - no auth required
  .post(protect, admin, createCertificateType);  // Admin only

// Individual certificate type routes
router.route('/:id')
  .get(getCertificateTypeById)  // Public route - no auth required
  .put(protect, admin, updateCertificateType)  // Admin only
  .delete(protect, admin, deleteCertificateType);  // Admin only

export default router;