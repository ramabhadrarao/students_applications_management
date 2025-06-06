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
  logout: () => void;
  clearError: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      error: null,

      login: async (email, password) => {
        try {
          set({ loading: true, error: null });
          const { data } = await axios.post('/api/users/login', { email, password });
          set({ user: data, loading: false });
          
          // Set auth token for all future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        } catch (error) {
          set({ 
            error: error.response?.data?.message || 'Failed to login', 
            loading: false 
          });
        }
      },

      register: async (email, password) => {
        try {
          set({ loading: true, error: null });
          const { data } = await axios.post('/api/users', { email, password });
          set({ user: data, loading: false });
          
          // Set auth token for all future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        } catch (error) {
          set({ 
            error: error.response?.data?.message || 'Failed to register', 
            loading: false 
          });
        }
      },

      logout: () => {
        set({ user: null });
        // Remove auth token
        delete axios.defaults.headers.common['Authorization'];
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: (state) => {
        // Set the auth token when the store is rehydrated
        if (state?.user?.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${state.user.token}`;
        }
        return (state) => {
          console.log('Auth state rehydrated:', state);
        };
      },
    }
  )
);

export default useAuthStore;