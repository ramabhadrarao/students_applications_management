import express from 'express';
import {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  getProgramStatistics,
} from '../controllers/programController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(getPrograms).post(protect, admin, createProgram);
router.route('/statistics').get(protect, admin, getProgramStatistics);
router
  .route('/:id')
  .get(getProgramById)
  .put(protect, admin, updateProgram)
  .delete(protect, admin, deleteProgram);

export default router;