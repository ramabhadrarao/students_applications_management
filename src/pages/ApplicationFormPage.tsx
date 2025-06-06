// src/pages/ApplicationFormPage.tsx - FIXED VERSION
// Enhanced to handle ALL schema fields properly

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Send, ArrowLeft, Plus, Trash2, Copy } from 'lucide-react';
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
    
    // Personal Information
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
    religion: '',
    caste: '',
    reservationCategory: 'OC',
    isPhysicallyHandicapped: false,
    specialReservation: '',
    
    // Intermediate Details - ALL FIELDS
    interBoard: '',
    interHallTicketNumber: '',
    sscHallTicketNumber: '',
    interPassYear: '',
    interPassoutType: '',
    bridgeCourse: '',
    interCourseName: '',
    interMedium: '',
    interSecondLanguage: '',
    interMarksSecured: '',
    interMaximumMarks: '',
    interLanguagesTotal: '',
    interLanguagesPercentage: '',
    interGroupSubjectsPercentage: '',
    interCollegeName: '',
    
    // Address
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
    
    // Additional Information
    identificationMarks: ['', ''],
    sadaramNumber: '',
    rationCardNumber: '',
    oamdcNumber: '',
    
    // Study Details (last 7 years)
    studyDetails: [
      { className: '', placeOfStudy: '', institutionName: '' }
    ],
    
    // Meeseva Details
    meesevaDetails: {
      casteCertificate: '',
      incomeCertificate: ''
    }
  });

  const [sameAddress, setSameAddress] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    console.log('🚀 ApplicationFormPage mounted');
    fetchPrograms();
    
    // If editing, fetch application data
    if (id) {
      console.log('📝 Editing mode - fetching application:', id);
      fetchApplicationById(id);
    }
  }, [id]);

  // Update form data when currentApplication changes
  useEffect(() => {
    if (currentApplication && id) {
      console.log('📋 Populating form with application data:', currentApplication);
      
      setFormData({
        programId: typeof currentApplication.programId === 'string' 
          ? currentApplication.programId 
          : currentApplication.programId._id,
        academicYear: currentApplication.academicYear,
        
        // Personal Information
        studentName: currentApplication.studentName || '',
        fatherName: currentApplication.fatherName || '',
        motherName: currentApplication.motherName || '',
        dateOfBirth: currentApplication.dateOfBirth 
          ? new Date(currentApplication.dateOfBirth).toISOString().split('T')[0] 
          : '',
        gender: currentApplication.gender || '',
        aadharNumber: currentApplication.aadharNumber || '',
        mobileNumber: currentApplication.mobileNumber || '',
        parentMobile: currentApplication.parentMobile || '',
        guardianMobile: currentApplication.guardianMobile || '',
        email: currentApplication.email || '',
        religion: currentApplication.religion || '',
        caste: currentApplication.caste || '',
        reservationCategory: currentApplication.reservationCategory || 'OC',
        isPhysicallyHandicapped: Boolean(currentApplication.isPhysicallyHandicapped),
        specialReservation: currentApplication.specialReservation || '',
        
        // Intermediate Details
        interBoard: currentApplication.interBoard || '',
        interHallTicketNumber: currentApplication.interHallTicketNumber || '',
        sscHallTicketNumber: currentApplication.sscHallTicketNumber || '',
        interPassYear: currentApplication.interPassYear ? currentApplication.interPassYear.toString() : '',
        interPassoutType: currentApplication.interPassoutType || '',
        bridgeCourse: currentApplication.bridgeCourse || '',
        interCourseName: currentApplication.interCourseName || '',
        interMedium: currentApplication.interMedium || '',
        interSecondLanguage: currentApplication.interSecondLanguage || '',
        interMarksSecured: currentApplication.interMarksSecured ? currentApplication.interMarksSecured.toString() : '',
        interMaximumMarks: currentApplication.interMaximumMarks ? currentApplication.interMaximumMarks.toString() : '',
        interLanguagesTotal: currentApplication.interLanguagesTotal ? currentApplication.interLanguagesTotal.toString() : '',
        interLanguagesPercentage: currentApplication.interLanguagesPercentage ? currentApplication.interLanguagesPercentage.toString() : '',
        interGroupSubjectsPercentage: currentApplication.interGroupSubjectsPercentage ? currentApplication.interGroupSubjectsPercentage.toString() : '',
        interCollegeName: currentApplication.interCollegeName || '',
        
        // Address
        presentAddress: {
          doorNo: currentApplication.presentAddress?.doorNo || '',
          street: currentApplication.presentAddress?.street || '',
          village: currentApplication.presentAddress?.village || '',
          mandal: currentApplication.presentAddress?.mandal || '',
          district: currentApplication.presentAddress?.district || '',
          pincode: currentApplication.presentAddress?.pincode || ''
        },
        permanentAddress: {
          doorNo: currentApplication.permanentAddress?.doorNo || '',
          street: currentApplication.permanentAddress?.street || '',
          village: currentApplication.permanentAddress?.village || '',
          mandal: currentApplication.permanentAddress?.mandal || '',
          district: currentApplication.permanentAddress?.district || '',
          pincode: currentApplication.permanentAddress?.pincode || ''
        },
        
        // Additional Information
        identificationMarks: currentApplication.identificationMarks && currentApplication.identificationMarks.length > 0 
          ? [...currentApplication.identificationMarks, '', ''].slice(0, 2) // Ensure we have exactly 2 slots
          : ['', ''],
        sadaramNumber: currentApplication.sadaramNumber || '',
        rationCardNumber: currentApplication.rationCardNumber || '',
        oamdcNumber: currentApplication.oamdcNumber || '',
        
        // Study Details
        studyDetails: currentApplication.studyDetails && currentApplication.studyDetails.length > 0 
          ? currentApplication.studyDetails 
          : [{ className: '', placeOfStudy: '', institutionName: '' }],
        
        // Meeseva Details
        meesevaDetails: {
          casteCertificate: currentApplication.meesevaDetails?.casteCertificate || '',
          incomeCertificate: currentApplication.meesevaDetails?.incomeCertificate || ''
        }
      });
    }
  }, [currentApplication, id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    console.log(`📝 Input change: ${name} = ${type === 'checkbox' ? checked : value}`);
    
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

  const handleArrayChange = (index: number, field: string, value: string) => {
    if (field === 'identificationMarks') {
      const newMarks = [...formData.identificationMarks];
      newMarks[index] = value;
      setFormData(prev => ({ ...prev, identificationMarks: newMarks }));
    }
  };

  const handleStudyDetailsChange = (index: number, field: string, value: string) => {
    const newStudyDetails = [...formData.studyDetails];
    newStudyDetails[index] = { ...newStudyDetails[index], [field]: value };
    setFormData(prev => ({ ...prev, studyDetails: newStudyDetails }));
  };

  const addStudyDetail = () => {
    setFormData(prev => ({
      ...prev,
      studyDetails: [...prev.studyDetails, { className: '', placeOfStudy: '', institutionName: '' }]
    }));
  };

  const removeStudyDetail = (index: number) => {
    if (formData.studyDetails.length > 1) {
      const newStudyDetails = formData.studyDetails.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, studyDetails: newStudyDetails }));
    }
  };

  const copyPresentToPermanent = () => {
    setFormData(prev => ({
      ...prev,
      permanentAddress: { ...prev.presentAddress }
    }));
    setSameAddress(true);
  };

  const validateForm = () => {
    const requiredFields = [
      'programId', 'academicYear', 'studentName', 'fatherName', 'motherName',
      'dateOfBirth', 'gender', 'mobileNumber', 'email'
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    return true;
  };

  const prepareFormDataForSubmission = () => {
    console.log('📤 Preparing form data for submission...');
    
    const submissionData = {
      ...formData,
      // Convert string numbers to actual numbers where needed
      interPassYear: formData.interPassYear ? parseInt(formData.interPassYear) : undefined,
      interMarksSecured: formData.interMarksSecured ? parseInt(formData.interMarksSecured) : undefined,
      interMaximumMarks: formData.interMaximumMarks ? parseInt(formData.interMaximumMarks) : undefined,
      interLanguagesTotal: formData.interLanguagesTotal ? parseInt(formData.interLanguagesTotal) : undefined,
      interLanguagesPercentage: formData.interLanguagesPercentage ? parseFloat(formData.interLanguagesPercentage) : undefined,
      interGroupSubjectsPercentage: formData.interGroupSubjectsPercentage ? parseFloat(formData.interGroupSubjectsPercentage) : undefined,
      
      // Filter out empty identification marks
      identificationMarks: formData.identificationMarks.filter(mark => mark && mark.trim()),
      
      // Filter out empty study details
      studyDetails: formData.studyDetails.filter(study => 
        study.className || study.placeOfStudy || study.institutionName
      )
    };
    
    console.log('📋 Submission data prepared:', JSON.stringify(submissionData, null, 2));
    return submissionData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      const submissionData = prepareFormDataForSubmission();
      
      if (id) {
        console.log('📝 Updating existing application...');
        await updateApplication(id, submissionData);
      } else {
        console.log('📝 Creating new application...');
        await createApplication(submissionData);
      }
      
      navigate('/applications');
    } catch (err) {
      console.error('❌ Failed to save application:', err);
      alert('Failed to save application. Please check the form and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!id) return;
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // First update with current form data
      const submissionData = prepareFormDataForSubmission();
      await updateApplication(id, submissionData);
      
      // Then submit the application
      await submitApplication(id);
      navigate('/applications');
    } catch (err) {
      console.error('❌ Failed to submit application:', err);
      alert('Failed to submit application. Please check the form and try again.');
    } finally {
      setSubmitting(false);
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
            disabled={saving || submitting}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          {id && currentApplication?.status === 'draft' && (
            <button
              type="button"
              onClick={handleSubmitApplication}
              disabled={saving || submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Application'}
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
              <label className="block text-sm font-medium text-gray-700">Student Name *</label>
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
              <label className="block text-sm font-medium text-gray-700">Father's Name *</label>
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
              <label className="block text-sm font-medium text-gray-700">Mother's Name *</label>
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
              <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
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
              <label className="block text-sm font-medium text-gray-700">Gender *</label>
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
              <label className="block text-sm font-medium text-gray-700">Aadhar Number</label>
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
              <label className="block text-sm font-medium text-gray-700">Mobile Number *</label>
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
              <label className="block text-sm font-medium text-gray-700">Email *</label>
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
              <label className="block text-sm font-medium text-gray-700">Parent's Mobile</label>
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
              <label className="block text-sm font-medium text-gray-700">Guardian's Mobile</label>
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

        {/* Intermediate/Education Details */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Education Details (Intermediate/+2)</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Board/University</label>
              <input
                type="text"
                name="interBoard"
                value={formData.interBoard}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Inter Board/University"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Inter Hall Ticket Number</label>
              <input
                type="text"
                name="interHallTicketNumber"
                value={formData.interHallTicketNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Inter hall ticket number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">SSC Hall Ticket Number</label>
              <input
                type="text"
                name="sscHallTicketNumber"
                value={formData.sscHallTicketNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="SSC hall ticket number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Inter Pass Year</label>
              <input
                type="number"
                name="interPassYear"
                value={formData.interPassYear}
                onChange={handleInputChange}
                min="2000"
                max="2030"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="YYYY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Passout Type</label>
              <select
                name="interPassoutType"
                value={formData.interPassoutType}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">Select type</option>
                <option value="Regular">Regular</option>
                <option value="Supplementary">Supplementary</option>
                <option value="Improvement">Improvement</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Course Name</label>
              <input
                type="text"
                name="interCourseName"
                value={formData.interCourseName}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., MPC, BiPC, CEC"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Medium of Instruction</label>
              <input
                type="text"
                name="interMedium"
                value={formData.interMedium}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="English/Telugu/Hindi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Second Language</label>
              <input
                type="text"
                name="interSecondLanguage"
                value={formData.interSecondLanguage}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Second language studied"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Marks Secured</label>
              <input
                type="number"
                name="interMarksSecured"
                value={formData.interMarksSecured}
                onChange={handleInputChange}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Total marks secured"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Maximum Marks</label>
              <input
                type="number"
                name="interMaximumMarks"
                value={formData.interMaximumMarks}
                onChange={handleInputChange}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Maximum marks"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Languages Total</label>
              <input
                type="number"
                name="interLanguagesTotal"
                value={formData.interLanguagesTotal}
                onChange={handleInputChange}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Total languages marks"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Languages Percentage</label>
              <input
                type="number"
                name="interLanguagesPercentage"
                value={formData.interLanguagesPercentage}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Languages percentage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Group Subjects Percentage</label>
              <input
                type="number"
                name="interGroupSubjectsPercentage"
                value={formData.interGroupSubjectsPercentage}
                onChange={handleInputChange}
                min="0"
                max="100"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Group subjects percentage"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">College Name</label>
              <input
                type="text"
                name="interCollegeName"
                value={formData.interCollegeName}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Name of intermediate college"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bridge Course</label>
              <input
                type="text"
                name="bridgeCourse"
                value={formData.bridgeCourse}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Bridge course details (if any)"
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Address Information</h2>
          
          {/* Present Address */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-700 mb-3">Present Address</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Door No.</label>
                <input
                  type="text"
                  name="presentAddress.doorNo"
                  value={formData.presentAddress.doorNo}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Street</label>
                <input
                  type="text"
                  name="presentAddress.street"
                  value={formData.presentAddress.street}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Village/Town</label>
                <input
                  type="text"
                  name="presentAddress.village"
                  value={formData.presentAddress.village}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mandal</label>
                <input
                  type="text"
                  name="presentAddress.mandal"
                  value={formData.presentAddress.mandal}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">District</label>
                <input
                  type="text"
                  name="presentAddress.district"
                  value={formData.presentAddress.district}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Pincode</label>
                <input
                  type="text"
                  name="presentAddress.pincode"
                  value={formData.presentAddress.pincode}
                  onChange={handleInputChange}
                  pattern="[0-9]{6}"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Permanent Address */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-medium text-gray-700">Permanent Address</h3>
              <button
                type="button"
                onClick={copyPresentToPermanent}
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Copy className="h-3 w-3 mr-1" />
                Same as Present
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Door No.</label>
                <input
                  type="text"
                  name="permanentAddress.doorNo"
                  value={formData.permanentAddress.doorNo}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Street</label>
                <input
                  type="text"
                  name="permanentAddress.street"
                  value={formData.permanentAddress.street}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Village/Town</label>
                <input
                  type="text"
                  name="permanentAddress.village"
                  value={formData.permanentAddress.village}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mandal</label>
                <input
                  type="text"
                  name="permanentAddress.mandal"
                  value={formData.permanentAddress.mandal}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">District</label>
                <input
                  type="text"
                  name="permanentAddress.district"
                  value={formData.permanentAddress.district}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Pincode</label>
                <input
                  type="text"
                  name="permanentAddress.pincode"
                  value={formData.permanentAddress.pincode}
                  onChange={handleInputChange}
                  pattern="[0-9]{6}"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reservation Details */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Reservation & Category Details</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Religion</label>
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
              <label className="block text-sm font-medium text-gray-700">Caste</label>
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
              <label className="block text-sm font-medium text-gray-700">Reservation Category *</label>
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
              <label className="block text-sm font-medium text-gray-700">Special Reservation</label>
              <input
                type="text"
                name="specialReservation"
                value={formData.specialReservation}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="CAP/SPORTS/NCC/etc."
              />
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

        {/* Additional Details */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Sadaram Number</label>
              <input
                type="text"
                name="sadaramNumber"
                value={formData.sadaramNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Sadaram number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ration Card Number</label>
              <input
                type="text"
                name="rationCardNumber"
                value={formData.rationCardNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Ration card number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">OAMDC Number</label>
              <input
                type="text"
                name="oamdcNumber"
                value={formData.oamdcNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="OAMDC number"
              />
            </div>
            
            {/* Identification Marks */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Identification Marks</label>
              <div className="space-y-2">
                {formData.identificationMarks.map((mark, index) => (
                  <input
                    key={index}
                    type="text"
                    value={mark}
                    onChange={(e) => handleArrayChange(index, 'identificationMarks', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder={`Identification mark ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Meeseva Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Caste Certificate (Meeseva)</label>
              <input
                type="text"
                name="meesevaDetails.casteCertificate"
                value={formData.meesevaDetails.casteCertificate}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Caste certificate number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Income Certificate (Meeseva)</label>
              <input
                type="text"
                name="meesevaDetails.incomeCertificate"
                value={formData.meesevaDetails.incomeCertificate}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Income certificate number"
              />
            </div>
          </div>
        </div>

        {/* Study History */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Study History (Last 7 Years)</h2>
            <button
              type="button"
              onClick={addStudyDetail}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Year
            </button>
          </div>
          <div className="space-y-4">
            {formData.studyDetails.map((study, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Study Detail {index + 1}</h4>
                  {formData.studyDetails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStudyDetail(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Class/Year</label>
                    <input
                      type="text"
                      value={study.className}
                      onChange={(e) => handleStudyDetailsChange(index, 'className', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="e.g., 12th, 11th, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Place of Study</label>
                    <input
                      type="text"
                      value={study.placeOfStudy}
                      onChange={(e) => handleStudyDetailsChange(index, 'placeOfStudy', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="City/Town"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Institution Name</label>
                    <input
                      type="text"
                      value={study.institutionName}
                      onChange={(e) => handleStudyDetailsChange(index, 'institutionName', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="School/College name"
                    />
                  </div>
                </div>
              </div>
            ))}
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
            disabled={saving || submitting || programsLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : (id ? 'Update' : 'Create')} Application
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationFormPage;