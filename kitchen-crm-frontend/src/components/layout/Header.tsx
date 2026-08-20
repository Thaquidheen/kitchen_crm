/**
 * Header Component
 * HOCH ERP topbar: global search, day/night toggle, reminder notifications, user chip.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Settings, LogOut, KeyRound, Menu, Sun, Moon, ChevronDown } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';
import { useLogoutMutation } from '../../features/auth/authApi';
import { setTheme, selectCurrentTheme } from '../../features/theme/themeSlice';
import { ROUTES } from '../../routes/routes.config';
import { Dropdown } from '../ui';
import { ChangePasswordModal } from '../../features/auth/components/ChangePasswordModal';
import { NotificationBell } from './NotificationBell';
import { useUnlockReportingMutation } from '../../features/finance/financeAccessAPI';
import { unlocked } from '../../features/finance/financeAccessSlice';
import toast from 'react-hot-toast';

/**
 * Marker that turns a search into an unlock attempt: type `#<passphrase>` and press Enter.
 * Deliberately not a secret — the passphrase is the secret, and it is verified server-side.
 */
const UNLOCK_PREFIX = '#';

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
  const [unlockReporting] = useUnlockReportingMutation();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState('');

  const isDay = currentTheme?.type === 'light';

  /**
   * Enter in the search box attempts the reporting-module unlock.
   *
   * Failure is deliberately silent — no toast, no shake, no message. Any feedback would tell
   * someone experimenting here that there is something to find. The field is cleared on both
   * outcomes so a phrase is never left sitting in the box, and only super admins even reach the
   * endpoint (it 403s otherwise), so a staff member typing anything sees nothing regardless.
   */
  const handleSearchKey = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const typed = searchDraft.trim();
    // Only a deliberate attempt counts. The box genuinely invites searching ("Search customers,
    // quotations, invoices…"), and without this marker five ordinary searches — a name, a phone
    // number, an invoice no. — would each burn an unlock attempt and lock the owner out for ten
    // minutes. The marker is not a secret and adds nothing to the concealment; it exists purely so
    // normal typing never reaches the throttle.
    if (!typed.startsWith(UNLOCK_PREFIX)) return;
    const phrase = typed.slice(UNLOCK_PREFIX.length).trim();
    setSearchDraft('');
    if (!phrase) return;
    try {
      const res = await unlockReporting({ passphrase: phrase }).unwrap();
      if (res?.success && res.data?.key) {
        dispatch(unlocked({ key: res.data.key, expiresInSeconds: res.data.expiresInSeconds }));
        navigate(ROUTES.FINANCE);
      }
    } catch {
      // stays silent by design
    }
  };


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
    {
      label: 'Change password',
      icon: <KeyRound size={16} />,
      onClick: () => setChangePasswordOpen(true),
    },
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

      {/* Global search. Also the way in to the concealed reporting module: the passphrase is typed
          here and submitted with Enter. Nothing on screen hints at it, a wrong phrase does nothing
          visible, and the field clears itself either way so the phrase is never left on display. */}
      <div className="relative hidden md:block w-[320px] max-w-[40vw]">
        <Search
          size={15}
          className="absolute left-[11px] top-1/2 -translate-y-1/2 text-text-500 pointer-events-none"
        />
        <input
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          onKeyDown={handleSearchKey}
          autoComplete="off"
          spellCheck={false}
          placeholder="Search customers, quotations, invoices…"
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

      {/* Notifications — extracted; filtering/grouping lives in NotificationBell */}
      <NotificationBell enabled={!!user} />

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

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </header>
  );
};

export default Header;
