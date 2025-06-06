// File: src/stores/fileUploadStore.ts
// Purpose: Zustand store for file upload state management

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
      
      const { data } = await axios.get(`/api/files?${queryParams.toString()}`);
      set({ files: data.files, loading: false });
    } catch (error) {
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
      formData.append('description', description);
      
      const { data } = await axios.post('/api/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          set({ uploadProgress: progress });
        },
      });
      
      // Update files list
      const currentFiles = get().files;
      set({ 
        files: [data, ...currentFiles], 
        uploading: false,
        uploadProgress: 0
      });
      
      return data;
    } catch (error) {
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
      const { data } = await axios.get(`/api/files/${uuid}`);
      set({ currentFile: data, loading: false });
      return data;
    } catch (error) {
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
    } catch (error) {
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
      
      return data;
    } catch (error) {
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
      await axios.delete(`/api/files/${uuid}`);
      
      // Update files list
      const filteredFiles = get().files.filter(file => file.uuid !== uuid);
      set({ 
        files: filteredFiles, 
        loading: false 
      });
    } catch (error) {
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