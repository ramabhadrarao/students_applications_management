// src/pages/ApplicationDetailsPage.tsx - Complete Enhanced View

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit2, 
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
  Send,
  ArrowLeft,
  GraduationCap,
  Home,
  FileCheck,
  Users,
  BookOpen,
  Star,
  Shield
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
  const [activeTab, setActiveTab] = useState('personal');
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

  const canEdit = () => {
    return user?.role === 'student' && 
           currentApplication?.userId === user._id && 
           ['draft', 'rejected'].includes(currentApplication?.status || '');
  };

  const getDocumentCompletionStatus = () => {
    const requiredProgramDocs = programRequirements.filter(req => req.isRequired && req.isActive);
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
                <BookOpen className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                {typeof currentApplication.programId === 'string' 
                  ? currentApplication.programId 
                  : currentApplication.programId?.programName}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Calendar className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                {currentApplication.submittedAt 
                  ? `Submitted: ${new Date(currentApplication.submittedAt).toLocaleDateString()}`
                  : `Created: ${new Date(currentApplication.dateCreated).toLocaleDateString()}`}
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

        {/* Status and Progress Display */}
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
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'personal', name: 'Personal Info', icon: User },
              { id: 'education', name: 'Education', icon: GraduationCap },
              { id: 'address', name: 'Address', icon: Home },
              { id: 'additional', name: 'Additional', icon: FileCheck },
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
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
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
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Father's Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{currentApplication.fatherName}</dd>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Mother's Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{currentApplication.motherName}</dd>
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
                    <dt className="text-sm font-medium text-gray-500">Gender</dt>
                    <dd className="mt-1 text-sm text-gray-900">{currentApplication.gender}</dd>
                  </div>
                </div>
                
                {currentApplication.aadharNumber && (
                  <div className="flex items-center space-x-3">
                    <FileCheck className="h-5 w-5 text-gray-400" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Aadhar Number</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentApplication.aadharNumber}</dd>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Mobile Number</dt>
                    <dd className="mt-1 text-sm text-gray-900">{currentApplication.mobileNumber}</dd>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{currentApplication.email}</dd>
                  </div>
                </div>
                
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

                {/* Reservation Details */}
                <div className="flex items-center space-x-3">
                  <Award className="h-5 w-5 text-gray-400" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Reservation Category</dt>
                    <dd className="mt-1 text-sm text-gray-900">{currentApplication.reservationCategory}</dd>
                  </div>
                </div>
                
                {currentApplication.religion && (
                  <div className="flex items-center space-x-3">
                    <Star className="h-5 w-5 text-gray-400" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Religion</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentApplication.religion}</dd>
                    </div>
                  </div>
                )}
                
                {currentApplication.caste && (
                  <div className="flex items-center space-x-3">
                    <Star className="h-5 w-5 text-gray-400" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Caste</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentApplication.caste}</dd>
                    </div>
                  </div>
                )}

                {currentApplication.isPhysicallyHandicapped && (
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-orange-400" />
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Physically Handicapped</dt>
                      <dd className="mt-1 text-sm text-orange-600 font-medium">Yes</dd>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Education Tab */}
          {activeTab === 'education' && (
            <div className="space-y-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Education Details
              </h3>
              
              {/* Intermediate Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-blue-900 mb-3">Intermediate/+2 Details</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {currentApplication.interBoard && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Board/University</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentApplication.interBoard}</dd>
                    </div>
                  )}
                  
                  {currentApplication.interHallTicketNumber && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Inter Hall Ticket</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentApplication.interHallTicketNumber}</dd>
                    </div>
                  )}
                  
                  {currentApplication.sscHallTicketNumber && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">SSC Hall Ticket</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentApplication.sscHallTicketNumber}</dd>
                    </div>
                  )}
                  
                  {currentApplication.interPassYear && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Pass Year</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentApplication.interPassYear}</dd>
                    </div>
                  )}
                  
                  {currentApplication.interPassoutType && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Passout Type</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentApplication.interPassoutType}</dd>
                    </div>
                  )}
                  
                  {currentApplication.interCourseName && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Course</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentApplication.interCourseName}</dd>
                    </div>
                  )}
                  
                  {currentApplication.interMedium && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Medium</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentApplication.interMedium}</dd>
                    </div>
                  )}
                  
                  {currentApplication.interSecondLanguage && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Second Language</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentApplication.interSecondLanguage}</dd>
                    </div>
                  )}
                  
                  {currentApplication.interCollegeName && (
                    <div className="sm:col-span-2 lg:col-span-3">
                      <dt className="text-sm font-medium text-gray-500">College Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{currentApplication.interCollegeName}</dd>
                    </div>
                  )}
                </div>

                {/* Marks Details */}
                {(currentApplication.interMarksSecured || currentApplication.interMaximumMarks || 
                  currentApplication.interLanguagesPercentage || currentApplication.interGroupSubjectsPercentage) && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-blue-800 mb-2">Marks & Percentage</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {currentApplication.interMarksSecured && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500">Marks Secured</dt>
                          <dd className="mt-1 text-sm text-gray-900">{currentApplication.interMarksSecured}</dd>
                        </div>
                      )}
                      
                      {currentApplication.interMaximumMarks && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500">Maximum Marks</dt>
                          <dd className="mt-1 text-sm text-gray-900">{currentApplication.interMaximumMarks}</dd>
                        </div>
                      )}
                      
                      {currentApplication.interLanguagesPercentage && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500">Languages %</dt>
                          <dd className="mt-1 text-sm text-gray-900">{currentApplication.interLanguagesPercentage}%</dd>
                        </div>
                      )}
                      
                      {currentApplication.interGroupSubjectsPercentage && (
                        <div>
                          <dt className="text-xs font-medium text-gray-500">Group Subjects %</dt>
                          <dd className="mt-1 text-sm text-gray-900">{currentApplication.interGroupSubjectsPercentage}%</dd>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentApplication.bridgeCourse && (
                  <div className="mt-4">
                    <dt className="text-sm font-medium text-gray-500">Bridge Course</dt>
                    <dd className="mt-1 text-sm text-gray-900">{currentApplication.bridgeCourse}</dd>
                  </div>
                )}
              </div>

              {/* Study History */}
              {currentApplication.studyDetails && currentApplication.studyDetails.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Study History (Last 7 Years)</h4>
                  <div className="space-y-3">
                    {currentApplication.studyDetails.map((study, index) => (
                      study.className || study.placeOfStudy || study.institutionName ? (
                        <div key={index} className="bg-white rounded-md p-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {study.className && (
                              <div>
                                <dt className="text-xs font-medium text-gray-500">Class/Year</dt>
                                <dd className="text-sm text-gray-900">{study.className}</dd>
                              </div>
                            )}
                            {study.placeOfStudy && (
                              <div>
                                <dt className="text-xs font-medium text-gray-500">Place</dt>
                                <dd className="text-sm text-gray-900">{study.placeOfStudy}</dd>
                              </div>
                            )}
                            {study.institutionName && (
                              <div>
                                <dt className="text-xs font-medium text-gray-500">Institution</dt>
                                <dd className="text-sm text-gray-900">{study.institutionName}</dd>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Address Tab */}
          {activeTab === 'address' && (
            <div className="space-y-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Address Information
              </h3>
              
              {/* Present Address */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-blue-900 mb-3 flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  Present Address
                </h4>
                {currentApplication.presentAddress && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.entries(currentApplication.presentAddress).map(([key, value]) => 
                      value ? (
                        <div key={key}>
                          <dt className="text-xs font-medium text-gray-500 capitalize">
                            {key === 'doorNo' ? 'Door No.' : key}
                          </dt>
                          <dd className="text-sm text-gray-900">{value}</dd>
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </div>

              {/* Permanent Address */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-green-900 mb-3 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Permanent Address
                </h4>
                {currentApplication.permanentAddress && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Object.entries(currentApplication.permanentAddress).map(([key, value]) => 
                      value ? (
                        <div key={key}>
                          <dt className="text-xs font-medium text-gray-500 capitalize">
                            {key === 'doorNo' ? 'Door No.' : key}
                          </dt>
                          <dd className="text-sm text-gray-900">{value}</dd>
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Information Tab */}
          {activeTab === 'additional' && (
            <div className="space-y-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Additional Information
              </h3>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Government Numbers */}
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-yellow-900 mb-3">Government Numbers</h4>
                  <div className="space-y-3">
                    {currentApplication.sadaramNumber && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Sadaram Number</dt>
                        <dd className="mt-1 text-sm text-gray-900">{currentApplication.sadaramNumber}</dd>
                      </div>
                    )}
                    
                    {currentApplication.rationCardNumber && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Ration Card Number</dt>
                        <dd className="mt-1 text-sm text-gray-900">{currentApplication.rationCardNumber}</dd>
                      </div>
                    )}
                    
                    {currentApplication.oamdcNumber && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">OAMDC Number</dt>
                        <dd className="mt-1 text-sm text-gray-900">{currentApplication.oamdcNumber}</dd>
                      </div>
                    )}
                  </div>
                </div>

                {/* Special Categories */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-purple-900 mb-3">Special Categories</h4>
                  <div className="space-y-3">
                    {currentApplication.specialReservation && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Special Reservation</dt>
                        <dd className="mt-1 text-sm text-gray-900">{currentApplication.specialReservation}</dd>
                      </div>
                    )}
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Physically Handicapped</dt>
                      <dd className={`mt-1 text-sm font-medium ${currentApplication.isPhysicallyHandicapped ? 'text-orange-600' : 'text-green-600'}`}>
                        {currentApplication.isPhysicallyHandicapped ? 'Yes' : 'No'}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identification Marks */}
              {currentApplication.identificationMarks && currentApplication.identificationMarks.some(mark => mark) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Identification Marks</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {currentApplication.identificationMarks
                      .filter(mark => mark)
                      .map((mark, index) => (
                        <li key={index} className="text-sm text-gray-900">{mark}</li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Meeseva Details */}
              {(currentApplication.meesevaDetails?.casteCertificate || currentApplication.meesevaDetails?.incomeCertificate) && (
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-indigo-900 mb-3">Meeseva Certificate Details</h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {currentApplication.meesevaDetails?.casteCertificate && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Caste Certificate</dt>
                        <dd className="mt-1 text-sm text-gray-900">{currentApplication.meesevaDetails.casteCertificate}</dd>
                      </div>
                    )}
                    
                    {currentApplication.meesevaDetails?.incomeCertificate && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Income Certificate</dt>
                        <dd className="mt-1 text-sm text-gray-900">{currentApplication.meesevaDetails.incomeCertificate}</dd>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Documents & Verification
                </h3>
                <Link
                  to={`/applications/${id}/documents`}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Manage Documents
                </Link>
              </div>

              {/* Document Progress Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{docStatus.required}</p>
                    <p className="text-sm text-gray-500">Required</p>
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

              {/* Quick Document List */}
              <div className="space-y-3">
                {programRequirements.filter(req => req.isRequired).map((requirement) => {
                  const document = documents.find(doc => doc.certificateTypeId._id === requirement.certificateTypeId._id);
                  
                  return (
                    <div key={requirement._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          document ? (document.isVerified ? 'bg-green-500' : 'bg-yellow-500') : 'bg-red-500'
                        }`}></div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{requirement.certificateTypeId.name}</h4>
                          {document && (
                            <p className="text-xs text-gray-500">
                              Uploaded: {new Date(document.dateCreated).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        document ? (document.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800') : 'bg-red-100 text-red-800'
                      }`}>
                        {document ? (document.isVerified ? 'Verified' : 'Pending') : 'Missing'}
                      </span>
                    </div>
                  );
                })}
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

      {/* Admin Actions */}
      {(user?.role === 'admin' || user?.role === 'program_admin') && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
            Admin Actions
          </h3>
          
          <div className="flex flex-wrap gap-3">
            {currentApplication.status === 'submitted' && (
              <>
                <button
                  onClick={() => openApprovalModal('approved')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </button>
                <button
                  onClick={() => openApprovalModal('rejected')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </button>
                <button
                  onClick={() => handleStatusChange('under_review', 'Moved to detailed review')}
                  className="inline-flex items-center px-4 py-2 border border-purple-300 rounded-md shadow-sm text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Move to Review
                </button>
              </>
            )}
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
                    approvalForm.status === 'approved' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {approvalForm.status === 'approved' ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {approvalForm.status === 'approved' ? 'Approve' : 'Reject'} Application
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to {approvalForm.status} this application? This action will notify the student.
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
                        placeholder={`Please provide reason for ${approvalForm.status}...`}
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