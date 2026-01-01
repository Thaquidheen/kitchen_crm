/**
 * Sidebar Component
 * Collapsible navigation sidebar with menu items
 */

import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  FolderKanban,
  CreditCard,
  Palette,
  Hammer,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
  Building2,
} from 'lucide-react';
import clsx from 'clsx';
import { ROUTES } from '../../routes/routes.config';
import { selectCurrentTheme } from '../../features/theme/themeSlice';

export interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  adminOnly?: boolean;
}

export interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: 'Customers',
    path: ROUTES.CUSTOMERS,
    icon: <Users size={20} />,
  },
  {
    label: 'Design Phase',
    path: ROUTES.DESIGN_PHASE,
    icon: <Palette size={20} />,
  },
  {
    label: 'Production',
    path: ROUTES.PRODUCTION,
    icon: <Hammer size={20} />,
  },
  {
    label: 'Products',
    path: ROUTES.PRODUCTS,
    icon: <Package size={20} />,
  },
  {
    label: 'Quotations',
    path: ROUTES.QUOTATIONS,
    icon: <FileText size={20} />,
  },
  {
    label: 'Projects',
    path: ROUTES.PROJECTS,
    icon: <FolderKanban size={20} />,
  },
  {
    label: 'Payments',
    path: ROUTES.PAYMENTS,
    icon: <CreditCard size={20} />,
  },
  {
    label: 'Vendors',
    path: ROUTES.VENDORS,
    icon: <Store size={20} />,
  },
  {
    label: 'Architects',
    path: ROUTES.ARCHITECTS,
    icon: <Building2 size={20} />,
  },
  {
    label: 'Staff',
    path: ROUTES.STAFF,
    icon: <Users size={20} />,
    adminOnly: true,
  },
  {
    label: 'Settings',
    path: ROUTES.SETTINGS,
    icon: <Settings size={20} />,
    adminOnly: true,
  },
];

export const Sidebar = ({ isCollapsed, onToggle, isMobileOpen = false, onMobileClose }: SidebarProps) => {
  const location = useLocation();
  const currentUser = useAppSelector((state) => state.auth.user);
  const currentTheme = useAppSelector(selectCurrentTheme);
  const isSuperAdmin = currentUser?.role === 'ROLE_SUPER_ADMIN';

  // Create dynamic gradient for active state based on current theme
  const activeGradient = useMemo(() => {
    if (!currentTheme?.colors) {
      // Fallback gradient if theme is not loaded
      return 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)';
    }
    const { primary } = currentTheme.colors;
    // Create gradient from primary-600 to primary-500
    return `linear-gradient(135deg, ${primary[600]} 0%, ${primary[500]} 100%)`;
  }, [currentTheme]);

  // Get active text color from theme
  const activeTextColor = useMemo(() => {
    if (!currentTheme?.colors) {
      return '#FFFFFF';
    }
    return currentTheme.colors.text[900];
  }, [currentTheme]);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileOpen && !target.closest('.sidebar-container') && !target.closest('.mobile-menu-button')) {
        onMobileClose?.();
      }
    };

    if (isMobileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isMobileOpen, onMobileClose]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          'sidebar-container h-screen bg-background-800 border-r-2 border-background-700 transition-all duration-300 flex flex-col z-50',
          // Mobile: overlay, hidden by default, shown when isMobileOpen
          'fixed md:relative inset-y-0 left-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          // Desktop: collapsed/expanded width
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b-2 border-background-700">
        {!isCollapsed && (
          <h1 className="text-xl font-heading font-bold text-text-900">
            HOCH
          </h1>
        )}
        <button
          onClick={onToggle}
          className="p-2 hover:bg-background-600 rounded-lg transition-colors text-text-700 hover:text-text-900"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {menuItems
            .filter((item) => !item.adminOnly || isSuperAdmin)
            .map((item) => {
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-3 rounded-lg transition-all group sidebar-nav-item',
                      active
                        ? 'text-text-900'
                        : 'text-text-700 hover:bg-background-600 hover:text-text-900'
                    )}
                    style={
                      active
                        ? {
                            background: activeGradient,
                            color: activeTextColor,
                          }
                        : undefined
                    }
                    title={isCollapsed ? item.label : undefined}
                    onClick={() => {
                      // Close mobile sidebar when clicking a link
                      if (isMobileOpen) {
                        onMobileClose?.();
                      }
                    }}
                  >
                    <span
                      style={active ? { color: activeTextColor } : undefined}
                      className={clsx(!active && 'text-text-700')}
                    >
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 font-medium">{item.label}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-primary-900 text-text-900 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t-2 border-background-700">
        {!isCollapsed ? (
          <div className="text-xs text-text-600 text-center">
            <p>HOCH v1.0.0</p>
            <p className="mt-1">© 2025 All rights reserved</p>
          </div>
        ) : (
          <div className="text-xs text-text-600 text-center">
            <p>v1.0</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default Sidebar;
