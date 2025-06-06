// File: src/pages/NotificationFormPage.tsx
// Purpose: Admin interface to create notifications

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Users, User } from 'lucide-react';
import useNotificationStore from '../stores/notificationStore';
import useUserStore from '../stores/userStore';
import useProgramStore from '../stores/programStore';

const NotificationFormPage = () => {
  const navigate = useNavigate();
  const { createNotification, createBulkNotifications, loading, error } = useNotificationStore();
  const { users, fetchUsers } = useUserStore();
  const { programs, fetchPrograms } = useProgramStore();

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    actionUrl: '',
    expiresAt: '',
    recipientType: 'single', // single, role, program, all
    userId: '',
    role: '',
    programId: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchPrograms();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (formData.recipientType === 'single') {
        // Single user notification
        await createNotification({
          userId: formData.userId,
          title: formData.title,
          message: formData.message,
          type: formData.type as any,
          actionUrl: formData.actionUrl || undefined,
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined
        });
      } else {
        // Bulk notification
        let userIds: string[] = [];
        
        if (formData.recipientType === 'all') {
          userIds = users.map(user => user._id);
        } else if (formData.recipientType === 'role') {
          userIds = users
            .filter(user => user.role === formData.role)
            .map(user => user._id);
        } else if (formData.recipientType === 'program') {
          userIds = users
            .filter(user => user.programId === formData.programId)
            .map(user => user._id);
        }
        
        await createBulkNotifications({
          userIds,
          title: formData.title,
          message: formData.message,
          type: formData.type,
          actionUrl: formData.actionUrl || undefined,
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : undefined
        });
      }
      
      navigate('/notifications');
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  };

  const getRecipientCount = () => {
    if (formData.recipientType === 'single') return 1;
    if (formData.recipientType === 'all') return users.length;
    if (formData.recipientType === 'role') {
      return users.filter(user => user.role === formData.role).length;
    }
    if (formData.recipientType === 'program') {
      return users.filter(user => user.programId === formData.programId).length;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/notifications')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Send Notification</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 p-4 rounded-md text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient Selection */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recipients</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Send to</label>
              <select
                name="recipientType"
                value={formData.recipientType}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="single">Single User</option>
                <option value="role">All Users with Role</option>
                <option value="program">All Users in Program</option>
                <option value="all">All Users</option>
              </select>
            </div>

            {formData.recipientType === 'single' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Select User</label>
                <select
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Choose a user...</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.email} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.recipientType === 'role' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Choose a role...</option>
                  <option value="student">Students</option>
                  <option value="program_admin">Program Admins</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            )}

            {formData.recipientType === 'program' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Program</label>
                <select
                  name="programId"
                  value={formData.programId}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Choose a program...</option>
                  {programs.map(program => (
                    <option key={program._id} value={program._id}>
                      {program.programName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Recipient Count */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-400 mr-2" />
                <span className="text-sm text-blue-800">
                  This notification will be sent to {getRecipientCount()} user(s)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Content */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Content</h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter notification title..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Message *</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter notification message..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="danger">Error</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Expires At (optional)</label>
              <input
                type="datetime-local"
                name="expiresAt"
                value={formData.expiresAt}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Action URL (optional)</label>
              <input
                type="text"
                name="actionUrl"
                value={formData.actionUrl}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="/applications/123 or external URL"
              />
              <p className="mt-1 text-sm text-gray-500">
                Link users can click to view related content
              </p>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
          
          <div className={`border rounded-lg p-4 ${
            formData.type === 'success' ? 'bg-green-50 border-green-200' :
            formData.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
            formData.type === 'danger' ? 'bg-red-50 border-red-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {formData.type === 'success' && <div className="h-5 w-5 bg-green-500 rounded-full"></div>}
                {formData.type === 'warning' && <div className="h-5 w-5 bg-yellow-500 rounded-full"></div>}
                {formData.type === 'danger' && <div className="h-5 w-5 bg-red-500 rounded-full"></div>}
                {formData.type === 'info' && <div className="h-5 w-5 bg-blue-500 rounded-full"></div>}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900">
                  {formData.title || 'Notification Title'}
                </h4>
                <p className="text-sm text-gray-700 mt-1">
                  {formData.message || 'Notification message will appear here...'}
                </p>
                {formData.actionUrl && (
                  <p className="text-xs text-blue-600 mt-2">
                    Action: {formData.actionUrl}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Sending...' : `Send to ${getRecipientCount()} User(s)`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotificationFormPage;