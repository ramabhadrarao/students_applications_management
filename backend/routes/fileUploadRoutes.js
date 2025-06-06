// File: backend/routes/fileUploadRoutes.js
// Purpose: Define routes for file upload operations

import express from 'express';
import {
  uploadFile,
  getFileByUuid,
  downloadFile,
  getUserFiles,
  verifyFile,
  deleteFile
} from '../controllers/fileUploadController.js';
import { protect, admin, programAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// File operations routes
router.route('/')
  .get(protect, getUserFiles)  // Get user's files
  .post(protect, uploadFile);  // Upload file

router.route('/:uuid')
  .get(protect, getFileByUuid)  // Get file metadata
  .delete(protect, deleteFile); // Delete file

router.route('/:uuid/download')
  .get(protect, downloadFile);  // Download file

router.route('/:uuid/verify')
  .put(protect, programAdmin, verifyFile);  // Verify file (Admin/Program Admin only)

export default router;