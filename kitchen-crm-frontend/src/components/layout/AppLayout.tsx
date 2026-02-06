/**
 * AppLayout Component
 * Main application layout with sidebar, header, and content area
 */

import { useState, useEffect, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

export interface AppLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

export const AppLayout = ({ children, showFooter = false }: AppLayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Auto-collapse sidebar on mobile and handle resize
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768; // md breakpoint
      
      if (isMobile) {
        // On mobile, always collapse and close sidebar
        setIsSidebarCollapsed(true);
        setIsMobileOpen(false);
      } else {
        // On desktop, restore collapsed state if needed
        // Keep current state but ensure mobile menu is closed
        setIsMobileOpen(false);
      }
    };

    // Set initial state
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // On mobile, toggle overlay menu
      setIsMobileOpen(!isMobileOpen);
    } else {
      // On desktop, toggle collapsed state
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  return (
    <div className="flex h-screen bg-background-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
        isMobileOpen={isMobileOpen}
        onMobileClose={closeMobileSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          onMenuClick={toggleSidebar}
          showMenuButton
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-4 md:p-6">{children}</div>
        </main>

        {/* Footer (optional) */}
        {showFooter && <Footer />}
      </div>
    </div>
  );
};

export default AppLayout;
