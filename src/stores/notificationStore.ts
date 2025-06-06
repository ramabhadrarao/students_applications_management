// File: src/stores/notificationStore.ts
// Purpose: Zustand store for notification state management

import { create } from 'zustand';
import axios from 'axios';
import { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
  };
  fetchNotifications: (filters?: Record<string, any>) => Promise<void>;
  getUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  createNotification: (notificationData: Partial<Notification>) => Promise<Notification>;
  createBulkNotifications: (bulkData: any) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearReadNotifications: () => Promise<void>;
  clearError: () => void;
}

const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    total: 0
  },

  fetchNotifications: async (filters = {}) => {
    try {
      set({ loading: true, error: null });
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const { data } = await axios.get(`/api/notifications?${queryParams.toString()}`);
      set({ 
        notifications: data.notifications,
        unreadCount: data.unreadCount,
        pagination: {
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          total: data.total
        },
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch notifications', 
        loading: false 
      });
    }
  },

  getUnreadCount: async () => {
    try {
      const { data } = await axios.get('/api/notifications/unread-count');
      set({ unreadCount: data.unreadCount });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markAsRead: async (id) => {
    try {
      set({ loading: true, error: null });
      await axios.put(`/api/notifications/${id}/read`);
      
      // Update notifications list
      const updatedNotifications = get().notifications.map(notification => 
        notification._id === id ? { ...notification, isRead: true } : notification
      );
      
      // Update unread count
      const currentUnreadCount = get().unreadCount;
      const newUnreadCount = Math.max(0, currentUnreadCount - 1);
      
      set({ 
        notifications: updatedNotifications,
        unreadCount: newUnreadCount,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to mark notification as read', 
        loading: false 
      });
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      set({ loading: true, error: null });
      await axios.put('/api/notifications/mark-all-read');
      
      // Update all notifications to read
      const updatedNotifications = get().notifications.map(notification => 
        ({ ...notification, isRead: true })
      );
      
      set({ 
        notifications: updatedNotifications,
        unreadCount: 0,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to mark all notifications as read', 
        loading: false 
      });
      throw error;
    }
  },

  createNotification: async (notificationData) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.post('/api/notifications', notificationData);
      
      // Update notifications list if it's for the current user
      const currentNotifications = get().notifications;
      set({ 
        notifications: [data, ...currentNotifications], 
        loading: false 
      });
      
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to create notification', 
        loading: false 
      });
      throw error;
    }
  },

  createBulkNotifications: async (bulkData) => {
    try {
      set({ loading: true, error: null });
      await axios.post('/api/notifications/bulk', bulkData);
      
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to create bulk notifications', 
        loading: false 
      });
      throw error;
    }
  },

  deleteNotification: async (id) => {
    try {
      set({ loading: true, error: null });
      await axios.delete(`/api/notifications/${id}`);
      
      // Update notifications list
      const filteredNotifications = get().notifications.filter(notification => notification._id !== id);
      
      // Update unread count if deleted notification was unread
      const deletedNotification = get().notifications.find(n => n._id === id);
      const currentUnreadCount = get().unreadCount;
      const newUnreadCount = deletedNotification && !deletedNotification.isRead 
        ? Math.max(0, currentUnreadCount - 1) 
        : currentUnreadCount;
      
      set({ 
        notifications: filteredNotifications,
        unreadCount: newUnreadCount,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to delete notification', 
        loading: false 
      });
      throw error;
    }
  },

  clearReadNotifications: async () => {
    try {
      set({ loading: true, error: null });
      await axios.delete('/api/notifications/clear-read');
      
      // Keep only unread notifications
      const unreadNotifications = get().notifications.filter(notification => !notification.isRead);
      
      set({ 
        notifications: unreadNotifications,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to clear read notifications', 
        loading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useNotificationStore;