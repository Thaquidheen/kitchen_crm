/**
 * Header Component
 * App header with breadcrumbs, search, notifications, and user menu
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Settings, LogOut, User, Menu, AlarmClock, Check } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';
import { useLogoutMutation } from '../../features/auth/authApi';
import { useGetReminderNotificationsQuery, useMarkReminderDoneMutation } from '../../app/baseApi';
import { ROUTES } from '../../routes/routes.config';
import { Dropdown } from '../ui';
import toast from 'react-hot-toast';

export interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export const Header = ({ onMenuClick, showMenuButton = false }: HeaderProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [logoutApi] = useLogoutMutation();
  const [bellOpen, setBellOpen] = useState(false);

  // Due customer reminders feed the bell; refreshed every 60s
  const { data: notifData } = useGetReminderNotificationsQuery(undefined, {
    pollingInterval: 60000,
    skip: !user,
  });
  const [markReminderDone] = useMarkReminderDoneMutation();
  const dueReminders: any[] = notifData?.reminders ?? [];
  const notificationCount = notifData?.count ?? 0;

  const handleLogout = async () => {
    try {
      // Call backend to blacklist token
      await logoutApi().unwrap();
    } catch {
      // Continue with logout even if backend call fails
    }
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate(ROUTES.LOGIN);
  };

  const userMenuItems = [
    {
      label: 'Profile',
      icon: <User size={16} />,
      onClick: () => toast('Profile clicked'),
    },
    {
      label: 'Settings',
      icon: <Settings size={16} />,
      onClick: () => toast('Settings clicked'),
    },
    {
      label: 'Logout',
      icon: <LogOut size={16} />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <header className="h-14 sm:h-16 bg-background-800 border-b-2 border-background-700 flex items-center justify-between px-3 sm:px-4 md:px-6">
      {/* Left Section */}
      <div className="flex items-center gap-2 sm:gap-4">
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
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications (due customer reminders) */}
        <div className="relative">
          <button
            onClick={() => setBellOpen((o) => !o)}
            className="relative p-1.5 sm:p-2 hover:bg-background-700 rounded-lg transition-colors text-text-700 hover:text-text-900"
            aria-label="Notifications"
          >
            <Bell size={18} className="sm:w-5 sm:h-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-700 text-text-900 text-xs font-semibold rounded-full flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-background-800 border border-background-600 rounded-lg shadow-xl z-50">
                <div className="px-4 py-2.5 border-b border-background-600 flex items-center gap-2">
                  <AlarmClock size={15} className="text-primary-600" />
                  <span className="text-sm font-semibold text-text-900">Reminders due</span>
                </div>
                {dueReminders.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-text-600 text-center">No reminders due. All caught up!</p>
                ) : (
                  <div className="divide-y divide-background-600">
                    {dueReminders.map((r) => (
                      <div key={r.id} className="px-4 py-3 hover:bg-background-700 transition-colors">
                        <button
                          className="text-left w-full"
                          onClick={() => {
                            setBellOpen(false);
                            navigate(`/customers/${r.customerId}`);
                          }}
                        >
                          <p className="text-sm text-text-900 font-medium">{r.title}</p>
                          <p className="text-xs text-text-600 mt-0.5">
                            {r.customerName} ·{' '}
                            {new Date(r.remindAt).toLocaleString('en-IN', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await markReminderDone(r.id).unwrap();
                              toast.success('Reminder marked done');
                            } catch {
                              toast.error('Failed to mark done');
                            }
                          }}
                          className="mt-1.5 inline-flex items-center gap-1 text-xs text-success hover:underline"
                        >
                          <Check size={12} /> Mark done
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

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
