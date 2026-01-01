/**
 * Theme Provider Component
 * Applies CSS variables based on current theme
 */

import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { selectCurrentThemeId, setThemeObject } from './themeSlice';
import { themes, type Theme } from '../../styles/themes';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const dispatch = useAppDispatch();
  const currentThemeId = useAppSelector(selectCurrentThemeId);
  const currentTheme: Theme = themes[currentThemeId] || themes['dark-purple-cyan'];

  // Update theme object in Redux when theme ID changes
  useEffect(() => {
    dispatch(setThemeObject(currentTheme));
  }, [currentThemeId, dispatch, currentTheme]);

  // Apply CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;
    const colors = currentTheme.colors;

    // Background colors
    root.style.setProperty('--color-background-900', colors.background[900]);
    root.style.setProperty('--color-background-800', colors.background[800]);
    root.style.setProperty('--color-background-700', colors.background[700]);
    root.style.setProperty('--color-background-600', colors.background[600]);
    root.style.setProperty('--color-background-500', colors.background[500]);

    // Primary colors
    root.style.setProperty('--color-primary-900', colors.primary[900]);
    root.style.setProperty('--color-primary-800', colors.primary[800]);
    root.style.setProperty('--color-primary-700', colors.primary[700]);
    root.style.setProperty('--color-primary-600', colors.primary[600]);
    root.style.setProperty('--color-primary-500', colors.primary[500]);
    root.style.setProperty('--color-primary-400', colors.primary[400]);
    root.style.setProperty('--color-primary-300', colors.primary[300]);
    root.style.setProperty('--color-primary-200', colors.primary[200]);
    root.style.setProperty('--color-primary-100', colors.primary[100]);

    // Accent colors
    root.style.setProperty('--color-accent-900', colors.accent[900]);
    root.style.setProperty('--color-accent-800', colors.accent[800]);
    root.style.setProperty('--color-accent-700', colors.accent[700]);
    root.style.setProperty('--color-accent-600', colors.accent[600]);
    root.style.setProperty('--color-accent-500', colors.accent[500]);
    root.style.setProperty('--color-accent-400', colors.accent[400]);
    root.style.setProperty('--color-accent-300', colors.accent[300]);
    root.style.setProperty('--color-accent-200', colors.accent[200]);
    root.style.setProperty('--color-accent-100', colors.accent[100]);

    // Text colors
    root.style.setProperty('--color-text-900', colors.text[900]);
    root.style.setProperty('--color-text-800', colors.text[800]);
    root.style.setProperty('--color-text-700', colors.text[700]);
    root.style.setProperty('--color-text-600', colors.text[600]);
    root.style.setProperty('--color-text-500', colors.text[500]);
    root.style.setProperty('--color-text-400', colors.text[400]);

    // Semantic colors
    root.style.setProperty('--color-success', colors.semantic.success);
    root.style.setProperty('--color-warning', colors.semantic.warning);
    root.style.setProperty('--color-info', colors.semantic.info);
    root.style.setProperty('--color-error', colors.semantic.error);

    // Set theme type attribute for conditional styling
    root.setAttribute('data-theme', currentTheme.type);
    root.setAttribute('data-theme-id', currentTheme.id);
  }, [currentTheme]);

  return <>{children}</>;
}

