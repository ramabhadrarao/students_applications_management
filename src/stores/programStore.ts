import { create } from 'zustand';
import axios from 'axios';
import { Program } from '../types';

interface ProgramState {
  programs: Program[];
  loading: boolean;
  error: string | null;
  fetchPrograms: (filters?: Record<string, any>) => Promise<void>;
  createProgram: (programData: Partial<Program>) => Promise<Program>;
  updateProgram: (id: string, programData: Partial<Program>) => Promise<Program>;
  deleteProgram: (id: string) => Promise<void>;
  clearError: () => void;
}

const useProgramStore = create<ProgramState>((set, get) => ({
  programs: [],
  loading: false,
  error: null,

  fetchPrograms: async (filters = {}) => {
    try {
      set({ loading: true, error: null });
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const { data } = await axios.get(`/api/programs?${queryParams.toString()}`);
      set({ programs: data, loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch programs', 
        loading: false 
      });
    }
  },

  createProgram: async (programData) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.post('/api/programs', programData);
      
      // Update programs list
      const currentPrograms = get().programs;
      set({ 
        programs: [...currentPrograms, data], 
        loading: false 
      });
      
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to create program', 
        loading: false 
      });
      throw error;
    }
  },

  updateProgram: async (id, programData) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.put(`/api/programs/${id}`, programData);
      
      // Update programs list
      const updatedPrograms = get().programs.map(program => 
        program._id === id ? { ...program, ...data } : program
      );
      
      set({ 
        programs: updatedPrograms, 
        loading: false 
      });
      
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to update program', 
        loading: false 
      });
      throw error;
    }
  },

  deleteProgram: async (id) => {
    try {
      set({ loading: true, error: null });
      await axios.delete(`/api/programs/${id}`);
      
      // Update programs list
      const filteredPrograms = get().programs.filter(program => program._id !== id);
      set({ 
        programs: filteredPrograms, 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to delete program', 
        loading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useProgramStore;