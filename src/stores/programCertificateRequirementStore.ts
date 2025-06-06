// File: src/stores/programCertificateRequirementStore.ts
// Purpose: Zustand store for program certificate requirements

import { create } from 'zustand';
import axios from 'axios';

interface ProgramCertificateRequirement {
  _id: string;
  programId: string;
  certificateTypeId: {
    _id: string;
    name: string;
    description: string;
    fileTypesAllowed: string;
    maxFileSizeMb: number;
    isRequired: boolean;
    displayOrder: number;
    isActive: boolean;
  };
  isRequired: boolean;
  specialInstructions?: string;
  displayOrder: number;
  isActive: boolean;
  dateCreated: string;
  dateUpdated: string;
}

interface ProgramCertificateRequirementState {
  requirements: ProgramCertificateRequirement[];
  availableCertificateTypes: any[];
  loading: boolean;
  error: string | null;
  fetchProgramRequirements: (programId: string) => Promise<void>;
  fetchAvailableCertificateTypes: (programId: string) => Promise<void>;
  addProgramRequirement: (programId: string, requirementData: any) => Promise<ProgramCertificateRequirement>;
  updateProgramRequirement: (programId: string, requirementId: string, requirementData: any) => Promise<ProgramCertificateRequirement>;
  deleteProgramRequirement: (programId: string, requirementId: string) => Promise<void>;
  reorderRequirements: (programId: string, requirements: { id: string; displayOrder: number }[]) => Promise<void>;
  clearError: () => void;
}

const useProgramCertificateRequirementStore = create<ProgramCertificateRequirementState>((set, get) => ({
  requirements: [],
  availableCertificateTypes: [],
  loading: false,
  error: null,

  fetchProgramRequirements: async (programId) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.get(`/api/programs/${programId}/certificates`);
      set({ requirements: data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch program requirements', 
        loading: false 
      });
    }
  },

  fetchAvailableCertificateTypes: async (programId) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.get(`/api/programs/${programId}/certificates/available`);
      set({ availableCertificateTypes: data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch available certificate types', 
        loading: false 
      });
    }
  },

  addProgramRequirement: async (programId, requirementData) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.post(`/api/programs/${programId}/certificates`, requirementData);
      
      // Update requirements list
      const currentRequirements = get().requirements;
      set({ 
        requirements: [...currentRequirements, data], 
        loading: false 
      });
      
      return data;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to add program requirement', 
        loading: false 
      });
      throw error;
    }
  },

  updateProgramRequirement: async (programId, requirementId, requirementData) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.put(`/api/programs/${programId}/certificates/${requirementId}`, requirementData);
      
      // Update requirements list
      const updatedRequirements = get().requirements.map(requirement => 
        requirement._id === requirementId ? { ...requirement, ...data } : requirement
      );
      
      set({ 
        requirements: updatedRequirements, 
        loading: false 
      });
      
      return data;
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to update program requirement', 
        loading: false 
      });
      throw error;
    }
  },

  deleteProgramRequirement: async (programId, requirementId) => {
    try {
      set({ loading: true, error: null });
      await axios.delete(`/api/programs/${programId}/certificates/${requirementId}`);
      
      // Update requirements list
      const filteredRequirements = get().requirements.filter(requirement => requirement._id !== requirementId);
      set({ 
        requirements: filteredRequirements, 
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to delete program requirement', 
        loading: false 
      });
      throw error;
    }
  },

  reorderRequirements: async (programId, requirements) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.put(`/api/programs/${programId}/certificates/reorder`, { requirements });
      set({ requirements: data, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to reorder requirements', 
        loading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useProgramCertificateRequirementStore;