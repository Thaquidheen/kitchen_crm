/**
 * Auth slice - Manages authentication state
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../../types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
  isAuthenticated: boolean;
  rememberMe: boolean;
}

// Storage key constants
const STORAGE_KEYS = {
  TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  TOKEN_EXPIRY: 'tokenExpiry',
  USER: 'user',
  REMEMBER_ME: 'rememberMe',
};

// Helper to get storage based on rememberMe preference
const getStorage = (persistent: boolean): Storage => {
  return persistent ? localStorage : sessionStorage;
};

// Initialize state from storage (check both localStorage and sessionStorage)
const getInitialState = (): AuthState => {
  try {
    // Check if user opted for persistent storage
    const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
    const storage = getStorage(rememberMe);

    // Try primary storage first
    let tokenFromStorage = storage.getItem(STORAGE_KEYS.TOKEN);
    let refreshTokenFromStorage = storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    let tokenExpiryFromStorage = storage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    let userFromStorage = storage.getItem(STORAGE_KEYS.USER);

    // Fallback to the other storage if not found
    if (!tokenFromStorage && !userFromStorage) {
      const fallbackStorage = getStorage(!rememberMe);
      tokenFromStorage = fallbackStorage.getItem(STORAGE_KEYS.TOKEN);
      refreshTokenFromStorage = fallbackStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      tokenExpiryFromStorage = fallbackStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
      userFromStorage = fallbackStorage.getItem(STORAGE_KEYS.USER);
    }

    const user = userFromStorage ? JSON.parse(userFromStorage) : null;
    const tokenExpiry = tokenExpiryFromStorage ? parseInt(tokenExpiryFromStorage, 10) : null;
    const isAuthenticated = !!tokenFromStorage && !!user;

    return {
      user,
      token: tokenFromStorage,
      refreshToken: refreshTokenFromStorage,
      tokenExpiry,
      isAuthenticated,
      rememberMe,
    };
  } catch {
    // If there's an error parsing storage, clear everything and start fresh
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    sessionStorage.removeItem(STORAGE_KEYS.USER);

    return {
      user: null,
      token: null,
      refreshToken: null,
      tokenExpiry: null,
      isAuthenticated: false,
      rememberMe: false,
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
      action: PayloadAction<{
        user: User;
        token: string;
        refreshToken?: string;
        expiresIn?: number;
        rememberMe?: boolean;
      }>
    ) => {
      const { user, token, refreshToken, expiresIn, rememberMe = false } = action.payload;

      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken || null;
      state.tokenExpiry = expiresIn ? Date.now() + expiresIn * 1000 : null;
      state.isAuthenticated = true;
      state.rememberMe = rememberMe;

      // Clear both storages first to avoid stale data
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
      localStorage.removeItem(STORAGE_KEYS.USER);
      sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
      sessionStorage.removeItem(STORAGE_KEYS.USER);

      // Store in appropriate storage based on rememberMe
      const storage = getStorage(rememberMe);

      try {
        storage.setItem(STORAGE_KEYS.TOKEN, token);
        if (refreshToken) {
          storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }
        if (state.tokenExpiry) {
          storage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, String(state.tokenExpiry));
        }
        storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

        // Always store rememberMe preference in localStorage
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, String(rememberMe));
      } catch {
        // Silently fail if storage is not available
      }
    },
    tokenRefreshed: (
      state,
      action: PayloadAction<{
        token: string;
        refreshToken?: string;
        expiresIn?: number;
      }>
    ) => {
      const { token, refreshToken, expiresIn } = action.payload;

      state.token = token;
      if (refreshToken) {
        state.refreshToken = refreshToken;
      }
      state.tokenExpiry = expiresIn ? Date.now() + expiresIn * 1000 : null;

      // Update in the appropriate storage
      const storage = getStorage(state.rememberMe);
      try {
        storage.setItem(STORAGE_KEYS.TOKEN, token);
        if (refreshToken) {
          storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
        }
        if (state.tokenExpiry) {
          storage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, String(state.tokenExpiry));
        }
      } catch {
        // Silently fail if storage is not available
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.tokenExpiry = null;
      state.isAuthenticated = false;
      state.rememberMe = false;

      // Clear both storages
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
      sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
      sessionStorage.removeItem(STORAGE_KEYS.USER);
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;

      // Update in the appropriate storage
      const storage = getStorage(state.rememberMe);
      try {
        storage.setItem(STORAGE_KEYS.USER, JSON.stringify(action.payload));
      } catch {
        // Silently fail if storage is not available
      }
    },
  },
});

export const { setCredentials, tokenRefreshed, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
