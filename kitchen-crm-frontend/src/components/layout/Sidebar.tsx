/**
 * Sidebar Component
 * HOCH ERP shell: grouped navigation with uppercase section labels,
 * collapsible to an icon rail. Active item gets a soft accent fill.
 */

import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  FolderKanban,
  Palette,
  Hammer,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
  Building2,
  IdCard,
  Refrigerator,
  BellRing,
} from 'lucide-react';
import clsx from 'clsx';
import logo from '../../assets/logo.png';
import { ROUTES } from '../../routes/routes.config';

export interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  adminOnly?: boolean;
}

export interface NavGroup {
  label: string;
  items: MenuItem[];
}

export interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const ACCENT_SOFT = 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)';

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', path: ROUTES.DASHBOARD, icon: <LayoutDashboard size={18} /> }],
  },
  {
    label: 'Sales',
    items: [
      { label: 'Customers', path: ROUTES.CUSTOMERS, icon: <Users size={18} /> },
      { label: 'Quotations', path: ROUTES.QUOTATIONS, icon: <FileText size={18} /> },
      { label: 'Appliance & Quartz', path: ROUTES.APPLIANCE_QUARTZ, icon: <Refrigerator size={18} /> },
      { label: 'Reminders', path: ROUTES.REMINDERS, icon: <BellRing size={18} /> },
      { label: 'Projects', path: ROUTES.PROJECTS, icon: <FolderKanban size={18} /> },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Design Phase', path: ROUTES.DESIGN_PHASE, icon: <Palette size={18} /> },
      { label: 'Production', path: ROUTES.PRODUCTION, icon: <Hammer size={18} /> },
      { label: 'Products', path: ROUTES.PRODUCTS, icon: <Package size={18} /> },
    ],
  },
  {
    label: 'Finance',
    items: [
      { label: 'Vendors', path: ROUTES.VENDORS, icon: <Store size={18} /> },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Architects', path: ROUTES.ARCHITECTS, icon: <Building2 size={18} /> },
      { label: 'Staff', path: ROUTES.STAFF, icon: <IdCard size={18} />, adminOnly: true },
    ],
  },
  {
    label: 'System',
    items: [{ label: 'Settings', path: ROUTES.SETTINGS, icon: <Settings size={18} />, adminOnly: true }],
  },
];

export const Sidebar = ({ isCollapsed, onToggle, isMobileOpen = false, onMobileClose }: SidebarProps) => {
  const location = useLocation();
  const currentUser = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = currentUser?.role === 'ROLE_SUPER_ADMIN';

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

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
          'sidebar-container h-screen bg-background-800 border-r border-background-600 transition-all duration-200 flex flex-col z-50',
          'fixed md:relative inset-y-0 left-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          isCollapsed ? 'w-16' : 'w-[238px]'
        )}
      >
        {/* Brand */}
        <div
          className={clsx(
            'border-b border-background-600',
            isCollapsed
              ? 'flex flex-col items-center gap-2 py-3 px-2'
              : 'flex items-center gap-2.5 px-3.5 min-h-[58px]'
          )}
        >
          <img
            src={logo}
            alt="THE HOCH - Kitchens & Wardrobes"
            className={clsx(
              'brand-logo object-contain shrink-0',
              isCollapsed ? 'h-6 max-w-[44px]' : 'h-9 max-w-[160px]'
            )}
          />
          <button
            onClick={onToggle}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={clsx(
              'w-[26px] h-[26px] rounded-lg flex items-center justify-center text-text-500 hover:text-text-900 hover:bg-background-600 transition-colors shrink-0',
              !isCollapsed && 'ml-auto'
            )}
          >
            {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 flex flex-col gap-4">
          {navGroups.map((group) => {
            const items = group.items.filter((item) => !item.adminOnly || isSuperAdmin);
            if (items.length === 0) return null;
            return (
              <div key={group.label} className="flex flex-col gap-0.5">
                {!isCollapsed && (
                  <div className="text-[10.5px] font-semibold tracking-[0.09em] uppercase text-text-500 px-2.5 mb-1">
                    {group.label}
                  </div>
                )}
                {items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={item.label}
                      onClick={() => {
                        if (isMobileOpen) onMobileClose?.();
                      }}
                      className={clsx(
                        'flex items-center gap-2.5 rounded-[9px] text-[13.5px] whitespace-nowrap transition-colors sidebar-nav-item',
                        isCollapsed ? 'justify-center py-2.5 px-0' : 'py-2 px-2.5',
                        active
                          ? 'font-semibold text-primary-600'
                          : 'font-medium text-text-700 hover:bg-background-700 hover:text-text-900'
                      )}
                      style={active ? { background: ACCENT_SOFT } : undefined}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      {!isCollapsed && <span className="flex-1 overflow-hidden text-ellipsis">{item.label}</span>}
                      {!isCollapsed && item.badge && (
                        <span className="ml-auto text-[11px] font-semibold px-1.5 py-px rounded-full bg-background-600 text-text-700 tabular-nums">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="px-4 py-3.5 border-t border-background-600 text-[11px] text-text-500 leading-relaxed">
            HOCH ERP v2.0
            <br />
            © 2026 All rights reserved
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;
