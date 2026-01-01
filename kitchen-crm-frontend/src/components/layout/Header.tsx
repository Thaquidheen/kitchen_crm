/**
 * Header Component
 * App header with breadcrumbs, search, notifications, and user menu
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Search, Settings, LogOut, User, Menu } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';
import { ROUTES } from '../../routes/routes.config';
import { Dropdown, Badge } from '../ui';
import toast from 'react-hot-toast';

export interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export const Header = ({ onMenuClick, showMenuButton = false }: HeaderProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [notificationCount] = useState(3);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate(ROUTES.LOGIN);
  };

  const userMenuItems = [
    {
      label: 'Profile',
      icon: <User size={16} />,
      onClick: () => toast.info('Profile clicked'),
    },
    {
      label: 'Settings',
      icon: <Settings size={16} />,
      onClick: () => toast.info('Settings clicked'),
    },
    {
      label: 'Logout',
      icon: <LogOut size={16} />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <header className="h-16 bg-background-800 border-b-2 border-background-700 flex items-center justify-between px-6">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className="mobile-menu-button p-2 hover:bg-background-700 rounded-lg transition-colors text-text-700 hover:text-text-900 lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Search Bar */}
        <div className="hidden md:flex items-center gap-2 bg-background-700 px-4 py-2 rounded-lg border border-background-600 focus-within:border-primary-700 transition-all min-w-[300px]">
          <Search size={18} className="text-text-600" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-text-900 placeholder:text-text-600 w-full"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-background-700 rounded-lg transition-colors text-text-700 hover:text-text-900">
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-700 text-text-900 text-xs font-semibold rounded-full flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>

        {/* User Menu */}
        <Dropdown
          trigger={
            <div className="flex items-center gap-3 px-3 py-2 hover:bg-background-700 rounded-lg cursor-pointer transition-colors">
              <div className="w-8 h-8 bg-primary-700 rounded-full flex items-center justify-center text-text-900 font-semibold">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-text-900">
                  {user?.username || 'User'}
                </p>
                <p className="text-xs text-text-600">
                  {user?.role === 'ROLE_SUPER_ADMIN' ? 'Super Admin' : 'Staff'}
                </p>
              </div>
            </div>
          }
          items={userMenuItems}
          align="right"
        />
      </div>
    </header>
  );
};

export default Header;
