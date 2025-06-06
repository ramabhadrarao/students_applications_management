// File: backend/controllers/notificationController.js
// Purpose: Handle notification operations and management

import asyncHandler from 'express-async-handler';
import Notification from '../models/notificationModel.js';

// @desc    Fetch all notifications for user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  try {
    console.log('🔔 Fetching notifications...');
    
    const { 
      isRead, 
      type, 
      page = 1, 
      limit = 20
    } = req.query;
    
    // Build filter object
    const filter = { userId: req.user._id };
    
    // Add filters based on query parameters
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }
    if (type) {
      filter.type = type;
    }
    
    // Remove expired notifications
    filter.$or = [
      { expiresAt: { $exists: false } },
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ];
    
    console.log('🔍 Filter applied:', filter);
    
    const notifications = await Notification.find(filter)
      .sort({ dateCreated: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Notification.countDocuments(filter);
    
    console.log(`✅ Found ${notifications.length} notifications`);
    
    res.json({
      notifications,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      unreadCount: await Notification.countDocuments({ 
        userId: req.user._id, 
        isRead: false,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      })
    });
  } catch (error) {
    console.error('❌ Error in getNotifications:', error);
    res.status(500);
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  try {
    console.log('📊 Getting unread notification count...');
    
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user._id, 
      isRead: false,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });
    
    console.log(`✅ Unread count: ${unreadCount}`);
    res.json({ unreadCount });
  } catch (error) {
    console.error('❌ Error in getUnreadCount:', error);
    res.status(500);
    throw new Error(`Failed to get unread count: ${error.message}`);
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  try {
    console.log(`📖 Marking notification as read: ${req.params.id}`);
    
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      console.log(`❌ Notification not found: ${req.params.id}`);
      res.status(404);
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    const updatedNotification = await notification.save();
    
    console.log(`✅ Notification marked as read: ${updatedNotification._id}`);
    res.json(updatedNotification);
  } catch (error) {
    console.error('❌ Error in markAsRead:', error);
    throw error;
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  try {
    console.log('📖 Marking all notifications as read...');
    
    const result = await Notification.updateMany(
      { 
        userId: req.user._id, 
        isRead: false,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      },
      { isRead: true }
    );
    
    console.log(`✅ Marked ${result.modifiedCount} notifications as read`);
    res.json({ 
      message: `Marked ${result.modifiedCount} notifications as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Error in markAllAsRead:', error);
    res.status(500);
    throw new Error(`Failed to mark notifications as read: ${error.message}`);
  }
});

// @desc    Create a notification (Admin only)
// @route   POST /api/notifications
// @access  Private/Admin
const createNotification = asyncHandler(async (req, res) => {
  try {
    console.log('📝 Creating new notification...');
    
    const {
      userId,
      title,
      message,
      type,
      actionUrl,
      expiresAt
    } = req.body;

    const notification = await Notification.create({
      userId,
      title,
      message,
      type: type || 'info',
      actionUrl,
      expiresAt
    });

    if (notification) {
      console.log(`✅ Notification created: ${notification.title}`);
      res.status(201).json(notification);
    } else {
      console.log('❌ Failed to create notification');
      res.status(400);
      throw new Error('Invalid notification data');
    }
  } catch (error) {
    console.error('❌ Error in createNotification:', error);
    throw error;
  }
});

// @desc    Create bulk notifications (Admin only)
// @route   POST /api/notifications/bulk
// @access  Private/Admin
const createBulkNotifications = asyncHandler(async (req, res) => {
  try {
    console.log('📝 Creating bulk notifications...');
    
    const {
      userIds,
      title,
      message,
      type,
      actionUrl,
      expiresAt
    } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      res.status(400);
      throw new Error('User IDs array is required');
    }

    const notifications = userIds.map(userId => ({
      userId,
      title,
      message,
      type: type || 'info',
      actionUrl,
      expiresAt
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    console.log(`✅ Created ${createdNotifications.length} notifications`);
    res.status(201).json({
      message: `Created ${createdNotifications.length} notifications`,
      count: createdNotifications.length,
      notifications: createdNotifications
    });
  } catch (error) {
    console.error('❌ Error in createBulkNotifications:', error);
    throw error;
  }
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  try {
    console.log(`🗑️ Deleting notification: ${req.params.id}`);
    
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!notification) {
      console.log(`❌ Notification not found: ${req.params.id}`);
      res.status(404);
      throw new Error('Notification not found');
    }

    await notification.deleteOne();
    
    console.log(`✅ Notification deleted: ${notification._id}`);
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('❌ Error in deleteNotification:', error);
    throw error;
  }
});

// @desc    Delete all read notifications
// @route   DELETE /api/notifications/clear-read
// @access  Private
const clearReadNotifications = asyncHandler(async (req, res) => {
  try {
    console.log('🗑️ Clearing all read notifications...');
    
    const result = await Notification.deleteMany({
      userId: req.user._id,
      isRead: true
    });
    
    console.log(`✅ Deleted ${result.deletedCount} read notifications`);
    res.json({ 
      message: `Deleted ${result.deletedCount} read notifications`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Error in clearReadNotifications:', error);
    res.status(500);
    throw new Error(`Failed to clear read notifications: ${error.message}`);
  }
});

// @desc    Clean up expired notifications (System function)
// @route   DELETE /api/notifications/cleanup-expired
// @access  Private/Admin
const cleanupExpiredNotifications = asyncHandler(async (req, res) => {
  try {
    console.log('🧹 Cleaning up expired notifications...');
    
    const result = await Notification.deleteMany({
      expiresAt: { $exists: true, $lte: new Date() }
    });
    
    console.log(`✅ Cleaned up ${result.deletedCount} expired notifications`);
    res.json({ 
      message: `Cleaned up ${result.deletedCount} expired notifications`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Error in cleanupExpiredNotifications:', error);
    res.status(500);
    throw new Error(`Failed to cleanup expired notifications: ${error.message}`);
  }
});

export {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  createBulkNotifications,
  deleteNotification,
  clearReadNotifications,
  cleanupExpiredNotifications
};