// File: src/stores/applicationStore.ts
// Purpose: Enhanced application store with improved functionality

import { create } from 'zustand';
import axios from 'axios';
import { Application, ApplicationStatusHistory } from '../types';

interface ApplicationFilters {
  status?: string;
  programId?: string;
  academicYear?: string;
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

interface ApplicationResponse {
  docs: Application[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage?: number;
  prevPage?: number;
  filterApplied: {
    status: string | null;
    programId: string | null;
    academicYear: string | null;
    search: string | null;
  };
  sortApplied: {
    field: string;
    order: string;
  };
  userInfo: {
    role: string;
    canCreateNew: boolean;
    canBulkEdit: boolean;
  };
}

interface ApplicationStatistics {
  totalApplications: number;
  statusStats: Record<string, number>;
  programStats: Array<{
    programId: string;
    programName: string;
    department: string;
    totalApplications: number;
    draftApplications: number;
    submittedApplications: number;
    underReviewApplications: number;
    approvedApplications: number;
    rejectedApplications: number;
    frozenApplications: number;
  }>;
  monthlyStats: Array<{
    _id: number;
    count: number;
  }>;
  generatedAt: string;
  filters: {
    academicYear: string;
    programId?: string;
  };
}

interface BulkUpdateData {
  applicationIds: string[];
  updates: {
    status?: string;
    academicYear?: string;
    reviewedBy?: string;
  };
}

interface ApplicationState {
  applications: Application[];
  currentApplication: Application | null;
  applicationHistory: ApplicationStatusHistory[];
  statistics: ApplicationStatistics | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: ApplicationFilters;
  userInfo: {
    role: string;
    canCreateNew: boolean;
    canBulkEdit: boolean;
  };
  loading: boolean;
  submitLoading: string | null; // Track which application is being submitted
  bulkLoading: boolean;
  error: string | null;
  
  // Actions
  fetchApplications: (filters?: ApplicationFilters) => Promise<void>;
  fetchApplicationById: (id: string) => Promise<Application>;
  createApplication: (applicationData: Partial<Application>) => Promise<Application>;
  updateApplication: (id: string, applicationData: Partial<Application>) => Promise<Application>;
  submitApplication: (id: string) => Promise<Application>;
  fetchApplicationHistory: (id: string) => Promise<void>;
  fetchApplicationStatistics: (academicYear: string, programId?: string) => Promise<void>;
  bulkUpdateApplications: (data: BulkUpdateData) => Promise<void>;
  setFilters: (filters: Partial<ApplicationFilters>) => void;
  resetFilters: () => void;
  clearError: () => void;
  clearCurrentApplication: () => void;
}

const defaultFilters: ApplicationFilters = {
  status: '',
  programId: '',
  academicYear: '2025-26',
  page: 1,
  limit: 10,
  sortField: 'dateCreated',
  sortOrder: 'desc',
  search: ''
};

const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: [],
  currentApplication: null,
  applicationHistory: [],
  statistics: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  },
  filters: { ...defaultFilters },
  userInfo: {
    role: 'student',
    canCreateNew: false,
    canBulkEdit: false,
  },
  loading: false,
  submitLoading: null,
  bulkLoading: false,
  error: null,

  fetchApplications: async (filters = {}) => {
    try {
      set({ loading: true, error: null });
      
      // Merge with current filters
      const currentFilters = get().filters;
      const finalFilters = { ...currentFilters, ...filters };
      
      console.log('📋 Fetching applications with filters:', finalFilters);
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(finalFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
      
      const { data }: { data: ApplicationResponse } = await axios.get(`/api/applications?${queryParams.toString()}`);
      
      console.log(`✅ Fetched ${data.docs.length} applications (page ${data.page} of ${data.totalPages})`);
      
      set({ 
        applications: data.docs, 
        pagination: {
          page: data.page,
          limit: data.limit,
          total: data.totalDocs,
          totalPages: data.totalPages,
          hasNextPage: data.hasNextPage,
          hasPrevPage: data.hasPrevPage,
        },
        filters: finalFilters,
        userInfo: data.userInfo,
        loading: false 
      });
    } catch (error: any) {
      console.error('❌ Error fetching applications:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch applications', 
        loading: false 
      });
    }
  },

  fetchApplicationById: async (id) => {
    try {
      set({ loading: true, error: null });
      console.log(`🔍 Fetching application: ${id}`);
      
      const { data } = await axios.get(`/api/applications/${id}`);
      console.log(`✅ Application fetched:`, data.applicationNumber);
      
      set({ currentApplication: data, loading: false });
      return data;
    } catch (error: any) {
      console.error('❌ Error fetching application:', error);
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
      console.log('📝 Creating application...');
      
      const { data } = await axios.post('/api/applications', applicationData);
      console.log(`✅ Application created:`, data.applicationNumber);
      
      // Update applications list
      const currentApplications = get().applications;
      set({ 
        applications: [data, ...currentApplications], 
        currentApplication: data,
        loading: false 
      });
      
      return data;
    } catch (error: any) {
      console.error('❌ Error creating application:', error);
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
      console.log(`📝 Updating application: ${id}`);
      
      const { data } = await axios.put(`/api/applications/${id}`, applicationData);
      console.log(`✅ Application updated:`, data.applicationNumber);
      
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
    } catch (error: any) {
      console.error('❌ Error updating application:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to update application', 
        loading: false 
      });
      throw error;
    }
  },

  submitApplication: async (id) => {
    try {
      set({ submitLoading: id, error: null });
      console.log(`📤 Submitting application: ${id}`);
      
      const { data } = await axios.put(`/api/applications/${id}/submit`);
      console.log(`✅ Application submitted:`, data.applicationNumber);
      
      // Update applications list and current application
      const updatedApplications = get().applications.map(app => 
        app._id === id ? { ...app, ...data } : app
      );
      
      set({ 
        applications: updatedApplications,
        currentApplication: data,
        submitLoading: null 
      });
      
      return data;
    } catch (error: any) {
      console.error('❌ Error submitting application:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to submit application', 
        submitLoading: null 
      });
      throw error;
    }
  },

  fetchApplicationHistory: async (id) => {
    try {
      set({ loading: true, error: null });
      console.log(`📊 Fetching history for application: ${id}`);
      
      const { data } = await axios.get(`/api/applications/${id}/history`);
      console.log(`✅ Fetched ${data.length} history records`);
      
      set({ applicationHistory: data, loading: false });
    } catch (error: any) {
      console.error('❌ Error fetching application history:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch application history', 
        loading: false 
      });
    }
  },

  fetchApplicationStatistics: async (academicYear, programId) => {
    try {
      set({ loading: true, error: null });
      console.log(`📊 Fetching statistics for academic year: ${academicYear}`, programId ? `program: ${programId}` : '');
      
      const params = new URLSearchParams({ academicYear });
      if (programId) params.append('programId', programId);
      
      const { data }: { data: ApplicationStatistics } = await axios.get(`/api/applications/statistics?${params.toString()}`);
      console.log(`✅ Statistics fetched for ${data.totalApplications} applications`);
      
      set({ statistics: data, loading: false });
    } catch (error: any) {
      console.error('❌ Error fetching statistics:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch statistics', 
        loading: false 
      });
    }
  },

  bulkUpdateApplications: async (bulkData) => {
    try {
      set({ bulkLoading: true, error: null });
      console.log(`🔄 Bulk updating ${bulkData.applicationIds.length} applications`);
      
      const { data } = await axios.put('/api/applications/bulk', bulkData);
      console.log(`✅ Bulk update completed: ${data.modifiedCount} applications updated`);
      
      // Refresh the applications list to show updated data
      const currentFilters = get().filters;
      await get().fetchApplications(currentFilters);
      
      set({ bulkLoading: false });
    } catch (error: any) {
      console.error('❌ Error in bulk update:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to bulk update applications', 
        bulkLoading: false 
      });
      throw error;
    }
  },

  setFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    
    console.log('🔧 Updating filters:', updatedFilters);
    set({ filters: updatedFilters });
    
    // Auto-fetch applications with new filters
    get().fetchApplications(updatedFilters);
  },

  resetFilters: () => {
    console.log('🔄 Resetting filters to defaults');
    set({ filters: { ...defaultFilters } });
    get().fetchApplications(defaultFilters);
  },

  clearError: () => set({ error: null }),

  clearCurrentApplication: () => set({ currentApplication: null }),
}));

export default useApplicationStore;