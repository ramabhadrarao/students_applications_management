// File: src/pages/FilesPage.tsx
// Purpose: File management dashboard for users - FIXED to show user-specific files

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Download, Trash2, Eye, FileText, Image, File, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import useFileUploadStore from '../stores/fileUploadStore';
import useAuthStore from '../stores/authStore';

const FilesPage = () => {
  const { user } = useAuthStore();
  const { files, loading, error, fetchFiles, deleteFile, downloadFile } = useFileUploadStore();
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, verified, pending

  useEffect(() => {
    // Fetch files with user filter
    const filters: any = {};
    
    // Add user filter - only show current user's files
    if (user?._id) {
      filters.uploadedBy = user._id;
    }
    
    // Add search filter if search term exists
    if (searchTerm.trim()) {
      filters.search = searchTerm.trim();
    }
    
    // Add status filter
    if (filterStatus !== 'all') {
      filters.isVerified = filterStatus === 'verified';
    }
    
    fetchFiles(filters);
  }, [user?._id, searchTerm, filterStatus, fetchFiles]);

  // Filter files on frontend as backup (in case backend doesn't filter properly)
  const userFiles = files.filter(file => {
    // Only show files uploaded by current user
    const isUserFile = file.uploadedBy === user?._id;
    
    // Apply search filter
    const matchesSearch = searchTerm === '' || 
      file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (file.description && file.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply status filter
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'verified' && file.isVerified) ||
      (filterStatus === 'pending' && !file.isVerified);
    
    return isUserFile && matchesSearch && matchesStatus;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    } else if (mimeType?.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else {
      return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const handleDownload = async (uuid: string, filename: string) => {
    try {
      await downloadFile(uuid, filename);
    } catch (err) {
      console.error('Failed to download file:', err);
    }
  };

  const handleDelete = async (uuid: string, filename: string) => {
    if (window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      try {
        await deleteFile(uuid);
      } catch (err) {
        console.error('Failed to delete file:', err);
      }
    }
  };

  const handleSelectFile = (uuid: string) => {
    setSelectedFiles(prev => 
      prev.includes(uuid) 
        ? prev.filter(id => id !== uuid)
        : [...prev, uuid]
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === userFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(userFiles.map(file => file.uuid));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedFiles.length} selected file(s)?`)) {
      try {
        for (const uuid of selectedFiles) {
          const file = userFiles.find(f => f.uuid === uuid);
          if (file) {
            await deleteFile(uuid);
          }
        }
        setSelectedFiles([]);
      } catch (err) {
        console.error('Failed to delete files:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">My Files</h1>
        <Link
          to="/files/upload"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Files
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search Files</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by filename or description..."
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Status Filter</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">All Files</option>
              <option value="verified">Verified Only</option>
              <option value="pending">Pending Verification</option>
            </select>
          </div>
          
          <div className="flex items-end">
            {selectedFiles.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Selected ({selectedFiles.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* File Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Files</dt>
                  <dd className="text-lg font-medium text-gray-900">{userFiles.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Verified</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {userFiles.filter(file => file.isVerified).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <XCircle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {userFiles.filter(file => !file.isVerified).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Size</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatFileSize(userFiles.reduce((total, file) => total + file.fileSize, 0))}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Files List */}
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 p-4 rounded-md text-red-800">{error}</div>
      ) : userFiles.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm || filterStatus !== 'all' ? 'No files match your filters' : 'No files uploaded'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterStatus !== 'all' ? 
              'Try adjusting your search or filter criteria.' : 
              'Get started by uploading your first file.'
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <div className="mt-6">
              <Link
                to="/files/upload"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {/* Bulk Actions */}
          {selectedFiles.length > 0 && (
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">
                  {selectedFiles.length} file(s) selected
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => setSelectedFiles([])}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Clear selection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedFiles.length === userFiles.length && userFiles.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                File Name ({userFiles.length} files)
              </span>
            </div>
          </div>

          {/* Files List */}
          <ul className="divide-y divide-gray-200">
            {userFiles.map((file) => (
              <li key={file.uuid}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.uuid)}
                        onChange={() => handleSelectFile(file.uuid)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="ml-4 flex items-center">
                        {getFileIcon(file.mimeType)}
                        <div className="ml-4">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {file.originalName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(file.fileSize)} • Uploaded {new Date(file.uploadDate).toLocaleDateString()}
                          </p>
                          {file.description && (
                            <p className="text-sm text-gray-500 mt-1">{file.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        file.isVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {file.isVerified ? 'Verified' : 'Pending'}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDownload(file.uuid, file.originalName)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {!file.isVerified && (
                          <button
                            onClick={() => handleDelete(file.uuid, file.originalName)}
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
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* User Info Debug (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 p-4 rounded-md text-sm">
          <strong>Debug Info:</strong><br />
          Current User ID: {user?._id || 'Not logged in'}<br />
          User Role: {user?.role || 'Unknown'}<br />
          Total Files in Store: {files.length}<br />
          User-Specific Files: {userFiles.length}<br />
          Search Term: {searchTerm || 'None'}<br />
          Status Filter: {filterStatus}
        </div>
      )}
    </div>
  );
};

export default FilesPage;