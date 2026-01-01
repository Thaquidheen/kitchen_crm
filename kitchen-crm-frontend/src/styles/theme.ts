/**
 * HOCH - Beautiful Dark Theme Configuration
 *
 * This file contains all theme constants for consistent styling across the application.
 */

export const theme = {
  colors: {
    // Black shades - Enhanced dark theme
    black: {
      900: '#0A0A0F',  // Rich dark blue-black - Main backgrounds, headers
      800: '#12121A',  // Deep dark - Card backgrounds
      700: '#1A1A24',  // Dark gray-blue - Secondary backgrounds
      600: '#252530',  // Medium dark - Borders, dividers
      500: '#3A3A45',  // Medium - Disabled states
    },

    // Primary accent colors - Indigo/Violet/Purple
    primary: {
      900: '#4C1D95',  // Deep purple - Critical actions
      800: '#5B21B6',  // Dark violet - Error states
      700: '#6D28D9',  // Violet - Primary actions, CTAs
      600: '#7C3AED',  // Purple - Hover states, active links
      500: '#8B5CF6',  // Light purple - Accents, notifications
      400: '#A78BFA',  // Lighter purple - Warnings
      300: '#C4B5FD',  // Soft purple - Info highlights
      200: '#DDD6FE',  // Pale purple - Subtle backgrounds
      100: '#EDE9FE',  // Very light purple - Hover effects
    },

    // Accent colors - Cyan/Blue
    accent: {
      900: '#0E7490',  // Deep cyan - Dark accents
      800: '#155E75',  // Dark teal - Secondary dark
      700: '#0891B2',  // Cyan - Primary accents
      600: '#06B6D4',  // Bright cyan - Hover states
      500: '#22D3EE',  // Light cyan - Accents
      400: '#67E8F9',  // Lighter cyan - Highlights
      300: '#A5F3FC',  // Soft cyan - Subtle backgrounds
      200: '#CFFAFE',  // Pale cyan - Very subtle
      100: '#ECFEFF',  // Very light cyan - Hover effects
    },

    // White shades
    white: {
      900: '#FFFFFF',  // Pure white - Primary text, content
      800: '#F5F5F5',  // Off-white - Card backgrounds (light mode)
      700: '#E5E5E5',  // Light gray - Borders
      600: '#D5D5D5',  // Medium light - Dividers
      500: '#C5C5C5',  // Medium - Secondary text
      400: '#B5B5B5',  // Gray - Disabled text
    },

    // Semantic colors
    semantic: {
      success: '#10B981',   // Emerald green - Success messages
      warning: '#F59E0B',   // Amber - Warning messages
      info: '#3B82F6',      // Blue - Info messages
      error: '#EF4444',     // Red - Error messages (kept for errors)
    },

    // Gradients - Beautiful modern gradients
    gradients: {
      primary: 'linear-gradient(135deg, #0A0A0F 0%, #1A1A24 100%)',
      accent: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)',
      card: 'linear-gradient(145deg, #12121A 0%, #1A1A24 100%)',
      hero: 'linear-gradient(180deg, #0A0A0F 0%, #1A1A24 50%, #0A0A0F 100%)',
      purple: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
      cyan: 'linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)',
    },
  },

  typography: {
    fontFamily: {
      primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      heading: "'Poppins', sans-serif",
      mono: "'Fira Code', 'Courier New', monospace",
    },
    fontSize: {
      xs: '0.75rem',    // 12px - Small labels, captions
      sm: '0.875rem',   // 14px - Secondary text
      base: '1rem',     // 16px - Body text
      lg: '1.125rem',   // 18px - Large body text
      xl: '1.25rem',    // 20px - Small headings
      '2xl': '1.5rem',  // 24px - Section headings
      '3xl': '1.875rem',// 30px - Page headings
      '4xl': '2.25rem', // 36px - Hero headings
      '5xl': '3rem',    // 48px - Display headings
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem',   // 96px
  },

  shadows: {
    sm: '0 2px 4px rgba(99, 102, 241, 0.1)',
    md: '0 4px 8px rgba(99, 102, 241, 0.15)',
    lg: '0 8px 16px rgba(99, 102, 241, 0.2)',
    xl: '0 12px 24px rgba(99, 102, 241, 0.25)',
    '2xl': '0 20px 40px rgba(99, 102, 241, 0.3)',
    primary: '0 4px 14px rgba(139, 92, 246, 0.4)',
    'primary-lg': '0 8px 20px rgba(139, 92, 246, 0.5)',
    accent: '0 4px 14px rgba(6, 182, 212, 0.4)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
  },

  borderRadius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },

  // Component-specific theme
  components: {
    button: {
      primary: {
        bg: '#6366F1',
        hoverBg: '#7C3AED',
        activeBg: '#5B21B6',
        text: '#FFFFFF',
        shadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
        border: 'transparent',
      },
      secondary: {
        bg: '#1A1A24',
        hoverBg: '#252530',
        activeBg: '#12121A',
        text: '#FFFFFF',
        border: '#6366F1',
        shadow: '0 4px 8px rgba(99, 102, 241, 0.15)',
      },
      danger: {
        bg: '#EF4444',
        hoverBg: '#DC2626',
        activeBg: '#B91C1C',
        text: '#FFFFFF',
        shadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
      },
      ghost: {
        bg: 'transparent',
        hoverBg: '#1A1A24',
        activeBg: '#252530',
        text: '#FFFFFF',
        border: '#E5E5E5',
      },
    },
    card: {
      bg: '#12121A',
      border: '#252530',
      shadow: '0 4px 8px rgba(99, 102, 241, 0.15)',
      hoverShadow: '0 8px 16px rgba(99, 102, 241, 0.2)',
      headerBg: 'linear-gradient(145deg, #1A1A24 0%, #12121A 100%)',
      accentBorder: '#6366F1',
    },
    table: {
      headerBg: '#0A0A0F',
      headerText: '#8B5CF6',
      rowBg: '#12121A',
      rowAlternateBg: '#1A1A24',
      rowHoverBg: '#1A1A24',
      border: '#252530',
      text: '#FFFFFF',
      selectedRowBg: 'rgba(139, 92, 246, 0.1)',
    },
    input: {
      bg: '#1A1A24',
      border: '#252530',
      focusBorder: '#6366F1',
      errorBorder: '#EF4444',
      text: '#FFFFFF',
      placeholder: '#C5C5C5',
      label: '#F5F5F5',
    },
    sidebar: {
      bg: '#0A0A0F',
      activeBg: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
      text: '#FFFFFF',
      activeText: '#FFFFFF',
      hoverBg: '#1A1A24',
      border: '#6366F1',
    },
    badge: {
      success: { bg: '#10B981', text: '#FFFFFF' },
      warning: { bg: '#F59E0B', text: '#000000' },
      error: { bg: '#EF4444', text: '#FFFFFF' },
      info: { bg: '#3B82F6', text: '#FFFFFF' },
      default: { bg: '#252530', text: '#FFFFFF' },
    },
  },
} as const;

export type Theme = typeof theme;

export default theme;
