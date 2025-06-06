import express from 'express';
import {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  getProgramStatistics,
  debugPrograms,
} from '../controllers/programController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Debug route (add this temporarily to diagnose the issue)
router.route('/debug').get(debugPrograms);

// Statistics route (must be before /:id route)
router.route('/statistics').get(protect, admin, getProgramStatistics);

// Main programs routes
router.route('/')
  .get(getPrograms)  // Public route - no auth required
  .post(protect, admin, createProgram);  // Admin only

// Individual program routes
router.route('/:id')
  .get(getProgramById)  // Public route - no auth required
  .put(protect, admin, updateProgram)  // Admin only
  .delete(protect, admin, deleteProgram);  // Admin only

export default router;