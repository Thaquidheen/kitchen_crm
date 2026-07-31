/**
 * Header Component
 * HOCH ERP topbar: global search, day/night toggle, reminder notifications, user chip.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Settings, LogOut, User, Menu, AlarmClock, Check, Sun, Moon, ChevronDown } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';
import { useLogoutMutation } from '../../features/auth/authApi';
import { useGetReminderNotificationsQuery, useMarkReminderDoneMutation } from '../../app/baseApi';
import { setTheme, selectCurrentTheme } from '../../features/theme/themeSlice';
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
  const currentTheme = useAppSelector(selectCurrentTheme);
  const [logoutApi] = useLogoutMutation();
  const [bellOpen, setBellOpen] = useState(false);

  const isDay = currentTheme?.type === 'light';

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
      await logoutApi().unwrap();
    } catch {
      // Continue with logout even if backend call fails
    }
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate(ROUTES.LOGIN);
  };

  const userMenuItems = [
    { label: 'Profile', icon: <User size={16} />, onClick: () => toast('Profile clicked') },
    { label: 'Settings', icon: <Settings size={16} />, onClick: () => navigate(ROUTES.SETTINGS) },
    { label: 'Logout', icon: <LogOut size={16} />, onClick: handleLogout, danger: true },
  ];

  const initials = (user?.username || 'U').slice(0, 2).toUpperCase();

  const segBtn = (active: boolean) =>
    `w-8 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
      active
        ? 'bg-background-800 text-text-900 border border-background-500'
        : 'text-text-500 hover:text-text-700 border border-transparent'
    }`;

  return (
    <header className="h-[58px] bg-background-800 border-b border-background-600 flex items-center gap-3.5 px-3 sm:px-5 shrink-0">
      {showMenuButton && (
        <button
          onClick={onMenuClick}
          className="mobile-menu-button p-2 hover:bg-background-700 rounded-lg transition-colors text-text-700 hover:text-text-900 lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Global search */}
      <div className="relative hidden md:block w-[320px] max-w-[40vw]">
        <Search
          size={15}
          className="absolute left-[11px] top-1/2 -translate-y-1/2 text-text-500 pointer-events-none"
        />
        <input
          placeholder="Search customers, projects, invoices…"
          className="w-full h-[34px] pl-[34px] pr-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500"
        />
      </div>

      <div className="flex-1" />

      {/* Day / Night segmented toggle */}
      <div className="flex gap-0.5 p-[3px] rounded-[10px] bg-background-700 border border-background-600">
        <button title="Day mode" className={segBtn(isDay)} onClick={() => dispatch(setTheme('hoch-day'))}>
          <Sun size={15} />
        </button>
        <button title="Night mode" className={segBtn(!isDay)} onClick={() => dispatch(setTheme('hoch-night'))}>
          <Moon size={15} />
        </button>
      </div>

      {/* Notifications (due customer reminders) */}
      <div className="relative">
        <button
          onClick={() => setBellOpen((o) => !o)}
          className="relative w-[34px] h-[34px] rounded-[10px] border border-background-600 bg-background-800 text-text-700 hover:bg-background-700 hover:text-text-900 flex items-center justify-center transition-colors"
          aria-label="Notifications"
        >
          <Bell size={16} />
          {notificationCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary-600 text-background-900 text-[10.5px] font-bold flex items-center justify-center tabular-nums">
              {notificationCount}
            </span>
          )}
        </button>

        {bellOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
            <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-background-800 border border-background-600 rounded-xl shadow-xl z-50">
              <div className="px-4 py-2.5 border-b border-background-600 flex items-center gap-2">
                <AlarmClock size={15} className="text-primary-600" />
                <span className="text-sm font-semibold text-text-900">Today's reminders</span>
                <span className="flex-1" />
                <button
                  onClick={() => {
                    setBellOpen(false);
                    navigate(ROUTES.REMINDERS);
                  }}
                  className="text-xs font-medium text-primary-600 hover:underline"
                >
                  View all
                </button>
              </div>
              {dueReminders.length === 0 ? (
                <p className="px-4 py-6 text-sm text-text-600 text-center">Nothing due today. All caught up!</p>
              ) : (
                <div className="divide-y divide-background-600">
                  {dueReminders.map((r) => (
                    <div key={r.id} className="px-4 py-3 hover:bg-background-700 transition-colors">
                      <button
                        className="text-left w-full"
                        onClick={() => {
                          setBellOpen(false);
                          // Appliance-owned reminders have no customer to navigate to.
                          navigate(
                            r.ownerType === 'APPLIANCE'
                              ? ROUTES.APPLIANCE_QUARTZ
                              : `/customers/${r.ownerId ?? r.customerId}`
                          );
                        }}
                      >
                        <p className="text-sm text-text-900 font-medium">{r.title}</p>
                        <p className="text-xs text-text-600 mt-0.5">
                          {r.ownerName ?? r.customerName} ·{' '}
                          {new Date(r.remindAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
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

      <div className="w-px h-6 bg-background-500 hidden sm:block" />

      {/* User chip */}
      <Dropdown
        trigger={
          <div className="flex items-center gap-2.5 px-1.5 py-1 hover:bg-background-700 rounded-[10px] cursor-pointer transition-colors">
            <div
              className="w-[30px] h-[30px] rounded-full text-primary-600 flex items-center justify-center text-[11.5px] font-bold"
              style={{ background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)' }}
            >
              {initials}
            </div>
            <div className="hidden md:block leading-tight text-left">
              <p className="text-[12.5px] font-semibold text-text-900">{user?.username || 'User'}</p>
              <p className="text-[10.5px] text-text-500">
                {user?.role === 'ROLE_SUPER_ADMIN' ? 'Administrator' : 'Staff'}
              </p>
            </div>
            <ChevronDown size={14} className="text-text-500 hidden md:block" />
          </div>
        }
        items={userMenuItems}
      />
    </header>
  );
};

export default Header;
