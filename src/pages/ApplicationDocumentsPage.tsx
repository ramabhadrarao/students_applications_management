import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Download, 
  Trash2,
  ArrowLeft 
} from 'lucide-react';
import useApplicationDocumentStore from '../stores/applicationDocumentStore';
import useApplicationStore from '../stores/applicationStore';
import useProgramCertificateRequirementStore from '../stores/programCertificateRequirementStore';
import useFileUploadStore from '../stores/fileUploadStore';
import useAuthStore from '../stores/authStore';

const ApplicationDocumentsPageUpdated = () => {
  const { applicationId } = useParams();
  const { user } = useAuthStore();
  const { 
    documents, 
    verificationStatus, 
    loading, 
    error, 
    fetchApplicationDocuments,
    getDocumentVerificationStatus,
    addApplicationDocument,
    deleteApplicationDocument
  } = useApplicationDocumentStore();
  
  const { currentApplication, fetchApplicationById } = useApplicationStore();
  const { requirements, fetchProgramRequirements } = useProgramCertificateRequirementStore();
  const { uploadFile, uploading } = useFileUploadStore();
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    certificateTypeId: '',
    file: null as File | null,
    description: ''
  });

  useEffect(() => {
    if (applicationId) {
      fetchApplicationDocuments(applicationId);
      getDocumentVerificationStatus(applicationId);
      fetchApplicationById(applicationId);
    }
  }, [applicationId]);

  // Fetch program requirements when application is loaded
  useEffect(() => {
    if (currentApplication?.programId) {
      fetchProgramRequirements(currentApplication.programId);
    }
  }, [currentApplication]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadForm(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.certificateTypeId || !applicationId) return;

    try {
      // First upload the file
      const fileUpload = await uploadFile(uploadForm.file, uploadForm.description);
      
      // Then link it to the application
      await addApplicationDocument(applicationId, {
        certificateTypeId: uploadForm.certificateTypeId,
        fileUploadId: fileUpload._id,
        documentName: uploadForm.file.name,
        remarks: uploadForm.description
      });
      
      // Reset form and close modal
      setUploadForm({ certificateTypeId: '', file: null, description: '' });
      setShowUploadModal(false);
      
      // Refresh data
      fetchApplicationDocuments(applicationId);
      getDocumentVerificationStatus(applicationId);
    } catch (err) {
      console.error('Failed to upload document:', err);
    }
  };

  const handleDelete = async (documentId: string, documentName: string) => {
    if (!applicationId) return;
    
    if (window.confirm(`Are you sure you want to delete "${documentName}"?`)) {
      try {
        await deleteApplicationDocument(applicationId, documentId);
        fetchApplicationDocuments(applicationId);
        getDocumentVerificationStatus(applicationId);
      } catch (err) {
        console.error('Failed to delete document:', err);
      }
    }
  };

  const getStatusIcon = (isVerified: boolean) => {
    return isVerified ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertCircle className="h-5 w-5 text-yellow-500" />
    );
  };

  // ✅ UPDATED: Get program-specific requirements instead of all certificate types
  const getRequiredCertificateTypes = () => {
    return requirements.filter(req => req.isRequired && req.isActive);
  };

  // ✅ UPDATED: Get available certificate types for upload (program-specific)
  const getAvailableCertificateTypes = () => {
    return requirements.filter(req => req.isActive);
  };

  const getUploadedDocumentTypes = () => {
    return documents.map(doc => doc.certificateTypeId._id);
  };

  const getMissingRequiredDocuments = () => {
    const uploadedTypes = getUploadedDocumentTypes();
    return getRequiredCertificateTypes().filter(req => 
      !uploadedTypes.includes(req.certificateTypeId._id)
    );
  };

  // ✅ UPDATED: Calculate verification status based on program requirements
  const getCustomVerificationStatus = () => {
    const requiredDocs = getRequiredCertificateTypes();
    const uploadedDocs = documents;
    const verifiedDocs = documents.filter(doc => doc.isVerified);
    
    const missingRequired = getMissingRequiredDocuments();
    
    return {
      totalRequired: requiredDocs.length,
      totalSubmitted: uploadedDocs.length,
      totalVerified: verifiedDocs.length,
      missingDocuments: missingRequired,
      completionPercentage: requiredDocs.length > 0 ? 
        Math.round((uploadedDocs.length / requiredDocs.length) * 100) : 100,
      verificationPercentage: uploadedDocs.length > 0 ? 
        Math.round((verifiedDocs.length / uploadedDocs.length) * 100) : 0
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  const customVerificationStatus = getCustomVerificationStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link
            to={`/applications/${applicationId}`}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Application Documents</h1>
            {currentApplication && (
              <p className="text-sm text-gray-600 mt-1">
                {currentApplication.applicationNumber} - {currentApplication.programId?.programName}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </button>
      </div>

      {error && (
        <div className="bg-red-100 p-4 rounded-md text-red-800">
          {error}
        </div>
      )}

      {/* ✅ UPDATED: Document Verification Status based on program requirements */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Program Document Requirements</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-900">Required for Program</p>
                <p className="text-2xl font-bold text-blue-600">{customVerificationStatus.totalRequired}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-green-900">Verified</p>
                <p className="text-2xl font-bold text-green-600">{customVerificationStatus.totalVerified}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-yellow-900">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {customVerificationStatus.totalSubmitted - customVerificationStatus.totalVerified}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm">
              <span>Document Completion</span>
              <span>{customVerificationStatus.completionPercentage}%</span>
            </div>
            <div className="mt-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${customVerificationStatus.completionPercentage}%` }}
              ></div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm">
              <span>Verification Progress</span>
              <span>{customVerificationStatus.verificationPercentage}%</span>
            </div>
            <div className="mt-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${customVerificationStatus.verificationPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ UPDATED: Missing Required Documents Alert based on program requirements */}
      {customVerificationStatus.missingDocuments.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-400" />
            <h3 className="ml-2 text-sm font-medium text-red-800">
              Missing Required Documents for This Program
            </h3>
          </div>
          <div className="mt-2">
            <ul className="list-disc list-inside text-sm text-red-700">
              {customVerificationStatus.missingDocuments.map((req) => (
                <li key={req._id}>
                  {req.certificateTypeId.name}
                  {req.specialInstructions && ` - ${req.specialInstructions}`}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Uploaded Documents */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Documents</h3>
          
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents uploaded</h3>
              <p className="mt-1 text-sm text-gray-500">
                Upload your first document to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((document) => (
                <div key={document._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(document.isVerified)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900">
                          {document.certificateTypeId.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {document.documentName || document.fileUploadId.originalName}
                        </p>
                        <p className="text-xs text-gray-400">
                          Uploaded: {new Date(document.dateCreated).toLocaleDateString()}
                        </p>
                        {document.remarks && (
                          <p className="text-xs text-gray-600 mt-1">
                            Note: {document.remarks}
                          </p>
                        )}
                        {document.verificationRemarks && (
                          <p className="text-xs text-green-600 mt-1">
                            Admin: {document.verificationRemarks}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        document.isVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {document.isVerified ? 'Verified' : 'Pending'}
                      </span>
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => {
                            // Download functionality would go here
                            console.log('Download:', document.fileUploadId.uuid);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        
                        {(user?.role === 'student' && !document.isVerified) && (
                          <button
                            onClick={() => handleDelete(document._id, document.documentName)}
                            className="text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ✅ UPDATED: Upload Modal with program-specific certificate types */}
      {showUploadModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleUpload}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Upload Document
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Document Type *
                          </label>
                          <select
                            value={uploadForm.certificateTypeId}
                            onChange={(e) => setUploadForm(prev => ({ 
                              ...prev, 
                              certificateTypeId: e.target.value 
                            }))}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            <option value="">Select document type...</option>
                            {getAvailableCertificateTypes().map(req => (
                              <option key={req._id} value={req.certificateTypeId._id}>
                                {req.certificateTypeId.name} {req.isRequired && '(Required)'}
                                {req.specialInstructions && ` - ${req.specialInstructions}`}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            File *
                          </label>
                          <input
                            type="file"
                            onChange={handleFileSelect}
                            required
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Description (optional)
                          </label>
                          <textarea
                            value={uploadForm.description}
                            onChange={(e) => setUploadForm(prev => ({ 
                              ...prev, 
                              description: e.target.value 
                            }))}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="Additional notes about this document..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={uploading || !uploadForm.file || !uploadForm.certificateTypeId}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationDocumentsPageUpdated;