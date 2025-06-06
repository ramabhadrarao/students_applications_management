// File: src/stores/certificateTypeStore.ts
// Purpose: Zustand store for certificate type state management

import { create } from 'zustand';
import axios from 'axios';
import { CertificateType } from '../types';

interface CertificateTypeState {
  certificateTypes: CertificateType[];
  loading: boolean;
  error: string | null;
  fetchCertificateTypes: (filters?: Record<string, any>) => Promise<void>;
  createCertificateType: (certificateTypeData: Partial<CertificateType>) => Promise<CertificateType>;
  updateCertificateType: (id: string, certificateTypeData: Partial<CertificateType>) => Promise<CertificateType>;
  deleteCertificateType: (id: string) => Promise<void>;
  clearError: () => void;
}

const useCertificateTypeStore = create<CertificateTypeState>((set, get) => ({
  certificateTypes: [],
  loading: false,
  error: null,

  fetchCertificateTypes: async (filters = {}) => {
    try {
      set({ loading: true, error: null });
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const { data } = await axios.get(`/api/certificate-types?${queryParams.toString()}`);
      set({ certificateTypes: data, loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch certificate types', 
        loading: false 
      });
    }
  },

  createCertificateType: async (certificateTypeData) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.post('/api/certificate-types', certificateTypeData);
      
      // Update certificate types list
      const currentCertificateTypes = get().certificateTypes;
      set({ 
        certificateTypes: [...currentCertificateTypes, data], 
        loading: false 
      });
      
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to create certificate type', 
        loading: false 
      });
      throw error;
    }
  },

  updateCertificateType: async (id, certificateTypeData) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.put(`/api/certificate-types/${id}`, certificateTypeData);
      
      // Update certificate types list
      const updatedCertificateTypes = get().certificateTypes.map(certificateType => 
        certificateType._id === id ? { ...certificateType, ...data } : certificateType
      );
      
      set({ 
        certificateTypes: updatedCertificateTypes, 
        loading: false 
      });
      
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to update certificate type', 
        loading: false 
      });
      throw error;
    }
  },

  deleteCertificateType: async (id) => {
    try {
      set({ loading: true, error: null });
      await axios.delete(`/api/certificate-types/${id}`);
      
      // Update certificate types list
      const filteredCertificateTypes = get().certificateTypes.filter(certificateType => certificateType._id !== id);
      set({ 
        certificateTypes: filteredCertificateTypes, 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to delete certificate type', 
        loading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useCertificateTypeStore;