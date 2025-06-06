// src/components/ApplicationActions.tsx - Edit/Delete Action Components

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Edit2, Trash2, MoreVertical, AlertTriangle, X } from 'lucide-react';
import useApplicationStore from '../stores/applicationStore';
import useAuthStore from '../stores/authStore';

interface ApplicationActionsProps {
  application: any;
  onDeleteSuccess?: () => void;
  showDropdown?: boolean;
}

const ApplicationActions: React.FC<ApplicationActionsProps> = ({ 
  application, 
  onDeleteSuccess,
  showDropdown = true 
}) => {
  const { user } = useAuthStore();
  const { deleteApplication, deleteLoading } = useApplicationStore();
  const navigate = useNavigate();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Check permissions
  const canEdit = () => {
    return user?.role === 'student' && 
           application.userId === user._id && 
           ['draft', 'rejected'].includes(application.status);
  };

  const canDelete = () => {
    return (user?.role === 'admin') ||
           (user?.role === 'student' && 
            application.userId === user._id && 
            application.status === 'draft');
  };

  const handleDelete = async () => {
    try {
      await deleteApplication(application._id);
      setShowDeleteModal(false);
      onDeleteSuccess?.();
      // Optionally navigate away if on detail page
      if (window.location.pathname.includes(`/applications/${application._id}`)) {
        navigate('/applications');
      }
    } catch (error) {
      console.error('Failed to delete application:', error);
      // Error is handled by the store, just close modal
      setShowDeleteModal(false);
    }
  };

  const confirmDelete = () => {
    setShowDeleteModal(true);
    setShowActionsMenu(false);
  };

  if (!canEdit() && !canDelete()) {
    return null; // No actions available
  }

  return (
    <>
      {showDropdown ? (
        // Dropdown menu version
        <div className="relative">
          <button
            onClick={() => setShowActionsMenu(!showActionsMenu)}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          
          {showActionsMenu && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowActionsMenu(false)}
              ></div>
              
              {/* Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                <div className="py-1">
                  {canEdit() && (
                    <Link
                      to={`/applications/${application._id}/edit`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowActionsMenu(false)}
                    >
                      <Edit2 className="h-4 w-4 mr-3" />
                      Edit Application
                    </Link>
                  )}
                  
                  {canDelete() && (
                    <button
                      onClick={confirmDelete}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-3" />
                      Delete Application
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        // Inline buttons version
        <div className="flex space-x-2">
          {canEdit() && (
            <Link
              to={`/applications/${application._id}/edit`}
              className="inline-flex items-center px-3 py-1 border border-blue-300 shadow-sm text-xs leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Edit
            </Link>
          )}
          
          {canDelete() && (
            <button
              onClick={confirmDelete}
              className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Application
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the application <strong>#{application.applicationNumber}</strong> for <strong>{application.studentName}</strong>? 
                        This action cannot be undone and all related data will be permanently removed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading === application._id}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {deleteLoading === application._id ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApplicationActions;