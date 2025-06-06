// File: src/pages/ProgramCertificateRequirementsPage.tsx
// Purpose: Admin interface to manage program-specific certificate requirements (Updated)

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Settings, CheckCircle, XCircle, Edit2, Trash2 } from 'lucide-react';
import useProgramStore from '../stores/programStore';
import useProgramCertificateRequirementStore from '../stores/programCertificateRequirementStore';

const ProgramCertificateRequirementsPage = () => {
  const { programId } = useParams();
  const { programs, fetchPrograms } = useProgramStore();
  const { 
    requirements, 
    availableCertificateTypes, 
    loading, 
    error, 
    fetchProgramRequirements,
    fetchAvailableCertificateTypes,
    addProgramRequirement,
    updateProgramRequirement,
    deleteProgramRequirement,
    clearError
  } = useProgramCertificateRequirementStore();
  
  const [currentProgram, setCurrentProgram] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<any>(null);

  const [newRequirement, setNewRequirement] = useState({
    certificateTypeId: '',
    isRequired: true,
    specialInstructions: '',
    displayOrder: 0
  });

  useEffect(() => {
    if (programId) {
      fetchPrograms();
      fetchProgramRequirements(programId);
      fetchAvailableCertificateTypes(programId);
    }
  }, [programId]);

  useEffect(() => {
    if (programs.length > 0 && programId) {
      const program = programs.find(p => p._id === programId);
      setCurrentProgram(program);
    }
  }, [programs, programId]);

  // Refresh available certificate types when requirements change
  useEffect(() => {
    if (programId) {
      fetchAvailableCertificateTypes(programId);
    }
  }, [requirements.length, programId]);

  const handleAddRequirement = async () => {
    if (!programId || !newRequirement.certificateTypeId) return;
    
    try {
      await addProgramRequirement(programId, {
        certificateTypeId: newRequirement.certificateTypeId,
        isRequired: newRequirement.isRequired,
        specialInstructions: newRequirement.specialInstructions,
        displayOrder: newRequirement.displayOrder || requirements.length + 1
      });
      
      setNewRequirement({
        certificateTypeId: '',
        isRequired: true,
        specialInstructions: '',
        displayOrder: 0
      });
      setShowAddModal(false);
      
      // Refresh available certificate types
      fetchAvailableCertificateTypes(programId);
    } catch (err) {
      console.error('Failed to add requirement:', err);
    }
  };

  const handleUpdateRequirement = async () => {
    if (!programId || !editingRequirement) return;
    
    try {
      await updateProgramRequirement(programId, editingRequirement._id, {
        isRequired: editingRequirement.isRequired,
        specialInstructions: editingRequirement.specialInstructions,
        displayOrder: editingRequirement.displayOrder
      });
      
      setEditingRequirement(null);
    } catch (err) {
      console.error('Failed to update requirement:', err);
    }
  };

  const handleDeleteRequirement = async (requirementId: string) => {
    if (!programId) return;
    
    if (window.confirm('Are you sure you want to remove this requirement?')) {
      try {
        await deleteProgramRequirement(programId, requirementId);
        // Refresh available certificate types
        fetchAvailableCertificateTypes(programId);
      } catch (err) {
        console.error('Failed to delete requirement:', err);
      }
    }
  };

  const resetAddForm = () => {
    setNewRequirement({
      certificateTypeId: '',
      isRequired: true,
      specialInstructions: '',
      displayOrder: 0
    });
    setShowAddModal(false);
    clearError();
  };

  const resetEditForm = () => {
    setEditingRequirement(null);
    clearError();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link
            to="/programs"
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Certificate Requirements</h1>
            {currentProgram && (
              <p className="text-sm text-gray-600 mt-1">
                {currentProgram.programName} ({currentProgram.programCode})
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Requirement
        </button>
      </div>

      {error && (
        <div className="bg-red-100 p-4 rounded-md text-red-800">
          {error}
        </div>
      )}

      {/* Program Overview */}
      {currentProgram && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Program Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Program Type</p>
              <p className="text-sm text-gray-900">{currentProgram.programType}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Department</p>
              <p className="text-sm text-gray-900">{currentProgram.department}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Duration</p>
              <p className="text-sm text-gray-900">{currentProgram.durationYears} years</p>
            </div>
          </div>
        </div>
      )}

      {/* Requirements List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Certificate Requirements ({requirements.length})
          </h3>
          
          {requirements.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No requirements configured</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add certificate requirements for this program.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Requirement
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {requirements
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((requirement) => (
                <div key={requirement._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {requirement.isRequired ? (
                          <CheckCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900">
                          {requirement.certificateTypeId.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {requirement.certificateTypeId.description}
                        </p>
                        {requirement.specialInstructions && (
                          <p className="text-sm text-blue-600 mt-1">
                            <strong>Special Instructions:</strong> {requirement.specialInstructions}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            requirement.isRequired 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {requirement.isRequired ? 'Required' : 'Optional'}
                          </span>
                          <span className="text-xs text-gray-500">
                            Order: {requirement.displayOrder}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingRequirement({ ...requirement })}
                        className="text-gray-400 hover:text-gray-600"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRequirement(requirement._id)}
                        className="text-gray-400 hover:text-red-600"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Requirement Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Add Certificate Requirement
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Certificate Type *
                        </label>
                        <select
                          value={newRequirement.certificateTypeId}
                          onChange={(e) => setNewRequirement(prev => ({ 
                            ...prev, 
                            certificateTypeId: e.target.value 
                          }))}
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          <option value="">Select certificate type...</option>
                          {availableCertificateTypes.map(cert => (
                            <option key={cert._id} value={cert._id}>
                              {cert.name}
                            </option>
                          ))}
                        </select>
                        {availableCertificateTypes.length === 0 && (
                          <p className="mt-1 text-sm text-gray-500">
                            No available certificate types. All certificate types may already be added.
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Display Order
                        </label>
                        <input
                          type="number"
                          value={newRequirement.displayOrder}
                          onChange={(e) => setNewRequirement(prev => ({ 
                            ...prev, 
                            displayOrder: parseInt(e.target.value) || 0
                          }))}
                          min="0"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Special Instructions
                        </label>
                        <textarea
                          value={newRequirement.specialInstructions}
                          onChange={(e) => setNewRequirement(prev => ({ 
                            ...prev, 
                            specialInstructions: e.target.value 
                          }))}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Any special instructions for this certificate..."
                        />
                      </div>

                      <div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newRequirement.isRequired}
                            onChange={(e) => setNewRequirement(prev => ({ 
                              ...prev, 
                              isRequired: e.target.checked 
                            }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-900">
                            Required Certificate
                          </label>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Students must upload this certificate to complete their application
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleAddRequirement}
                  disabled={!newRequirement.certificateTypeId || loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Requirement'}
                </button>
                <button
                  onClick={resetAddForm}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Requirement Modal */}
      {editingRequirement && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Edit Certificate Requirement
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Certificate Type
                        </label>
                        <input
                          type="text"
                          value={editingRequirement.certificateTypeId.name}
                          disabled
                          className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Display Order
                        </label>
                        <input
                          type="number"
                          value={editingRequirement.displayOrder}
                          onChange={(e) => setEditingRequirement(prev => ({ 
                            ...prev, 
                            displayOrder: parseInt(e.target.value) || 0
                          }))}
                          min="0"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Special Instructions
                        </label>
                        <textarea
                          value={editingRequirement.specialInstructions || ''}
                          onChange={(e) => setEditingRequirement(prev => ({ 
                            ...prev, 
                            specialInstructions: e.target.value 
                          }))}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Any special instructions for this certificate..."
                        />
                      </div>

                      <div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editingRequirement.isRequired}
                            onChange={(e) => setEditingRequirement(prev => ({ 
                              ...prev, 
                              isRequired: e.target.checked 
                            }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="ml-2 block text-sm text-gray-900">
                            Required Certificate
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleUpdateRequirement}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Requirement'}
                </button>
                <button
                  onClick={resetEditForm}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramCertificateRequirementsPage;