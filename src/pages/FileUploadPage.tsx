// File: src/pages/FileUploadPage.tsx
// Purpose: Dedicated file upload interface with drag & drop

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import useFileUploadStore from '../stores/fileUploadStore';

interface UploadFile {
  id: string;
  file: File;
  description: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const FileUploadPage = () => {
  const navigate = useNavigate();
  const { uploadFile, uploading, uploadProgress, error: uploadError } = useFileUploadStore();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (fileList: File[]) => {
    const newFiles: UploadFile[] = fileList.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      description: '',
      progress: 0,
      status: 'pending'
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const updateFileDescription = (id: string, description: string) => {
    setFiles(prev => prev.map(file => 
      file.id === id ? { ...file, description } : file
    ));
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const uploadSingleFile = async (uploadFile: UploadFile) => {
    setFiles(prev => prev.map(file => 
      file.id === uploadFile.id 
        ? { ...file, status: 'uploading', progress: 0 }
        : file
    ));

    try {
      await uploadFile.file;
      setFiles(prev => prev.map(file => 
        file.id === uploadFile.id 
          ? { ...file, status: 'success', progress: 100 }
          : file
      ));
    } catch (error: any) {
      setFiles(prev => prev.map(file => 
        file.id === uploadFile.id 
          ? { ...file, status: 'error', error: error.message }
          : file
      ));
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = files.filter(file => file.status === 'pending');
    
    for (const file of pendingFiles) {
      try {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'uploading' } : f
        ));

        await uploadFile(file.file, file.description);

        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'success', progress: 100 } : f
        ));
      } catch (error: any) {
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'error', error: error.message } 
            : f
        ));
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canUpload = files.some(file => file.status === 'pending');
  const allUploaded = files.length > 0 && files.every(file => file.status === 'success');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/files')}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900">Upload Files</h1>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white shadow rounded-lg p-6">
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="text-base font-medium text-blue-600 hover:text-blue-500">
                Choose files
              </span>
              <span className="text-gray-500"> or drag and drop</span>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                multiple
                className="sr-only"
                onChange={handleChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              />
            </label>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            PDF, JPG, PNG, DOC, DOCX, XLS, XLSX up to 10MB each
          </p>
        </div>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Files to Upload ({files.length})
            </h3>
            {canUpload && (
              <button
                onClick={uploadAllFiles}
                disabled={uploading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload All Files'}
              </button>
            )}
          </div>

          <div className="space-y-4">
            {files.map((file) => (
              <div key={file.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {file.status === 'success' && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {file.status === 'error' && (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        {file.status === 'uploading' && (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        )}
                        {file.status === 'pending' && (
                          <Upload className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.file.size)}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {file.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{uploadProgress}% uploaded</p>
                      </div>
                    )}

                    {/* Error Message */}
                    {file.status === 'error' && file.error && (
                      <p className="text-sm text-red-600 mt-2">{file.error}</p>
                    )}

                    {/* Description Input */}
                    {file.status === 'pending' && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Description (optional)
                        </label>
                        <input
                          type="text"
                          value={file.description}
                          onChange={(e) => updateFileDescription(file.id, e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Brief description of this file..."
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex-shrink-0 ml-4">
                    {file.status === 'pending' && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Success Message */}
          {allUploaded && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    All files uploaded successfully!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    You can now view your files in the files section or continue uploading more.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => navigate('/files')}
                  className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-md hover:bg-green-200"
                >
                  View Files
                </button>
                <button
                  onClick={() => setFiles([])}
                  className="text-sm bg-white text-green-800 border border-green-300 px-3 py-1 rounded-md hover:bg-green-50"
                >
                  Upload More Files
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className="bg-red-100 p-4 rounded-md">
          <p className="text-red-800">{uploadError}</p>
        </div>
      )}
    </div>
  );
};

export default FileUploadPage;