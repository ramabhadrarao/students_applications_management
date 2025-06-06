import express from 'express';
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  submitApplication,
  getApplicationHistory,
  getApplicationStatistics,
} from '../controllers/applicationController.js';
import { protect, admin, programAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getApplications).post(protect, createApplication);
router.route('/statistics').get(protect, admin, getApplicationStatistics);

router
  .route('/:id')
  .get(protect, getApplicationById)
  .put(protect, updateApplication);

router.route('/:id/submit').put(protect, submitApplication);
router.route('/:id/history').get(protect, getApplicationHistory);

export default router;