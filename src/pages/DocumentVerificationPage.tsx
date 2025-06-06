// File: src/pages/DocumentVerificationPage.tsx
// Purpose: Admin interface for document verification

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, FileText, Download, ArrowLeft, Eye } from 'lucide-react';
import useApplicationDocumentStore from '../stores/applicationDocumentStore';
import useApplicationStore from '../stores/applicationStore';
import useAuthStore from '../stores/authStore';

const DocumentVerificationPage = () => {
  const { applicationId } = useParams();
  const { user } = useAuthStore();
  const { 
    documents, 
    loading, 
    error, 
    fetchApplicationDocuments,
    verifyApplicationDocument 
  } = useApplicationDocumentStore();
  
  const { currentApplication, fetchApplicationById } = useApplicationStore();
  
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [verificationForm, setVerificationForm] = useState({
    isVerified: false,
    verificationRemarks: ''
  });

  useEffect(() => {
    if (applicationId) {
      fetchApplicationDocuments(applicationId);
      fetchApplicationById(applicationId);
    }
  }, [applicationId]);

  const handleVerify = async (documentId: string, isVerified: boolean) => {
    if (!applicationId) return;
    
    try {
      await verifyApplicationDocument(applicationId, documentId, {
        isVerified,
        verificationRemarks: verificationForm.verificationRemarks
      });
      
      // Refresh documents
      fetchApplicationDocuments(applicationId);
      setSelectedDocument(null);
      setVerificationForm({ isVerified: false, verificationRemarks: '' });
    } catch (err) {
      console.error('Failed to verify document:', err);
    }
  };

  const openVerificationModal = (document: any) => {
    setSelectedDocument(document);
    setVerificationForm({
      isVerified: document.isVerified,
      verificationRemarks: document.verificationRemarks || ''
    });
  };

  const getDocumentIcon = (mimeType: string) => {
    if (mimeType?.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else if (mimeType?.startsWith('image/')) {
      return <FileText className="h-8 w-8 text-blue-500" />;
    } else {
      return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Check if user has permission
  if (user?.role !== 'admin' && user?.role !== 'program_admin') {
    return (
      <div className="text-center py-12">
        <XCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          You don't have permission to verify documents.
        </p>
      </div>
    );
  }

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
            to={`/applications/${applicationId}`}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Document Verification</h1>
            {currentApplication && (
              <p className="text-sm text-gray-600 mt-1">
                Application #{currentApplication.applicationNumber} - {currentApplication.studentName}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 p-4 rounded-md text-red-800">
          {error}
        </div>
      )}

      {/* Documents for Verification */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Documents Awaiting Verification
          </h3>
          
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
              <p className="mt-1 text-sm text-gray-500">
                This application has no uploaded documents.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map((document) => (
                <div key={document._id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Document Preview */}
                  <div className="bg-gray-50 p-4 flex justify-center">
                    {getDocumentIcon(document.fileUploadId.mimeType)}
                  </div>
                  
                  {/* Document Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {document.certificateTypeId.name}
                      </h4>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        document.isVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {document.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {document.documentName || document.fileUploadId.originalName}
                    </p>
                    
                    <p className="text-xs text-gray-500 mb-3">
                      Size: {formatFileSize(document.fileUploadId.fileSize)}
                    </p>
                    
                    {document.remarks && (
                      <p className="text-xs text-gray-600 mb-3 bg-gray-50 p-2 rounded">
                        <strong>Student Note:</strong> {document.remarks}
                      </p>
                    )}
                    
                    {document.verificationRemarks && (
                      <p className="text-xs text-green-600 mb-3 bg-green-50 p-2 rounded">
                        <strong>Verification Note:</strong> {document.verificationRemarks}
                      </p>
                    )}
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          // Download functionality
                          console.log('Download:', document.fileUploadId.uuid);
                        }}
                        className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </button>
                      
                      <button
                        onClick={() => openVerificationModal(document)}
                        className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Review
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Verification Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Verify Document: {selectedDocument.certificateTypeId.name}
                    </h3>
                    
                    {/* Document Details */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>File Name:</strong><br />
                          {selectedDocument.documentName || selectedDocument.fileUploadId.originalName}
                        </div>
                        <div>
                          <strong>File Size:</strong><br />
                          {formatFileSize(selectedDocument.fileUploadId.fileSize)}
                        </div>
                        <div>
                          <strong>Upload Date:</strong><br />
                          {new Date(selectedDocument.dateCreated).toLocaleString()}
                        </div>
                        <div>
                          <strong>Current Status:</strong><br />
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            selectedDocument.isVerified 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedDocument.isVerified ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      </div>
                      
                      {selectedDocument.remarks && (
                        <div className="mt-4">
                          <strong>Student Note:</strong>
                          <p className="text-gray-600 mt-1">{selectedDocument.remarks}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Verification Form */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Verification Status
                        </label>
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="verification"
                              checked={verificationForm.isVerified === true}
                              onChange={() => setVerificationForm(prev => ({ ...prev, isVerified: true }))}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Approve</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="verification"
                              checked={verificationForm.isVerified === false}
                              onChange={() => setVerificationForm(prev => ({ ...prev, isVerified: false }))}
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">Reject</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Verification Comments
                        </label>
                        <textarea
                          value={verificationForm.verificationRemarks}
                          onChange={(e) => setVerificationForm(prev => ({ 
                            ...prev, 
                            verificationRemarks: e.target.value 
                          }))}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Add comments about the verification decision..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => handleVerify(selectedDocument._id, verificationForm.isVerified)}
                  disabled={loading}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 ${
                    verificationForm.isVerified 
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  }`}
                >
                  {loading ? 'Processing...' : (verificationForm.isVerified ? 'Approve Document' : 'Reject Document')}
                </button>
                <button
                  onClick={() => setSelectedDocument(null)}
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

export default DocumentVerificationPage;