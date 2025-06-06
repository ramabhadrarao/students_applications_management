import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Configure axios for API calls
import axios from 'axios';

// Set base URL for API calls
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Add request/response interceptors for debugging
if (import.meta.env.DEV) {
  axios.interceptors.request.use(
    (config) => {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      return config;
    }
  );

  axios.interceptors.response.use(
    (response) => {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
      return response;
    },
    (error) => {
      console.error(`❌ API Error: ${error.response?.status || 'Network'} ${error.config?.url}`, error.response?.data || error.message);
      return Promise.reject(error);
    }
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);