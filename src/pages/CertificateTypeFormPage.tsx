// File: src/pages/CertificateTypeFormPage.tsx
// Purpose: Create/edit certificate type form

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import useCertificateTypeStore from '../stores/certificateTypeStore';

const CertificateTypeFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { certificateTypes, loading, error, fetchCertificateTypes, createCertificateType, updateCertificateType } = useCertificateTypeStore();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fileTypesAllowed: 'pdf,jpg,jpeg,png',
    maxFileSizeMb: 5,
    isRequired: true,
    displayOrder: 0,
    isActive: true
  });

  const fileTypeOptions = [
    { value: 'pdf', label: 'PDF' },
    { value: 'jpg', label: 'JPG' },
    { value: 'jpeg', label: 'JPEG' },
    { value: 'png', label: 'PNG' },
    { value: 'doc', label: 'DOC' },
    { value: 'docx', label: 'DOCX' },
    { value: 'xls', label: 'XLS' },
    { value: 'xlsx', label: 'XLSX' }
  ];

  useEffect(() => {
    if (id) {
      const certificateType = certificateTypes.find(ct => ct._id === id);
      if (certificateType) {
        setFormData({
          name: certificateType.name,
          description: certificateType.description || '',
          fileTypesAllowed: certificateType.fileTypesAllowed,
          maxFileSizeMb: certificateType.maxFileSizeMb,
          isRequired: certificateType.isRequired,
          displayOrder: certificateType.displayOrder,
          isActive: certificateType.isActive
        });
      } else {
        fetchCertificateTypes();
      }
    }
  }, [id, certificateTypes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
               type === 'number' ? Number(value) : value
    }));
  };

  const handleFileTypesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    const currentTypes = formData.fileTypesAllowed.split(',').filter(Boolean);
    
    let newTypes;
    if (checked) {
      newTypes = [...currentTypes, value];
    } else {
      newTypes = currentTypes.filter(type => type !== value);
    }
    
    setFormData(prev => ({
      ...prev,
      fileTypesAllowed: newTypes.join(',')
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (id) {
        await updateCertificateType(id, formData);
      } else {
        await createCertificateType(formData);
      }
      navigate('/certificate-types');
    } catch (err) {
      console.error('Failed to save certificate type:', err);
    }
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
          <button
            onClick={() => navigate('/certificate-types')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {id ? 'Edit Certificate Type' : 'New Certificate Type'}
          </h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 p-4 rounded-md text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Certificate Type Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., 10th Grade Mark Sheet"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Brief description of what this certificate is for..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Maximum File Size (MB) *
              </label>
              <input
                type="number"
                name="maxFileSizeMb"
                value={formData.maxFileSizeMb}
                onChange={handleInputChange}
                required
                min="1"
                max="50"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Display Order
              </label>
              <input
                type="number"
                name="displayOrder"
                value={formData.displayOrder}
                onChange={handleInputChange}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Allowed File Types *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {fileTypeOptions.map(option => {
                  const isChecked = formData.fileTypesAllowed.split(',').includes(option.value);
                  return (
                    <div key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        id={option.value}
                        value={option.value}
                        checked={isChecked}
                        onChange={handleFileTypesChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={option.value} className="ml-2 block text-sm text-gray-900">
                        {option.label}
                      </label>
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Selected: {formData.fileTypesAllowed || 'None'}
              </p>
            </div>

            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isRequired"
                  checked={formData.isRequired}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Required Document
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Students must upload this document to complete their application
              </p>
            </div>

            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Only active certificate types will be shown to students
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/certificate-types')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : (id ? 'Update' : 'Create')} Certificate Type
          </button>
        </div>
      </form>
    </div>
  );
};

export default CertificateTypeFormPage;