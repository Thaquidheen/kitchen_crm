/**
 * Auth slice - Manages authentication state
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Initialize state from localStorage
const getInitialState = (): AuthState => {
  try {
    // Check for any stored errors first
    const storedError = localStorage.getItem('auth-error');
    if (storedError) {
      const errorInfo = JSON.parse(storedError);
      console.error('🚨 Previous auth error found:', errorInfo);
      
      // Show error to user
      setTimeout(() => {
        alert(`Authentication Error: ${errorInfo.message}\n\nDetails: ${errorInfo.error}\n\nTime: ${errorInfo.timestamp}`);
      }, 1000);
    }
    
    const tokenFromStorage = localStorage.getItem('accessToken');
    const userFromStorage = localStorage.getItem('user');
    
    console.log('🔍 Initializing auth state from localStorage:', {
      tokenFromStorage,
      userFromStorage,
      hasToken: !!tokenFromStorage,
      hasUser: !!userFromStorage,
      hasStoredError: !!storedError
    });
    
    const user = userFromStorage ? JSON.parse(userFromStorage) : null;
    const isAuthenticated = !!tokenFromStorage && !!userFromStorage;
    
    console.log('🔍 Parsed auth state:', {
      user,
      token: tokenFromStorage,
      isAuthenticated
    });
    
    return {
      user,
      token: tokenFromStorage,
      isAuthenticated,
    };
  } catch (error) {
    const errorInfo = {
      type: 'INIT_ERROR',
      message: 'Error initializing auth state from localStorage',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
    
    console.error('❌ Error initializing auth state from localStorage:', error);
    
    // Store error for debugging
    try {
      localStorage.setItem('auth-error', JSON.stringify(errorInfo));
    } catch (storageError) {
      console.error('❌ Cannot store init error:', storageError);
    }
    
    // If there's an error parsing localStorage, clear it and start fresh
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    return {
      user: null,
      token: null,
      isAuthenticated: false,
    };
  }
};

const initialState: AuthState = getInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;

      // Persist to localStorage with error handling
      try {
        localStorage.setItem('accessToken', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        
        // Clear any previous auth errors
        localStorage.removeItem('auth-error');
        
        console.log('✅ Credentials stored in localStorage:', {
          token: action.payload.token,
          user: action.payload.user
        });
      } catch (error) {
        const errorInfo = {
          type: 'STORAGE_ERROR',
          message: 'Failed to store credentials in localStorage',
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
          data: {
            token: action.payload.token,
            user: action.payload.user
          }
        };
        
        console.error('❌ Failed to store credentials in localStorage:', error);
        
        // Store error in localStorage for debugging
        try {
          localStorage.setItem('auth-error', JSON.stringify(errorInfo));
        } catch (storageError) {
          console.error('❌ Cannot even store error info:', storageError);
        }
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      // Clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
  },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
