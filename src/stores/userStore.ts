import { create } from 'zustand';
import axios from 'axios';
import { User } from '../types';

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: (filters?: Record<string, any>) => Promise<void>;
  createUser: (userData: Partial<User>) => Promise<User>;
  updateUser: (id: string, userData: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  clearError: () => void;
}

const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async (filters = {}) => {
    try {
      set({ loading: true, error: null });
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
      
      const { data } = await axios.get(`/api/users?${queryParams.toString()}`);
      set({ users: data, loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch users', 
        loading: false 
      });
    }
  },

  createUser: async (userData) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.post('/api/users', userData);
      
      // Update users list
      const currentUsers = get().users;
      set({ 
        users: [...currentUsers, data], 
        loading: false 
      });
      
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to create user', 
        loading: false 
      });
      throw error;
    }
  },

  updateUser: async (id, userData) => {
    try {
      set({ loading: true, error: null });
      const { data } = await axios.put(`/api/users/${id}`, userData);
      
      // Update users list
      const updatedUsers = get().users.map(user => 
        user._id === id ? { ...user, ...data } : user
      );
      
      set({ 
        users: updatedUsers, 
        loading: false 
      });
      
      return data;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to update user', 
        loading: false 
      });
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      set({ loading: true, error: null });
      await axios.delete(`/api/users/${id}`);
      
      // Update users list
      const filteredUsers = get().users.filter(user => user._id !== id);
      set({ 
        users: filteredUsers, 
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to delete user', 
        loading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useUserStore;