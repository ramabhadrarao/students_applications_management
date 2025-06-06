// File: src/stores/applicationDocumentStore.ts
// Purpose: Zustand store for application document state management

import { create } from 'zustand';
import axios from 'axios';
import { ApplicationDocument } from '../types';

interface ApplicationDocumentState {
  documents: ApplicationDocument[];
  verificationStatus: any;
  loading: boolean;
  error: string | null;
  fetchApplicationDocuments: (applicationId: string) => Promise<void>;
  addApplicationDocument: (applicationId: string, documentData: any) => Promise<ApplicationDocument>;
  updateApplicationDocument: (applicationId: string, documentId: string, documentData: any) => Promise<ApplicationDocument>;
  verifyApplicationDocument: (applicationId: string, documentId: string, verificationData: any) => Promise<ApplicationDocument>;
  deleteApplicationDocument: (applicationId: string, documentId: string) => Promise<void>;
  getDocumentVerificationStatus: (applicationId: string) => Promise<void>;
  clearError: () => void;
}

const useApplicationDocumentStore = create<ApplicationDocumentState>((set, get) => ({
  documents: [],
  verificationStatus: null,
  loading: false,
  error: null,

  fetchApplicationDocuments: async (applicationId) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.get(`/api/applications/${applicationId}/documents`);
      set({ documents: data, loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch application documents', 
        loading: false 
      });
    }
  },

  addApplicationDocument: async (applicationId, documentData) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.post(`/api/applications/${applicationId}/documents`, documentData);
      
      // Update documents list
      const currentDocuments = get().documents;
      set({ 
        documents: [...currentDocuments, data], 
        loading: false 
      });
      
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to add application document', 
        loading: false 
      });
      throw error;
    }
  },

  updateApplicationDocument: async (applicationId, documentId, documentData) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.put(`/api/applications/${applicationId}/documents/${documentId}`, documentData);
      
      // Update documents list
      const updatedDocuments = get().documents.map(document => 
        document._id === documentId ? { ...document, ...data } : document
      );
      
      set({ 
        documents: updatedDocuments, 
        loading: false 
      });
      
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to update application document', 
        loading: false 
      });
      throw error;
    }
  },

  verifyApplicationDocument: async (applicationId, documentId, verificationData) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.put(`/api/applications/${applicationId}/documents/${documentId}/verify`, verificationData);
      
      // Update documents list
      const updatedDocuments = get().documents.map(document => 
        document._id === documentId ? { ...document, ...data } : document
      );
      
      set({ 
        documents: updatedDocuments, 
        loading: false 
      });
      
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to verify application document', 
        loading: false 
      });
      throw error;
    }
  },

  deleteApplicationDocument: async (applicationId, documentId) => {
    try {
      set({ loading: true, error: null });
      await axios.delete(`/api/applications/${applicationId}/documents/${documentId}`);
      
      // Update documents list
      const filteredDocuments = get().documents.filter(document => document._id !== documentId);
      set({ 
        documents: filteredDocuments, 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to delete application document', 
        loading: false 
      });
      throw error;
    }
  },

  getDocumentVerificationStatus: async (applicationId) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.get(`/api/applications/${applicationId}/documents/verification-status`);
      set({ verificationStatus: data, loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch document verification status', 
        loading: false 
      });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useApplicationDocumentStore;