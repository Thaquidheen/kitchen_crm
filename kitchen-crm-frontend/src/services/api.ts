/**
 * Axios instance with request/response interceptors
 * Handles authentication, error handling, and token management
 */

import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import type { ApiError } from '../types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem('accessToken');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (import.meta.env.VITE_ENABLE_DEBUG === 'true') {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        params: config.params,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle responses and errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (import.meta.env.VITE_ENABLE_DEBUG === 'true') {
      console.log('API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }

    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Handle different error status codes
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - Clear token and redirect to login
          console.error('Unauthorized: Redirecting to login');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');

          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          break;

        case 403:
          // Forbidden - User doesn't have permission
          console.error('Forbidden: Insufficient permissions');
          break;

        case 404:
          // Not found
          console.error('Resource not found');
          break;

        case 500:
          // Server error
          console.error('Server error occurred');
          break;

        case 422:
          // Validation error
          console.error('Validation failed:', data);
          break;

        default:
          console.error(`API Error (${status}):`, data?.message || 'Unknown error');
      }

      // Return formatted error
      return Promise.reject({
        status,
        message: data?.message || 'An error occurred',
        errors: data?.errors,
        data: data?.data,
      } as ApiError);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
      return Promise.reject({
        status: 0,
        message: 'No response from server. Please check your connection.',
        data: null,
      } as ApiError);
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
      return Promise.reject({
        status: 0,
        message: error.message || 'Failed to make request',
        data: null,
      } as ApiError);
    }
  }
);

// Token management utilities
export const setAuthToken = (token: string) => {
  localStorage.setItem('accessToken', token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

export const removeAuthToken = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  return !!token;
};

export default api;
