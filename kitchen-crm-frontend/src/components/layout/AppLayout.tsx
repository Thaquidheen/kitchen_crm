/**
 * AppLayout Component
 * Main application layout with sidebar, header, and content area
 */

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { lock, selectFinanceKey } from '../../features/finance/financeAccessSlice';
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

  // The concealed reporting module hides again the instant you LEAVE it.
  //
  // "Leaving" has to mean a transition out, not merely "not currently inside". The unlock is
  // dispatched from the header while the user is still on /dashboard, and Redux commits that
  // synchronously while the router's navigation commits in a later transition — so a plain
  // `!isInside` test fired first, re-locked immediately, and the route the navigation landed on
  // was already locked again. The correct passphrase did nothing at all.
  //
  // Tracking the previous location fixes that: locking requires having actually been inside.
  const location = useLocation();
  const dispatch = useAppDispatch();
  const reportingKey = useAppSelector(selectFinanceKey);
  const rawKey = useAppSelector((state) => state.financeAccess.key);
  const wasInsideRef = useRef(false);

  useEffect(() => {
    const p = location.pathname;
    const inside = p === '/finance' || p.startsWith('/finance/');
    if (wasInsideRef.current && !inside && rawKey) {
      dispatch(lock());
    }
    wasInsideRef.current = inside;
  }, [location.pathname, rawKey, dispatch]);

  // An EXPIRED key must be dropped from the store, not just hidden by the selector. prepareHeaders
  // reads the raw value, so a key left lying there kept being attached to every unrelated request
  // for the rest of the session.
  useEffect(() => {
    if (rawKey && !reportingKey) {
      dispatch(lock());
    }
  }, [rawKey, reportingKey, dispatch]);

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
