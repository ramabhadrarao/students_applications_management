// File: src/pages/ApplicationDetailsPage.tsx
// Purpose: Complete application view with ENHANCED admin actions and status management

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit2, 
  Download,
  History,
  Upload,
  AlertTriangle,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Award,
  Eye,
  MessageSquare,
  Send,
  ArrowLeft
} from 'lucide-react';
import useApplicationStore from '../stores/applicationStore';
import useApplicationDocumentStore from '../stores/applicationDocumentStore';
import useProgramCertificateRequirementStore from '../stores/programCertificateRequirementStore';
import useAuthStore from '../stores/authStore';

const ApplicationDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    currentApplication, 
    applicationHistory,
    loading, 
    error, 
    fetchApplicationById,
    fetchApplicationHistory,
    updateApplication 
  } = useApplicationStore();

  const {
    documents,
    verificationStatus,
    fetchApplicationDocuments,
    getDocumentVerificationStatus
  } = useApplicationDocumentStore();

  const { 
    requirements: programRequirements, 
    fetchProgramRequirements 
  } = useProgramCertificateRequirementStore();

  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [approvalModal, setApprovalModal] = useState(false);
  const [approvalForm, setApprovalForm] = useState({
    status: '',
    comments: ''
  });

  useEffect(() => {
    if (id) {
      fetchApplicationById(id);
      fetchApplicationHistory(id);
      fetchApplicationDocuments(id);
      getDocumentVerificationStatus(id);
    }
  }, [id]);

  useEffect(() => {
    if (currentApplication?.programId) {
      const programId = typeof currentApplication.programId === 'string' 
        ? currentApplication.programId 
        : currentApplication.programId._id;
      
      if (programId) {
        fetchProgramRequirements(programId);
      }
    }
  }, [currentApplication?.programId]);

  const handleStatusChange = async (newStatus: string, comments: string = '') => {
    try {
      await updateApplication(id!, {
        status: newStatus,
        approvalComments: comments,
        reviewedBy: user?._id,
        reviewedAt: new Date().toISOString()
      });
      setApprovalModal(false);
      setApprovalForm({ status: '', comments: '' });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const openApprovalModal = (status: string) => {
    setApprovalForm({ status, comments: '' });
    setApprovalModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'under_review': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'under_review': return <Clock className="h-5 w-5 text-purple-600" />;
      case 'submitted': return <Send className="h-5 w-5 text-blue-600" />;
      case 'draft': return <FileText className="h-5 w-5 text-gray-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Application is in draft mode. Student can make changes and submit when ready.';
      case 'submitted':
        return 'Application has been submitted by the student and is awaiting initial review.';
      case 'under_review':
        return 'Application is currently under detailed review by administrators.';
      case 'approved':
        return 'Application has been approved. Student has been notified of acceptance.';
      case 'rejected':
        return 'Application has been rejected. Student has been notified with reasons.';
      default:
        return 'Application status information.';
    }
  };

  const getRequiredDocumentsForProgram = () => {
    return programRequirements.filter(req => req.isRequired && req.isActive);
  };

  const getDocumentCompletionStatus = () => {
    const requiredProgramDocs = getRequiredDocumentsForProgram();
    const submittedDocs = documents.filter(doc => 
      requiredProgramDocs.some(req => req.certificateTypeId._id === doc.certificateTypeId._id)
    );
    const verifiedDocs = submittedDocs.filter(doc => doc.isVerified);
    
    return {
      required: requiredProgramDocs.length,
      submitted: submittedDocs.length,
      verified: verifiedDocs.length,
      completionPercentage: requiredProgramDocs.length > 0 ? 
        Math.round((submittedDocs.length / requiredProgramDocs.length) * 100) : 100,
      verificationPercentage: submittedDocs.length > 0 ? 
        Math.round((verifiedDocs.length / submittedDocs.length) * 100) : 0
    };
  };

  const canApprove = () => {
    if (user?.role !== 'admin' && user?.role !== 'program_admin') return false;
    if (currentApplication?.status !== 'submitted' && currentApplication?.status !== 'under_review') return false;
    
    const docStatus = getDocumentCompletionStatus();
    return docStatus.completionPercentage === 100 && docStatus.verificationPercentage === 100;
  };

  const canEdit = () => {
    return user?.role === 'student' && 
           currentApplication?.userId === user._id && 
           ['draft', 'rejected'].includes(currentApplication?.status || '');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 p-4 rounded-md text-red-800">
        {error}
      </div>
    );
  }

  if (!currentApplication) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Application not found</h2>
        <p className="mt-2 text-gray-600">The application you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link
          to="/applications"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Back to Applications
        </Link>
      </div>
    );
  }

  const docStatus = getDocumentCompletionStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg px-4 py-5 sm:p-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Application #{currentApplication.applicationNumber}
            </h2>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <User className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                {currentApplication.studentName}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <FileText className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                {typeof currentApplication.programId === 'string' 
                  ? currentApplication.programId 
                  : currentApplication.programId?.programName}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                Submitted: {new Date(currentApplication.submittedAt || currentApplication.dateCreated).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            {canEdit() && (
              <Link
                to={`/applications/${id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Link>
            )}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <History className="h-4 w-4 mr-2" />
              {showHistory ? 'Hide History' : 'Show History'}
            </button>
          </div>
        </div>

        {/* Status and Document Progress */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Application Status</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(currentApplication.status)}`}>
                  {currentApplication.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="flex-shrink-0">
                {getStatusIcon(currentApplication.status)}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Document Completion</p>
                <p className="text-2xl font-bold text-blue-600">{docStatus.completionPercentage}%</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${docStatus.completionPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {docStatus.submitted} of {docStatus.required} required documents
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Verification Progress</p>
                <p className="text-2xl font-bold text-green-600">{docStatus.verificationPercentage}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${docStatus.verificationPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {docStatus.verified} of {docStatus.submitted} documents verified
            </p>
          </div>
        </div>

        {/* Program-specific approval warning */}
        {(user?.role === 'admin' || user?.role === 'program_admin') && 
         currentApplication.status === 'submitted' && 
         docStatus.completionPercentage < 100 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Cannot Approve Yet - Program Requirements Not Met
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  All program-specific required documents must be uploaded and verified before this application can be approved.
                  Missing: {docStatus.required - docStatus.submitted} documents, 
                  Unverified: {docStatus.submitted - docStatus.verified} documents.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'details', name: 'Application Details', icon: FileText },
              { id: 'documents', name: 'Documents', icon: Upload, badge: documents.length },
              { id: 'history', name: 'History', icon: History }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
                {tab.badge && (
                  <span className="bg-gray-100 text-gray-900 rounded-full px-2.5 py-0.5 text-xs font-medium">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Application Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Student Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentApplication.studentName}</dd>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentApplication.email}</dd>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Mobile Number</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentApplication.mobileNumber}</dd>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(currentApplication.dateOfBirth).toLocaleDateString()}
                      </dd>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Father's Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentApplication.fatherName}</dd>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Mother's Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentApplication.motherName}</dd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  {currentApplication.parentMobile && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Parent's Mobile</dt>
                        <dd className="mt-1 text-sm text-gray-900">{currentApplication.parentMobile}</dd>
                      </div>
                    </div>
                  )}
                  
                  {currentApplication.guardianMobile && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Guardian's Mobile</dt>
                        <dd className="mt-1 text-sm text-gray-900">{currentApplication.guardianMobile}</dd>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reservation Details */}
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Reservation Details
                </h3>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
                  <div className="flex items-center space-x-3">
                    <Award className="h-5 w-5 text-gray-400" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Category</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentApplication.reservationCategory}</dd>
                    </div>
                  </div>
                  
                  {currentApplication.religion && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Religion</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentApplication.religion}</dd>
                    </div>
                  )}
                  
                  {currentApplication.caste && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Caste</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentApplication.caste}</dd>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab with Program-Specific Requirements */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Program Required Documents
                </h3>
                {user?.role === 'student' && (
                  <Link
                    to={`/applications/${id}/documents`}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Manage Documents
                  </Link>
                )}
              </div>

              {/* Program Information */}
              {currentApplication.programId && typeof currentApplication.programId === 'object' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800">
                    Program: {currentApplication.programId.programName} ({currentApplication.programId.programCode})
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    The documents below are specifically required for this program.
                  </p>
                </div>
              )}

              {/* Document Status Overview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{docStatus.required}</p>
                    <p className="text-sm text-gray-500">Required for Program</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{docStatus.submitted}</p>
                    <p className="text-sm text-gray-500">Submitted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{docStatus.verified}</p>
                    <p className="text-sm text-gray-500">Verified</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{docStatus.required - docStatus.submitted}</p>
                    <p className="text-sm text-gray-500">Missing</p>
                  </div>
                </div>
              </div>

              {/* Documents List - Program-Specific */}
              <div className="space-y-4">
                {getRequiredDocumentsForProgram().map((requirement) => {
                  const document = documents.find(doc => doc.certificateTypeId._id === requirement.certificateTypeId._id);
                  
                  return (
                    <div key={requirement._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-4 h-4 rounded-full ${
                            document ? (document.isVerified ? 'bg-green-500' : 'bg-yellow-500') : 'bg-red-500'
                          }`}></div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{requirement.certificateTypeId.name}</h4>
                            <p className="text-sm text-gray-500">{requirement.certificateTypeId.description}</p>
                            {requirement.specialInstructions && (
                              <p className="text-sm text-blue-600 mt-1">
                                <strong>Special Instructions:</strong> {requirement.specialInstructions}
                              </p>
                            )}
                            {document && (
                              <p className="text-xs text-gray-400 mt-1">
                                Uploaded: {new Date(document.dateCreated).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {document ? (
                            <>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                document.isVerified 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {document.isVerified ? 'Verified' : 'Pending Verification'}
                              </span>
                              {(user?.role === 'admin' || user?.role === 'program_admin') && (
                                <Link
                                  to={`/applications/${id}/documents/verify`}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  <Eye className="h-4 w-4" />
                                </Link>
                              )}
                            </>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              Not Uploaded
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {document?.verificationRemarks && (
                        <div className="mt-3 bg-blue-50 border border-blue-200 rounded p-3">
                          <p className="text-xs text-blue-800">
                            <strong>Admin Comment:</strong> {document.verificationRemarks}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {getRequiredDocumentsForProgram().length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No certificate requirements configured</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This program does not have any specific document requirements configured yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Application History
              </h3>
              
              <div className="flow-root">
                <ul className="-mb-8">
                  {applicationHistory.map((history, historyIdx) => (
                    <li key={history._id}>
                      <div className="relative pb-8">
                        {historyIdx !== applicationHistory.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                              history.toStatus === 'approved' ? 'bg-green-500' :
                              history.toStatus === 'rejected' ? 'bg-red-500' :
                              'bg-gray-500'
                            }`}>
                              {history.toStatus === 'approved' ? (
                                <CheckCircle className="h-5 w-5 text-white" />
                              ) : history.toStatus === 'rejected' ? (
                                <XCircle className="h-5 w-5 text-white" />
                              ) : (
                                <Clock className="h-5 w-5 text-white" />
                              )}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                Status changed to{' '}
                                <span className="font-medium text-gray-900">
                                  {history.toStatus.replace('_', ' ').toUpperCase()}
                                </span>
                                {history.changedBy && (
                                  <> by {history.changedBy.email}</>
                                )}
                              </p>
                              {history.remarks && (
                                <p className="mt-1 text-sm text-gray-500">
                                  {history.remarks}
                                </p>
                              )}
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {new Date(history.dateCreated).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ENHANCED Admin Actions */}
      {(user?.role === 'admin' || user?.role === 'program_admin') && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
            Admin Actions & Status Management
          </h3>
          
          {/* Current Status Display */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getStatusIcon(currentApplication.status)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Current Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(currentApplication.status)}`}>
                    {currentApplication.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              {currentApplication.reviewedBy && currentApplication.reviewedAt && (
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    Last reviewed: {new Date(currentApplication.reviewedAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    By: {currentApplication.reviewedBy.email || 'System'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
              <p className="text-sm text-blue-800">
                {getStatusDescription(currentApplication.status)}
              </p>
            </div>
          </div>

          {/* Document Status Quick View */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Document Verification Status</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-blue-600">{docStatus.required}</p>
                <p className="text-xs text-gray-500">Required</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">{docStatus.submitted}</p>
                <p className="text-xs text-gray-500">Submitted</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-purple-600">{docStatus.verified}</p>
                <p className="text-xs text-gray-500">Verified</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-600">{docStatus.required - docStatus.submitted}</p>
                <p className="text-xs text-gray-500">Missing</p>
              </div>
            </div>
            
            <div className="mt-3 space-y-2">
              <div>
                <div className="flex justify-between text-xs">
                  <span>Completion: {docStatus.completionPercentage}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${docStatus.completionPercentage}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs">
                  <span>Verification: {docStatus.verificationPercentage}%</span>
                </div>
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${docStatus.verificationPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Status-specific Actions */}
          {currentApplication.status === 'draft' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-start">
                  <FileText className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Draft Application</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      This application is still in draft mode. The student can continue editing, or you can help move it forward in the process.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleStatusChange('submitted', 'Application submitted by admin on behalf of student')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Mark as Submitted
                </button>
                <button
                  onClick={() => openApprovalModal('under_review')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Move to Review
                </button>
                <button
                  onClick={() => openApprovalModal('rejected')}
                  className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject (Incomplete)
                </button>
              </div>
            </div>
          )}
          
          {currentApplication.status === 'submitted' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-start">
                  <Send className="h-5 w-5 text-yellow-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Submitted Application</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Application is ready for review. Verify all documents and information before making a decision.
                    </p>
                  </div>
                </div>
              </div>
              
              {canApprove() ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-sm text-green-800">
                      ✅ All requirements met. Application ready for approval.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => openApprovalModal('approved')}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Application
                    </button>
                    <button
                      onClick={() => openApprovalModal('rejected')}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Application
                    </button>
                    <button
                      onClick={() => handleStatusChange('under_review', 'Moved to detailed review for comprehensive evaluation')}
                      className="inline-flex items-center px-4 py-2 border border-purple-300 rounded-md shadow-sm text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Move to Detailed Review
                    </button>
                    <button
                      onClick={() => openApprovalModal('draft')}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Send to Draft
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Cannot Approve - Missing Requirements
                      </h3>
                      <p className="text-sm text-red-700 mt-1">
                        Complete document verification before approval is possible:
                      </p>
                      <ul className="text-sm text-red-700 mt-2 list-disc list-inside space-y-1">
                        <li>Missing Documents: {docStatus.required - docStatus.submitted}</li>
                        <li>Unverified Documents: {docStatus.submitted - docStatus.verified}</li>
                        <li>Completion Rate: {docStatus.completionPercentage}%</li>
                      </ul>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                          to={`/applications/${id}/documents/verify`}
                          className="inline-flex items-center text-sm bg-red-100 text-red-800 px-3 py-2 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Verify Documents →
                        </Link>
                        <button
                          onClick={() => openApprovalModal('rejected')}
                          className="inline-flex items-center text-sm bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject for Incomplete Docs
                        </button>
                        <button
                          onClick={() => handleStatusChange('under_review', 'Moved to review despite incomplete documentation for special consideration')}
                          className="inline-flex items-center text-sm bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Force Review
                        </button>
                        <button
                          onClick={() => openApprovalModal('draft')}
                          className="inline-flex items-center text-sm bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Send to Draft
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {currentApplication.status === 'under_review' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-purple-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-purple-800">Under Detailed Review</h3>
                    <p className="text-sm text-purple-700 mt-1">
                      Application is being carefully examined by the review committee. All aspects are being evaluated.
                    </p>
                  </div>
                </div>
              </div>
              
              {canApprove() ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-sm text-green-800">
                      ✅ Review complete. All requirements satisfied for final decision.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => openApprovalModal('approved')}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve After Review
                    </button>
                    <button
                      onClick={() => openApprovalModal('rejected')}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject After Review
                    </button>
                    <button
                      onClick={() => handleStatusChange('submitted', 'Moved back to submitted status for additional documentation or clarification')}
                      className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Submitted
                    </button>
                    <button
                      onClick={() => openApprovalModal('draft')}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Send to Draft
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Review Prerequisites Not Met</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Complete document verification before making final decision.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <Link
                          to={`/applications/${id}/documents/verify`}
                          className="inline-flex items-center text-sm text-yellow-800 bg-yellow-100 px-3 py-2 rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Complete Verification →
                        </Link>
                        <button
                          onClick={() => handleStatusChange('submitted', 'Returned to submitted for additional documentation')}
                          className="inline-flex items-center text-sm text-blue-700 bg-blue-100 px-3 py-2 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Return to Submitted
                        </button>
                        <button
                          onClick={() => openApprovalModal('draft')}
                          className="inline-flex items-center text-sm text-gray-700 bg-gray-100 px-3 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Send to Draft
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {currentApplication.status === 'approved' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Application Approved</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Student has been accepted and notified. 
                      {currentApplication.approvalComments && (
                        <span className="block mt-2 font-medium">
                          Approval Comments: "{currentApplication.approvalComments}"
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Use caution when changing status of approved applications. Student has been notified of acceptance.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => openApprovalModal('rejected')}
                  className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Revoke Approval
                </button>
                <button
                  onClick={() => handleStatusChange('under_review', 'Moved back to review for reconsideration due to new information')}
                  className="inline-flex items-center px-3 py-2 border border-purple-300 rounded-md shadow-sm text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Reopen for Review
                </button>
              </div>
            </div>
          )}
          
          {currentApplication.status === 'rejected' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-start">
                  <XCircle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Application Rejected</h3>
                    <p className="text-sm text-red-700 mt-1">
                      Student has been notified of rejection. 
                      {currentApplication.approvalComments && (
                        <span className="block mt-2 font-medium">
                          Rejection Reason: "{currentApplication.approvalComments}"
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  💡 Rejected applications can be reconsidered if new information becomes available or errors are discovered.
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => openApprovalModal('approved')}
                  className="inline-flex items-center px-3 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Reverse to Approved
                </button>
                <button
                  onClick={() => handleStatusChange('under_review', 'Reopened for reconsideration based on appeal or new information')}
                  className="inline-flex items-center px-3 py-2 border border-purple-300 rounded-md shadow-sm text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Reopen for Review
                </button>
                <button
                  onClick={() => handleStatusChange('submitted', 'Moved back to submitted for re-evaluation with corrected information')}
                  className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Submitted
                </button>
              </div>
            </div>
          )}
          
          {/* Additional Admin Tools */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Additional Admin Tools</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Document Management</h5>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/applications/${id}/documents`}
                    className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md shadow-sm text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Manage Documents
                  </Link>
                  <Link
                    to={`/applications/${id}/documents/verify`}
                    className="inline-flex items-center px-3 py-2 border border-purple-300 rounded-md shadow-sm text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Verify Documents
                  </Link>
                </div>
              </div>
              
              <div className="space-y-3">
                <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Application History</h5>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <History className="h-3 w-3 mr-1" />
                    {showHistory ? 'Hide History' : 'View History'}
                  </button>
                  <button
                    onClick={() => {/* Add audit log functionality */}}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Audit Trail
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Stats Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Last Updated: {new Date(currentApplication.dateUpdated).toLocaleString()}
              </span>
              <span>
                Application #{currentApplication.applicationNumber}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {approvalModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                    approvalForm.status === 'approved' ? 'bg-green-100' : 
                    approvalForm.status === 'rejected' ? 'bg-red-100' :
                    approvalForm.status === 'draft' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {approvalForm.status === 'approved' ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : approvalForm.status === 'rejected' ? (
                      <XCircle className="h-6 w-6 text-red-600" />
                    ) : approvalForm.status === 'draft' ? (
                      <Edit2 className="h-6 w-6 text-blue-600" />
                    ) : (
                      <FileText className="h-6 w-6 text-gray-600" />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {approvalForm.status === 'approved' ? 'Approve' : 
                       approvalForm.status === 'rejected' ? 'Reject' : 
                       approvalForm.status === 'draft' ? 'Send to Draft' : 'Update'} Application
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {approvalForm.status === 'draft' ? (
                          'Are you sure you want to send this application back to draft? The student will be able to edit and resubmit.'
                        ) : (
                          `Are you sure you want to ${approvalForm.status} this application? This action will notify the student and cannot be easily undone.`
                        )}
                      </p>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Comments (required)
                      </label>
                      <textarea
                        value={approvalForm.comments}
                        onChange={(e) => setApprovalForm(prev => ({ ...prev, comments: e.target.value }))}
                        rows={3}
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder={`Please provide reason for ${approvalForm.status === 'draft' ? 'sending to draft' : approvalForm.status}...`}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => handleStatusChange(approvalForm.status, approvalForm.comments)}
                  disabled={!approvalForm.comments.trim()}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 ${
                    approvalForm.status === 'approved' 
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  }`}
                >
                  {approvalForm.status === 'approved' ? 'Approve' : 'Reject'}
                </button>
                <button
                  onClick={() => setApprovalModal(false)}
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

export default ApplicationDetailsPage;