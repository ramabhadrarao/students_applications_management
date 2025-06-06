// File: backend/routes/notificationRoutes.js
// Purpose: Define routes for notification operations

import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  createBulkNotifications,
  deleteNotification,
  clearReadNotifications,
  cleanupExpiredNotifications
} from '../controllers/notificationController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Main notification routes
router.route('/')
  .get(protect, getNotifications)  // Get user notifications
  .post(protect, admin, createNotification);  // Create notification (Admin only)

// Bulk operations
router.route('/bulk')
  .post(protect, admin, createBulkNotifications);  // Create bulk notifications (Admin only)

// Utility routes
router.route('/unread-count')
  .get(protect, getUnreadCount);  // Get unread count

router.route('/mark-all-read')
  .put(protect, markAllAsRead);  // Mark all as read

router.route('/clear-read')
  .delete(protect, clearReadNotifications);  // Clear read notifications

router.route('/cleanup-expired')
  .delete(protect, admin, cleanupExpiredNotifications);  // Cleanup expired (Admin only)

// Individual notification routes
router.route('/:id')
  .delete(protect, deleteNotification);  // Delete notification

router.route('/:id/read')
  .put(protect, markAsRead);  // Mark as read

export default router;