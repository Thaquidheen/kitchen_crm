/**
 * RouterLayout Component
 * Wraps the entire application with global providers (Theme, Toast notifications)
 */

import { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '../features/theme/ThemeProvider';

interface RouterLayoutProps {
  children: ReactNode;
}

export const RouterLayout = ({ children }: RouterLayoutProps) => {
  return (
    <ThemeProvider>
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-background-800)',
            color: 'var(--color-text-900)',
            border: '1px solid var(--color-primary-700)',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-success)',
              secondary: 'var(--color-text-900)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-error)',
              secondary: 'var(--color-text-900)',
            },
          },
        }}
      />
      {children}
    </ThemeProvider>
  );
};
