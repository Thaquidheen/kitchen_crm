/**
 * Theme Definitions
 * Complete theme configurations for the application
 * Each theme includes full color palette, semantic colors, and component styles
 */

export interface ThemeColors {
  // Background colors
  background: {
    900: string; // Main background
    800: string; // Card background
    700: string; // Secondary background
    600: string; // Borders, dividers
    500: string; // Disabled states
  };
  // Primary accent colors
  primary: {
    900: string;
    800: string;
    700: string;
    600: string;
    500: string;
    400: string;
    300: string;
    200: string;
    100: string;
  };
  // Accent colors
  accent: {
    900: string;
    800: string;
    700: string;
    600: string;
    500: string;
    400: string;
    300: string;
    200: string;
    100: string;
  };
  // Text colors
  text: {
    900: string; // Primary text
    800: string;
    700: string;
    600: string; // Secondary text
    500: string;
    400: string; // Disabled text
  };
  // Semantic colors
  semantic: {
    success: string;
    warning: string;
    info: string;
    error: string;
  };
}

export interface Theme {
  id: string;
  name: string;
  type: 'dark' | 'light';
  description: string;
  colors: ThemeColors;
}

// Dark Purple/Cyan Theme (Current)
export const darkPurpleCyanTheme: Theme = {
  id: 'dark-purple-cyan',
  name: 'Dark Purple/Cyan',
  type: 'dark',
  description: 'Modern dark theme with purple and cyan accents',
  colors: {
    background: {
      900: '#0A0A0F',
      800: '#12121A',
      700: '#1A1A24',
      600: '#252530',
      500: '#3A3A45',
    },
    primary: {
      900: '#4C1D95',
      800: '#5B21B6',
      700: '#6D28D9',
      600: '#7C3AED',
      500: '#8B5CF6',
      400: '#A78BFA',
      300: '#C4B5FD',
      200: '#DDD6FE',
      100: '#EDE9FE',
    },
    accent: {
      900: '#0E7490',
      800: '#155E75',
      700: '#0891B2',
      600: '#06B6D4',
      500: '#22D3EE',
      400: '#67E8F9',
      300: '#A5F3FC',
      200: '#CFFAFE',
      100: '#ECFEFF',
    },
    text: {
      900: '#FFFFFF',
      800: '#F5F5F5',
      700: '#E5E5E5',
      600: '#D5D5D5',
      500: '#C5C5C5',
      400: '#B5B5B5',
    },
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      info: '#3B82F6',
      error: '#EF4444',
    },
  },
};

// Classic Red/Black Theme
export const classicRedBlackTheme: Theme = {
  id: 'classic-red-black',
  name: 'Classic Red/Black',
  type: 'dark',
  description: 'Original red and black theme',
  colors: {
    background: {
      900: '#000000',
      800: '#0A0A0A',
      700: '#1A1A1A',
      600: '#2A2A2A',
      500: '#3A3A3A',
    },
    primary: {
      900: '#8B0000',
      800: '#A50000',
      700: '#C41E3A',
      600: '#DC143C',
      500: '#FF0000',
      400: '#FF4444',
      300: '#FF6666',
      200: '#FF9999',
      100: '#FFCCCC',
    },
    accent: {
      900: '#8B0000',
      800: '#A50000',
      700: '#C41E3A',
      600: '#DC143C',
      500: '#FF0000',
      400: '#FF4444',
      300: '#FF6666',
      200: '#FF9999',
      100: '#FFCCCC',
    },
    text: {
      900: '#FFFFFF',
      800: '#F5F5F5',
      700: '#E5E5E5',
      600: '#D5D5D5',
      500: '#C5C5C5',
      400: '#B5B5B5',
    },
    semantic: {
      success: '#00C853',
      warning: '#FFA726',
      info: '#29B6F6',
      error: '#A50000',
    },
  },
};

// Blue/Teal Dark Theme
export const blueTealDarkTheme: Theme = {
  id: 'blue-teal-dark',
  name: 'Blue/Teal Dark',
  type: 'dark',
  description: 'Professional blue and teal dark theme',
  colors: {
    background: {
      900: '#0F172A',
      800: '#1E293B',
      700: '#334155',
      600: '#475569',
      500: '#64748B',
    },
    primary: {
      900: '#1E3A8A',
      800: '#1E40AF',
      700: '#2563EB',
      600: '#3B82F6',
      500: '#60A5FA',
      400: '#93C5FD',
      300: '#BFDBFE',
      200: '#DBEAFE',
      100: '#EFF6FF',
    },
    accent: {
      900: '#134E4A',
      800: '#155E75',
      700: '#0F766E',
      600: '#14B8A6',
      500: '#2DD4BF',
      400: '#5EEAD4',
      300: '#99F6E4',
      200: '#CCFBF1',
      100: '#F0FDFA',
    },
    text: {
      900: '#FFFFFF',
      800: '#F1F5F9',
      700: '#E2E8F0',
      600: '#CBD5E1',
      500: '#94A3B8',
      400: '#64748B',
    },
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      info: '#3B82F6',
      error: '#EF4444',
    },
  },
};

// Green/Emerald Dark Theme
export const greenEmeraldDarkTheme: Theme = {
  id: 'green-emerald-dark',
  name: 'Green/Emerald Dark',
  type: 'dark',
  description: 'Modern green and emerald dark theme',
  colors: {
    background: {
      900: '#0A1F0A',
      800: '#132713',
      700: '#1A2E1A',
      600: '#243524',
      500: '#2D3F2D',
    },
    primary: {
      900: '#064E3B',
      800: '#065F46',
      700: '#047857',
      600: '#059669',
      500: '#10B981',
      400: '#34D399',
      300: '#6EE7B7',
      200: '#A7F3D0',
      100: '#D1FAE5',
    },
    accent: {
      900: '#065F46',
      800: '#047857',
      700: '#059669',
      600: '#10B981',
      500: '#34D399',
      400: '#6EE7B7',
      300: '#A7F3D0',
      200: '#D1FAE5',
      100: '#ECFDF5',
    },
    text: {
      900: '#FFFFFF',
      800: '#F0FDF4',
      700: '#DCFCE7',
      600: '#BBF7D0',
      500: '#86EFAC',
      400: '#4ADE80',
    },
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      info: '#3B82F6',
      error: '#EF4444',
    },
  },
};

// White Professional Theme
export const whiteProfessionalTheme: Theme = {
  id: 'white-professional',
  name: 'White Professional',
  type: 'light',
  description: 'Clean white backgrounds with professional blue accents',
  colors: {
    background: {
      900: '#FFFFFF',
      800: '#F8F9FA',
      700: '#F1F3F5',
      600: '#E9ECEF',
      500: '#DEE2E6',
    },
    primary: {
      900: '#1E3A8A',
      800: '#1E40AF',
      700: '#2563EB',
      600: '#3B82F6',
      500: '#60A5FA',
      400: '#93C5FD',
      300: '#BFDBFE',
      200: '#DBEAFE',
      100: '#EFF6FF',
    },
    accent: {
      900: '#1E3A8A',
      800: '#1E40AF',
      700: '#2563EB',
      600: '#3B82F6',
      500: '#60A5FA',
      400: '#93C5FD',
      300: '#BFDBFE',
      200: '#DBEAFE',
      100: '#EFF6FF',
    },
    text: {
      900: '#0F172A',
      800: '#1E293B',
      700: '#334155',
      600: '#475569',
      500: '#64748B',
      400: '#94A3B8',
    },
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      info: '#3B82F6',
      error: '#EF4444',
    },
  },
};

// Light Blue Theme
export const lightBlueTheme: Theme = {
  id: 'light-blue',
  name: 'Light Blue',
  type: 'light',
  description: 'Soft light backgrounds with blue primary',
  colors: {
    background: {
      900: '#F8FAFC',
      800: '#F1F5F9',
      700: '#E2E8F0',
      600: '#CBD5E1',
      500: '#94A3B8',
    },
    primary: {
      900: '#1E3A8A',
      800: '#1E40AF',
      700: '#2563EB',
      600: '#3B82F6',
      500: '#60A5FA',
      400: '#93C5FD',
      300: '#BFDBFE',
      200: '#DBEAFE',
      100: '#EFF6FF',
    },
    accent: {
      900: '#0E7490',
      800: '#155E75',
      700: '#0891B2',
      600: '#06B6D4',
      500: '#22D3EE',
      400: '#67E8F9',
      300: '#A5F3FC',
      200: '#CFFAFE',
      100: '#ECFEFF',
    },
    text: {
      900: '#0F172A',
      800: '#1E293B',
      700: '#334155',
      600: '#475569',
      500: '#64748B',
      400: '#94A3B8',
    },
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      info: '#3B82F6',
      error: '#EF4444',
    },
  },
};

// Light Gray Theme
export const lightGrayTheme: Theme = {
  id: 'light-gray',
  name: 'Light Gray',
  type: 'light',
  description: 'Neutral gray backgrounds with purple/blue primary',
  colors: {
    background: {
      900: '#FAFAFA',
      800: '#F5F5F5',
      700: '#EEEEEE',
      600: '#E0E0E0',
      500: '#BDBDBD',
    },
    primary: {
      900: '#4C1D95',
      800: '#5B21B6',
      700: '#6D28D9',
      600: '#7C3AED',
      500: '#8B5CF6',
      400: '#A78BFA',
      300: '#C4B5FD',
      200: '#DDD6FE',
      100: '#EDE9FE',
    },
    accent: {
      900: '#1E3A8A',
      800: '#1E40AF',
      700: '#2563EB',
      600: '#3B82F6',
      500: '#60A5FA',
      400: '#93C5FD',
      300: '#BFDBFE',
      200: '#DBEAFE',
      100: '#EFF6FF',
    },
    text: {
      900: '#212121',
      800: '#424242',
      700: '#616161',
      600: '#757575',
      500: '#9E9E9E',
      400: '#BDBDBD',
    },
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      info: '#3B82F6',
      error: '#EF4444',
    },
  },
};

// HOCH ERP redesign themes: violet accent (#6E56CF), near-black neutrals in night
// mode (accent auto-lightened toward white), soft light-grey day mode.
export const hochNightTheme: Theme = {
  id: 'hoch-night',
  name: 'HOCH Night',
  type: 'dark',
  description: 'HOCH ERP night mode - near-black neutrals with violet accent',
  colors: {
    background: {
      900: '#0C0E12', // page bg
      800: '#13161C', // surfaces / cards
      700: '#1A1E26', // secondary surfaces
      600: '#232833', // borders
      500: '#2F3644', // strong borders / disabled
    },
    primary: {
      900: '#2E2465',
      800: '#3D308A',
      700: '#6E56CF', // base accent
      600: '#9B8AFB', // brightened accent (night acc-eff)
      500: '#A99AFC',
      400: '#B3A4FF',
      300: '#C9BEFF',
      200: '#DFD8FF',
      100: '#EFEBFF',
    },
    accent: {
      900: '#2E2465',
      800: '#3D308A',
      700: '#6E56CF',
      600: '#9B8AFB',
      500: '#A99AFC',
      400: '#B3A4FF',
      300: '#C9BEFF',
      200: '#DFD8FF',
      100: '#EFEBFF',
    },
    text: {
      900: '#E8EAF0', // primary text
      800: '#C7CCDA',
      700: '#99A2B3', // secondary text
      600: '#7A8296',
      500: '#5F6878', // muted
      400: '#4A5261',
    },
    semantic: {
      success: '#52DB93',
      warning: '#F2B457',
      info: '#7DB5FF',
      error: '#F08A8A',
    },
  },
};

export const hochDayTheme: Theme = {
  id: 'hoch-day',
  name: 'HOCH Day',
  type: 'light',
  description: 'HOCH ERP day mode - white surfaces with violet accent',
  colors: {
    background: {
      900: '#F4F5F7', // page bg
      800: '#FFFFFF', // surfaces / cards
      700: '#F2F3F6', // secondary surfaces
      600: '#E5E7EC', // borders
      500: '#D5D9E0', // strong borders
    },
    primary: {
      900: '#3A2E78',
      800: '#4A3A9E',
      700: '#5F49BE',
      600: '#6E56CF', // accent (day: no lightening)
      500: '#8471DB',
      400: '#9B8AE6',
      300: '#B8ACF0',
      200: '#D5CDF7',
      100: '#EEEBFD',
    },
    accent: {
      900: '#3A2E78',
      800: '#4A3A9E',
      700: '#5F49BE',
      600: '#6E56CF',
      500: '#8471DB',
      400: '#9B8AE6',
      300: '#B8ACF0',
      200: '#D5CDF7',
      100: '#EEEBFD',
    },
    text: {
      900: '#171B24',
      800: '#2A3040',
      700: '#5A6373',
      600: '#737D8F',
      500: '#8B93A3',
      400: '#A5ACBA',
    },
    semantic: {
      success: '#137A43',
      warning: '#A97207',
      info: '#1863D6',
      error: '#B93838',
    },
  },
};

// Export all themes
export const themes: Record<string, Theme> = {
  'hoch-night': hochNightTheme,
  'hoch-day': hochDayTheme,
  'dark-purple-cyan': darkPurpleCyanTheme,
  'classic-red-black': classicRedBlackTheme,
  'blue-teal-dark': blueTealDarkTheme,
  'green-emerald-dark': greenEmeraldDarkTheme,
  'white-professional': whiteProfessionalTheme,
  'light-blue': lightBlueTheme,
  'light-gray': lightGrayTheme,
};

// Export theme list
export const themeList: Theme[] = [
  hochNightTheme,
  hochDayTheme,
  darkPurpleCyanTheme,
  classicRedBlackTheme,
  blueTealDarkTheme,
  greenEmeraldDarkTheme,
  whiteProfessionalTheme,
  lightBlueTheme,
  lightGrayTheme,
];

// Default theme (grey day mode)
export const defaultTheme = hochDayTheme;

