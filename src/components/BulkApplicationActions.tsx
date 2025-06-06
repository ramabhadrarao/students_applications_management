// src/components/BulkApplicationActions.tsx - Bulk Edit/Delete Component

import React, { useState } from 'react';
import { Trash2, Edit, CheckSquare, Square, AlertTriangle, X } from 'lucide-react';
import useApplicationStore from '../stores/applicationStore';
import useAuthStore from '../stores/authStore';

interface BulkApplicationActionsProps {
  applications: any[];
  selectedApplications: string[];
  onSelectionChange: (selected: string[]) => void;
  onBulkActionComplete?: () => void;
}

const BulkApplicationActions: React.FC<BulkApplicationActionsProps> = ({
  applications,
  selectedApplications,
  onSelectionChange,
  onBulkActionComplete
}) => {
  const { user } = useAuthStore();
  const { 
    bulkUpdateApplications, 
    bulkDeleteApplications, 
    bulkLoading, 
    bulkDeleteLoading 
  } = useApplicationStore();
  
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkUpdateData, setBulkUpdateData] = useState({
    status: '',
    academicYear: '',
    reviewedBy: ''
  });

  const isAdmin = user?.role === 'admin';
  const isProgramAdmin = user?.role === 'program_admin';
  const canBulkEdit = isAdmin || isProgramAdmin;
  const canBulkDelete = isAdmin;

  const handleSelectAll = () => {
    if (selectedApplications.length === applications.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(applications.map(app => app._id));
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedApplications.length === 0) return;
    
    try {
      // Filter out empty values
      const updates = Object.entries(bulkUpdateData)
        .filter(([_, value]) => value && value.trim())
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      
      if (Object.keys(updates).length === 0) {
        alert('Please select at least one field to update.');
        return;
      }
      
      await bulkUpdateApplications({
        applicationIds: selectedApplications,
        updates
      });
      
      setShowBulkUpdateModal(false);
      setBulkUpdateData({ status: '', academicYear: '', reviewedBy: '' });
      onSelectionChange([]);
      onBulkActionComplete?.();
    } catch (error) {
      console.error('Bulk update failed:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedApplications.length === 0) return;
    
    try {
      await bulkDeleteApplications(selectedApplications);
      setShowBulkDeleteModal(false);
      onSelectionChange([]);
      onBulkActionComplete?.();
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  };

  if (!canBulkEdit && !canBulkDelete) {
    return null;
  }

  return (
    <>
      {/* Bulk Actions Bar */}
      {applications.length > 0 && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                {selectedApplications.length === applications.length ? (
                  <CheckSquare className="h-4 w-4 mr-2" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                Select All ({applications.length})
              </button>
              
              {selectedApplications.length > 0 && (
                <span className="text-sm text-gray-500">
                  {selectedApplications.length} selected
                </span>
              )}
            </div>
            
            {selectedApplications.length > 0 && (
              <div className="flex items-center space-x-3">
                {canBulkEdit && (
                  <button
                    onClick={() => setShowBulkUpdateModal(true)}
                    disabled={bulkLoading}
                    className="inline-flex items-center px-3 py-1 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Bulk Edit
                  </button>
                )}
                
                {canBulkDelete && (
                  <button
                    onClick={() => setShowBulkDeleteModal(true)}
                    disabled={bulkDeleteLoading}
                    className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Bulk Delete
                  </button>
                )}
                
                <button
                  onClick={() => onSelectionChange([])}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk Update Modal */}
      {showBulkUpdateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Bulk Update Applications
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Updating {selectedApplications.length} applications. Leave fields empty to keep current values.
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                          value={bulkUpdateData.status}
                          onChange={(e) => setBulkUpdateData(prev => ({ ...prev, status: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="">Keep current status</option>
                          <option value="draft">Draft</option>
                          <option value="submitted">Submitted</option>
                          <option value="under_review">Under Review</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="frozen">Frozen</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                        <select
                          value={bulkUpdateData.academicYear}
                          onChange={(e) => setBulkUpdateData(prev => ({ ...prev, academicYear: e.target.value }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="">Keep current year</option>
                          <option value="2025-26">2025-26</option>
                          <option value="2024-25">2024-25</option>
                          <option value="2026-27">2026-27</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleBulkUpdate}
                  disabled={bulkLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {bulkLoading ? 'Updating...' : 'Update Applications'}
                </button>
                <button
                  onClick={() => setShowBulkUpdateModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
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
                      Delete Applications
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete <strong>{selectedApplications.length}</strong> applications? 
                        This action cannot be undone and all related data will be permanently removed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {bulkDeleteLoading ? 'Deleting...' : 'Delete Applications'}
                </button>
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
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

export default BulkApplicationActions;