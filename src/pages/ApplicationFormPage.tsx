import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Send, ArrowLeft } from 'lucide-react';
import useApplicationStore from '../stores/applicationStore';
import useProgramStore from '../stores/programStore';
import useAuthStore from '../stores/authStore';

const ApplicationFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { programs, loading: programsLoading, error: programsError, fetchPrograms } = useProgramStore();
  const { 
    currentApplication,
    loading,
    error,
    fetchApplicationById,
    createApplication,
    updateApplication,
    submitApplication
  } = useApplicationStore();

  const [formData, setFormData] = useState({
    programId: '',
    academicYear: '2025-26',
    studentName: '',
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    gender: '',
    aadharNumber: '',
    mobileNumber: '',
    parentMobile: '',
    guardianMobile: '',
    email: user?.email || '',
    presentAddress: {
      doorNo: '',
      street: '',
      village: '',
      mandal: '',
      district: '',
      pincode: ''
    },
    permanentAddress: {
      doorNo: '',
      street: '',
      village: '',
      mandal: '',
      district: '',
      pincode: ''
    },
    religion: '',
    caste: '',
    reservationCategory: 'OC',
    isPhysicallyHandicapped: false,
    sadaramNumber: '',
    identificationMarks: ['', ''],
    specialReservation: '',
    meesevaDetails: {
      casteCertificate: '',
      incomeCertificate: ''
    },
    rationCardNumber: ''
  });

  // Debug logging
  useEffect(() => {
    console.log('Programs loading state:', programsLoading);
    console.log('Programs error:', programsError);
    console.log('Programs data:', programs);
    console.log('Programs count:', programs?.length);
  }, [programs, programsLoading, programsError]);

  useEffect(() => {
    // Fetch programs first
    console.log('Fetching programs...');
    fetchPrograms().then(() => {
      console.log('Programs fetch completed');
    }).catch((err) => {
      console.error('Error fetching programs:', err);
    });
    
    // If editing, fetch application data
    if (id) {
      console.log('Fetching application by ID:', id);
      fetchApplicationById(id).then(application => {
        if (application) {
          setFormData({
            ...application,
            dateOfBirth: new Date(application.dateOfBirth).toISOString().split('T')[0]
          });
        }
      }).catch((err) => {
        console.error('Error fetching application:', err);
      });
    }
  }, [id, fetchPrograms, fetchApplicationById]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (id) {
        await updateApplication(id, formData);
      } else {
        await createApplication(formData);
      }
      navigate('/applications');
    } catch (err) {
      console.error('Failed to save application:', err);
    }
  };

  const handleSubmitApplication = async () => {
    if (!id) return;
    
    try {
      await submitApplication(id);
      navigate('/applications');
    } catch (err) {
      console.error('Failed to submit application:', err);
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
            onClick={() => navigate('/applications')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">
            {id ? 'Edit Application' : 'New Application'}
          </h1>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </button>
          {id && currentApplication?.status === 'draft' && (
            <button
              type="button"
              onClick={handleSubmitApplication}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Send className="h-4 w-4 mr-2" />
              Submit Application
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 p-4 rounded-md text-red-800">
          {error}
        </div>
      )}

      {programsError && (
        <div className="bg-red-100 p-4 rounded-md text-red-800">
          <strong>Programs Error:</strong> {programsError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Program Selection */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Program Details</h2>
          
          {/* Debug info for programs */}
          {process.env.NODE_ENV === 'undebug' && (
            <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
              <strong>Debug Info:</strong><br />
              Programs Loading: {programsLoading ? 'Yes' : 'No'}<br />
              Programs Count: {programs?.length || 0}<br />
              Programs Error: {programsError || 'None'}<br />
              Sample Program: {programs?.[0]?.programName || 'No programs found'}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Program *
              </label>
              <select
                name="programId"
                value={formData.programId}
                onChange={handleInputChange}
                required
                disabled={programsLoading}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100"
              >
                <option value="">
                  {programsLoading ? 'Loading programs...' : 'Select Program'}
                </option>
                {programs && programs.length > 0 ? (
                  programs
                    .filter(program => program.isActive)
                    .map(program => (
                      <option key={program._id} value={program._id}>
                        {program.programName} ({program.programCode})
                      </option>
                    ))
                ) : (
                  !programsLoading && (
                    <option value="" disabled>
                      No programs available
                    </option>
                  )
                )}
              </select>
              {programsLoading && (
                <p className="mt-1 text-sm text-blue-600">Loading available programs...</p>
              )}
              {!programsLoading && (!programs || programs.length === 0) && (
                <p className="mt-1 text-sm text-red-600">
                  No programs found. Please contact administrator.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Academic Year *
              </label>
              <select
                name="academicYear"
                value={formData.academicYear}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="2025-26">2025-26</option>
                <option value="2024-25">2024-25</option>
                <option value="2026-27">2026-27</option>
              </select>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Student Name *
              </label>
              <input
                type="text"
                name="studentName"
                value={formData.studentName}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Father's Name *
              </label>
              <input
                type="text"
                name="fatherName"
                value={formData.fatherName}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter father's full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mother's Name *
              </label>
              <input
                type="text"
                name="motherName"
                value={formData.motherName}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter mother's full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Aadhar Number
              </label>
              <input
                type="text"
                name="aadharNumber"
                value={formData.aadharNumber}
                onChange={handleInputChange}
                pattern="[0-9]{12}"
                title="Please enter a valid 12-digit Aadhar number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="12-digit Aadhar number"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mobile Number *
              </label>
              <input
                type="tel"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleInputChange}
                required
                pattern="[0-9]{10}"
                title="Please enter a valid 10-digit mobile number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="10-digit mobile number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Parent's Mobile
              </label>
              <input
                type="tel"
                name="parentMobile"
                value={formData.parentMobile}
                onChange={handleInputChange}
                pattern="[0-9]{10}"
                title="Please enter a valid 10-digit mobile number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Parent's mobile number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Guardian's Mobile
              </label>
              <input
                type="tel"
                name="guardianMobile"
                value={formData.guardianMobile}
                onChange={handleInputChange}
                pattern="[0-9]{10}"
                title="Please enter a valid 10-digit mobile number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Guardian's mobile number"
              />
            </div>
          </div>
        </div>

        {/* Reservation Details */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Reservation Details</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Religion
              </label>
              <input
                type="text"
                name="religion"
                value={formData.religion}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter religion"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Caste
              </label>
              <input
                type="text"
                name="caste"
                value={formData.caste}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter caste"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reservation Category *
              </label>
              <select
                name="reservationCategory"
                value={formData.reservationCategory}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="OC">OC (Open Category)</option>
                <option value="BC-A">BC-A</option>
                <option value="BC-B">BC-B</option>
                <option value="BC-C">BC-C</option>
                <option value="BC-D">BC-D</option>
                <option value="BC-E">BC-E</option>
                <option value="SC">SC (Scheduled Caste)</option>
                <option value="ST">ST (Scheduled Tribe)</option>
                <option value="EWS">EWS (Economically Weaker Section)</option>
                <option value="PH">PH (Physically Handicapped)</option>
              </select>
            </div>
            <div>
              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  name="isPhysicallyHandicapped"
                  checked={formData.isPhysicallyHandicapped}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Physically Handicapped
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/applications')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || programsLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : (id ? 'Update' : 'Create')} Application
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationFormPage;