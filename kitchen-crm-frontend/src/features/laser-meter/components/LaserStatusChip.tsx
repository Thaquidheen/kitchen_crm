/**
 * Compact status pill: mode, connection state, device and battery.
 * Disconnected / Connecting / Connected / Reconnecting (attempt n of 4) · battery %.
 */

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Battery, BatteryLow, BatteryMedium, BatteryFull, Bluetooth, Keyboard, PenLine, FlaskConical } from 'lucide-react';
import { useLaserMeter } from '../hooks/useLaserMeter';
import { DEFAULT_RECONNECT_DELAYS_MS } from '../core/reconnect';
import type { LaserState } from '../core/types';

const statusText = (s: LaserState, secondsLeft: number | null): string => {
  if (s.mode === 'manual') {
    return 'Manual entry';
  }
  if (s.mode === 'keyboard') {
    return 'Keyboard meter';
  }
  switch (s.status) {
    case 'connected':
      return s.deviceName ? `Connected · ${s.deviceName}` : 'Connected';
    case 'connecting':
      return 'Connecting…';
    case 'reconnecting':
      return `Reconnecting ${s.reconnectAttempt}/${DEFAULT_RECONNECT_DELAYS_MS.length}${
        secondsLeft !== null && secondsLeft > 0 ? ` · ${secondsLeft}s` : '…'
      }`;
    default:
      return 'Disconnected';
  }
};

const BatteryIcon = ({ pct }: { pct: number }) => {
  if (pct <= 15) {
    return <BatteryLow size={14} className="text-error" />;
  }
  if (pct <= 50) {
    return <BatteryMedium size={14} />;
  }
  if (pct <= 90) {
    return <Battery size={14} />;
  }
  return <BatteryFull size={14} />;
};

export interface LaserStatusChipProps {
  onClick?: () => void;
  className?: string;
}

export const LaserStatusChip = ({ onClick, className }: LaserStatusChipProps) => {
  const { state } = useLaserMeter();
  const [now, setNow] = useState(() => Date.now());

  // Tick once a second while a reconnect countdown is showing.
  useEffect(() => {
    if (state.status !== 'reconnecting' || !state.nextRetryAt) {
      return;
    }
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [state.status, state.nextRetryAt]);

  const secondsLeft = state.nextRetryAt ? Math.max(0, Math.ceil((state.nextRetryAt - now) / 1000)) : null;
  const live = state.mode === 'keyboard' || (state.status === 'connected' && state.mode !== 'manual');
  const busy = state.status === 'connecting' || state.status === 'reconnecting';

  const Icon =
    state.mode === 'keyboard' ? Keyboard : state.mode === 'manual' ? PenLine : state.mode === 'mock' ? FlaskConical : Bluetooth;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      title={state.lastError ?? undefined}
      className={clsx(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12.5px] font-medium whitespace-nowrap max-w-full',
        'bg-background-800 border-background-500 text-text-800',
        onClick && 'hover:bg-background-700',
        className
      )}
      aria-live="polite"
    >
      <span
        className={clsx(
          'w-2 h-2 rounded-full shrink-0',
          live ? 'bg-success' : busy ? 'bg-warning animate-pulse' : 'bg-text-500'
        )}
      />
      <Icon size={14} className="shrink-0 text-text-600" />
      <span className="truncate">{statusText(state, secondsLeft)}</span>
      {state.battery !== null && state.status === 'connected' && (
        <span className="inline-flex items-center gap-1 text-text-600 tabular-nums">
          <BatteryIcon pct={state.battery} />
          {state.battery}%
        </span>
      )}
    </button>
  );
};

export default LaserStatusChip;
