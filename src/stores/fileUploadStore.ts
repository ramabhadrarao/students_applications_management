// File: src/stores/fileUploadStore.ts
// Purpose: Zustand store for file upload state management - FIXED for user-specific files

import { create } from 'zustand';
import axios from 'axios';
import { FileUpload } from '../types';

interface FileUploadState {
  files: FileUpload[];
  currentFile: FileUpload | null;
  loading: boolean;
  uploading: boolean;
  error: string | null;
  uploadProgress: number;
  fetchFiles: (filters?: Record<string, any>) => Promise<void>;
  uploadFile: (file: File, description?: string) => Promise<FileUpload>;
  getFileByUuid: (uuid: string) => Promise<FileUpload>;
  downloadFile: (uuid: string, filename: string) => Promise<void>;
  verifyFile: (uuid: string) => Promise<FileUpload>;
  deleteFile: (uuid: string) => Promise<void>;
  clearError: () => void;
}

const useFileUploadStore = create<FileUploadState>((set, get) => ({
  files: [],
  currentFile: null,
  loading: false,
  uploading: false,
  error: null,
  uploadProgress: 0,

  fetchFiles: async (filters = {}) => {
    try {
      set({ loading: true, error: null });
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      // Debug logging
      console.log('🔍 Fetching files with filters:', filters);
      console.log('📋 Query params:', queryParams.toString());
      
      const { data } = await axios.get(`/api/files?${queryParams.toString()}`);
      
      // Handle different response formats
      let filesArray = [];
      if (data.files) {
        filesArray = data.files;
      } else if (Array.isArray(data)) {
        filesArray = data;
      } else if (data.docs) {
        filesArray = data.docs;
      } else {
        console.warn('⚠️ Unexpected response format:', data);
        filesArray = [];
      }
      
      console.log('✅ Files fetched successfully:', filesArray.length, 'files');
      set({ files: filesArray, loading: false });
    } catch (error: any) {
      console.error('❌ Failed to fetch files:', error.response?.data || error.message);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch files', 
        loading: false 
      });
    }
  },

  uploadFile: async (file, description = '') => {
    try {
      set({ uploading: true, error: null, uploadProgress: 0 });
      
      const formData = new FormData();
      formData.append('file', file);
      if (description) {
        formData.append('description', description);
      }
      
      console.log('📤 Uploading file:', file.name, 'Size:', file.size, 'bytes');
      
      const { data } = await axios.post('/api/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            set({ uploadProgress: progress });
            console.log(`📊 Upload progress: ${progress}%`);
          }
        },
      });
      
      // Update files list - add new file to the beginning
      const currentFiles = get().files;
      set({ 
        files: [data, ...currentFiles], 
        uploading: false,
        uploadProgress: 0
      });
      
      console.log('✅ File uploaded successfully:', data.originalName);
      return data;
    } catch (error: any) {
      console.error('❌ Upload failed:', error.response?.data || error.message);
      set({ 
        error: error.response?.data?.message || 'Failed to upload file', 
        uploading: false,
        uploadProgress: 0
      });
      throw error;
    }
  },

  getFileByUuid: async (uuid) => {
    try {
      set({ loading: true, error: null });
      console.log('🔍 Fetching file by UUID:', uuid);
      
      const { data } = await axios.get(`/api/files/${uuid}`);
      set({ currentFile: data, loading: false });
      
      console.log('✅ File fetched by UUID:', data.originalName);
      return data;
    } catch (error: any) {
      console.error('❌ Failed to fetch file by UUID:', error.response?.data || error.message);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch file', 
        loading: false 
      });
      throw error;
    }
  },

  downloadFile: async (uuid, filename) => {
    try {
      set({ loading: true, error: null });
      console.log('⬇️ Downloading file:', filename);
      
      const response = await axios.get(`/api/files/${uuid}/download`, {
        responseType: 'blob',
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      set({ loading: false });
      console.log('✅ File downloaded successfully:', filename);
    } catch (error: any) {
      console.error('❌ Download failed:', error.response?.data || error.message);
      set({ 
        error: error.response?.data?.message || 'Failed to download file', 
        loading: false 
      });
      throw error;
    }
  },

  verifyFile: async (uuid) => {
    try {
      set({ loading: true, error: null });
      console.log('✅ Verifying file:', uuid);
      
      const { data } = await axios.put(`/api/files/${uuid}/verify`);
      
      // Update files list
      const updatedFiles = get().files.map(file => 
        file.uuid === uuid ? { ...file, ...data } : file
      );
      
      set({ 
        files: updatedFiles,
        currentFile: data,
        loading: false 
      });
      
      console.log('✅ File verified successfully');
      return data;
    } catch (error: any) {
      console.error('❌ Verification failed:', error.response?.data || error.message);
      set({ 
        error: error.response?.data?.message || 'Failed to verify file', 
        loading: false 
      });
      throw error;
    }
  },

  deleteFile: async (uuid) => {
    try {
      set({ loading: true, error: null });
      console.log('🗑️ Deleting file:', uuid);
      
      await axios.delete(`/api/files/${uuid}`);
      
      // Update files list - remove deleted file
      const filteredFiles = get().files.filter(file => file.uuid !== uuid);
      set({ 
        files: filteredFiles, 
        loading: false 
      });
      
      console.log('✅ File deleted successfully');
    } catch (error: any) {
      console.error('❌ Delete failed:', error.response?.data || error.message);
      set({ 
        error: error.response?.data?.message || 'Failed to delete file', 
        loading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useFileUploadStore;