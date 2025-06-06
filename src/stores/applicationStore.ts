import { create } from 'zustand';
import axios from 'axios';
import { Application, ApplicationStatusHistory } from '../types';

interface ApplicationState {
  applications: Application[];
  currentApplication: Application | null;
  applicationHistory: ApplicationStatusHistory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;
  fetchApplications: (filters?: Record<string, any>) => Promise<void>;
  fetchApplicationById: (id: string) => Promise<Application>;
  createApplication: (applicationData: Partial<Application>) => Promise<Application>;
  updateApplication: (id: string, applicationData: Partial<Application>) => Promise<Application>;
  submitApplication: (id: string) => Promise<Application>;
  fetchApplicationHistory: (id: string) => Promise<void>;
  clearError: () => void;
}

const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: [],
  currentApplication: null,
  applicationHistory: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,

  fetchApplications: async (filters = {}) => {
    try {
      set({ loading: true, error: null });
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const { data } = await axios.get(`/api/applications?${queryParams.toString()}`);
      set({ 
        applications: data.docs, 
        pagination: {
          page: data.page,
          limit: data.limit,
          total: data.totalDocs,
          totalPages: data.totalPages,
        },
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch applications', 
        loading: false 
      });
    }
  },

  fetchApplicationById: async (id) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.get(`/api/applications/${id}`);
      set({ currentApplication: data, loading: false });
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch application', 
        loading: false 
      });
      throw error;
    }
  },

  createApplication: async (applicationData) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.post('/api/applications', applicationData);
      
      // Update applications list
      const currentApplications = get().applications;
      set({ 
        applications: [...currentApplications, data], 
        currentApplication: data,
        loading: false 
      });
      
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to create application', 
        loading: false 
      });
      throw error;
    }
  },

  updateApplication: async (id, applicationData) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.put(`/api/applications/${id}`, applicationData);
      
      // Update applications list and current application
      const updatedApplications = get().applications.map(app => 
        app._id === id ? { ...app, ...data } : app
      );
      
      set({ 
        applications: updatedApplications,
        currentApplication: data,
        loading: false 
      });
      
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to update application', 
        loading: false 
      });
      throw error;
    }
  },

  submitApplication: async (id) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.put(`/api/applications/${id}/submit`);
      
      // Update applications list and current application
      const updatedApplications = get().applications.map(app => 
        app._id === id ? { ...app, ...data } : app
      );
      
      set({ 
        applications: updatedApplications,
        currentApplication: data,
        loading: false 
      });
      
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to submit application', 
        loading: false 
      });
      throw error;
    }
  },

  fetchApplicationHistory: async (id) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.get(`/api/applications/${id}/history`);
      set({ applicationHistory: data, loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch application history', 
        loading: false 
      });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useApplicationStore;