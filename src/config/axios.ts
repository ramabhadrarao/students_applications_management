// src/config/axios.ts
import axios from 'axios';

// Set the base URL for all API requests
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Configure axios defaults
axios.defaults.baseURL = baseURL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axios.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    const url = error.config?.url || 'unknown';
    const status = error.response?.status || 'network error';
    console.error(`❌ API Error: ${status} ${url}`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default axios;