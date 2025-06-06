// File: backend/routes/programCertificateRequirementRoutes.js
// Purpose: Define routes for program certificate requirements

import express from 'express';
import {
  getProgramCertificateRequirements,
  addProgramCertificateRequirement,
  updateProgramCertificateRequirement,
  deleteProgramCertificateRequirement,
  getAvailableCertificateTypes,
  reorderProgramCertificateRequirements
} from '../controllers/programCertificateRequirementController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true }); // mergeParams to access :programId

// Program certificate requirement routes
router.route('/')
  .get(protect, getProgramCertificateRequirements)  // Get all requirements for program
  .post(protect, admin, addProgramCertificateRequirement); // Add requirement to program (Admin only)

router.route('/available')
  .get(protect, admin, getAvailableCertificateTypes); // Get available certificate types

router.route('/reorder')
  .put(protect, admin, reorderProgramCertificateRequirements); // Reorder requirements

// Individual requirement routes
router.route('/:requirementId')
  .put(protect, admin, updateProgramCertificateRequirement)  // Update requirement (Admin only)
  .delete(protect, admin, deleteProgramCertificateRequirement); // Delete requirement (Admin only)

export default router;