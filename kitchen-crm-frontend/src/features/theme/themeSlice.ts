/**
 * Theme Redux Slice
 * Manages theme state and persistence
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { defaultTheme, themes, type Theme } from '../../styles/themes';

const THEME_STORAGE_KEY = 'app-theme';

// Load theme from localStorage or use default
const loadThemeFromStorage = (): string => {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme && savedTheme in themes) {
      return savedTheme;
    }
  } catch (error) {
    console.error('Failed to load theme from localStorage:', error);
  }
  return defaultTheme.id;
};

interface ThemeState {
  currentThemeId: string;
  currentTheme: Theme;
}

const initialState: ThemeState = {
  currentThemeId: loadThemeFromStorage(),
  currentTheme: defaultTheme,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<string>) => {
      state.currentThemeId = action.payload;
      // Theme object will be loaded in ThemeProvider
      try {
        localStorage.setItem(THEME_STORAGE_KEY, action.payload);
      } catch (error) {
        console.error('Failed to save theme to localStorage:', error);
      }
    },
    setThemeObject: (state, action: PayloadAction<Theme>) => {
      state.currentTheme = action.payload;
    },
    resetTheme: (state) => {
      state.currentThemeId = defaultTheme.id;
      state.currentTheme = defaultTheme;
      try {
        localStorage.setItem(THEME_STORAGE_KEY, defaultTheme.id);
      } catch (error) {
        console.error('Failed to save theme to localStorage:', error);
      }
    },
  },
});

export const { setTheme, setThemeObject, resetTheme } = themeSlice.actions;

// Selectors
export const selectCurrentThemeId = (state: { theme: ThemeState }) =>
  state.theme.currentThemeId;
export const selectCurrentTheme = (state: { theme: ThemeState }) =>
  state.theme.currentTheme;

export default themeSlice.reducer;

