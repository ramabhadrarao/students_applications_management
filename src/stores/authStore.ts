import { create } from 'zustand';
import axios from 'axios';
import { persist } from 'zustand/middleware';

interface User {
  _id: string;
  email: string;
  role: 'admin' | 'program_admin' | 'student';
  isActive: boolean;
  programId?: string;
  token: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  updateUserProfile: (userData: any) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      error: null,

      login: async (email, password) => {
        try {
          set({ loading: true, error: null });
          console.log('🔐 Attempting login...');
          
          const { data } = await axios.post('/api/users/login', { email, password });
          console.log('✅ Login successful:', data.email, data.role);
          
          set({ user: data, loading: false });
          
          // Set auth token for all future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          console.log('🔑 Auth token set for future requests');
          
        } catch (error: any) {
          console.error('❌ Login failed:', error.response?.data || error.message);
          set({ 
            error: error.response?.data?.message || 'Failed to login', 
            loading: false 
          });
          throw error;
        }
      },

      register: async (email, password) => {
        try {
          set({ loading: true, error: null });
          console.log('📝 Attempting registration...');
          
          const { data } = await axios.post('/api/users', { email, password });
          console.log('✅ Registration successful:', data.email);
          
          set({ user: data, loading: false });
          
          // Set auth token for all future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          console.log('🔑 Auth token set for future requests');
          
        } catch (error: any) {
          console.error('❌ Registration failed:', error.response?.data || error.message);
          set({ 
            error: error.response?.data?.message || 'Failed to register', 
            loading: false 
          });
          throw error;
        }
      },

      updateUserProfile: async (userData) => {
        try {
          set({ loading: true, error: null });
          console.log('👤 Updating user profile...');
          
          const { data } = await axios.put('/api/users/profile', userData);
          console.log('✅ Profile updated successfully');
          
          set({ user: data, loading: false });
          
          // Update auth token if it changed
          if (data.token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          }
          
        } catch (error: any) {
          console.error('❌ Profile update failed:', error.response?.data || error.message);
          set({ 
            error: error.response?.data?.message || 'Failed to update profile', 
            loading: false 
          });
          throw error;
        }
      },

      logout: () => {
        console.log('👋 Logging out...');
        set({ user: null, error: null });
        // Remove auth token
        delete axios.defaults.headers.common['Authorization'];
        console.log('🔑 Auth token removed');
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('❌ Auth state rehydration failed:', error);
          } else if (state?.user?.token) {
            // Set the auth token when the store is rehydrated
            axios.defaults.headers.common['Authorization'] = `Bearer ${state.user.token}`;
            console.log('🔄 Auth state rehydrated and token restored');
          } else {
            console.log('🔄 Auth state rehydrated (no user)');
          }
        };
      },
    }
  )
);

export default useAuthStore;