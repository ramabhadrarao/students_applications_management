import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit2, 
  Download,
  History
} from 'lucide-react';
import useApplicationStore from '../stores/applicationStore';
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

  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (id) {
      fetchApplicationById(id);
      fetchApplicationHistory(id);
    }
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateApplication(id, {
        status: newStatus,
        reviewedBy: user._id,
        reviewedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
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
                <FileText className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                {currentApplication.programId?.programName}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Clock className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                Submitted: {new Date(currentApplication.submittedAt || currentApplication.dateCreated).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            {user?.role === 'student' && currentApplication.status === 'draft' && (
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

        {/* Status Badge */}
        <div className="mt-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            currentApplication.status === 'approved' ? 'bg-green-100 text-green-800' :
            currentApplication.status === 'rejected' ? 'bg-red-100 text-red-800' :
            currentApplication.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
            currentApplication.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {currentApplication.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Application Details */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Student Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{currentApplication.studentName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{currentApplication.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Mobile Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{currentApplication.mobileNumber}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(currentApplication.dateOfBirth).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Father's Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{currentApplication.fatherName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Mother's Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{currentApplication.motherName}</dd>
            </div>
          </div>
        </div>
      </div>

      {/* Status History */}
      {showHistory && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Status History
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
        </div>
      )}

      {/* Admin Actions */}
      {(user?.role === 'admin' || user?.role === 'program_admin') && 
       currentApplication.status === 'submitted' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Review Actions
            </h3>
            <div className="flex space-x-3">
              <button
                onClick={() => handleStatusChange('approved')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </button>
              <button
                onClick={() => handleStatusChange('rejected')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetailsPage;