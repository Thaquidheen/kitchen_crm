/**
 * "Connect Laser Meter" — opens the browser's Bluetooth chooser (must run from a click), with a
 * one-tap reconnect for the last meter when the browser still has permission for it, and a
 * "show all devices" fallback for meters whose names don't match the adapter's filters.
 */

import { useEffect, useState } from 'react';
import { Bluetooth, Loader2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLaserMeter } from '../hooks/useLaserMeter';
import { errorMessage } from '../core/LaserMeterService';
import { getBleSupport } from '../core/connections/webBluetooth';

export interface ConnectLaserButtonProps {
  adapterId: string | null;
  /** Called when no meter model is chosen yet (e.g. open settings). */
  onChooseModel?: () => void;
}

export const ConnectLaserButton = ({ adapterId, onChooseModel }: ConnectLaserButtonProps) => {
  const { state, service } = useLaserMeter();
  const [quickName, setQuickName] = useState<string | null>(null);
  const support = getBleSupport();

  // Offer one-tap reconnect if the remembered meter is still permitted in this browser.
  useEffect(() => {
    let cancelled = false;
    if (state.status !== 'disconnected' || !state.rememberedDevice) {
      setQuickName(null);
      return;
    }
    service.findRememberedDevice().then((d) => {
      if (!cancelled) {
        setQuickName(d ? (d.name ?? state.rememberedDevice?.name ?? 'last meter') : null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [state.status, state.rememberedDevice, service]);

  if (!support.supported) {
    return <span className="text-[12.5px] text-text-600">{support.message}</span>;
  }
  if (state.status === 'connected' || state.status === 'reconnecting') {
    return null;
  }
  if (state.status === 'connecting') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] text-text-600">
        <Loader2 size={14} className="animate-spin" /> Connecting…
      </span>
    );
  }

  const connect = (showAllDevices = false) => {
    // No await before connectBle: requestDevice needs the click's user activation.
    service
      .connectBle({ adapterId, showAllDevices })
      .catch((e) => toast.error(errorMessage(e)));
  };

  if (!adapterId) {
    return (
      <button
        type="button"
        onClick={onChooseModel}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] border border-background-500 text-text-700 hover:bg-background-700"
      >
        <Bluetooth size={14} /> Choose meter model…
      </button>
    );
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      {quickName && (
        <button
          type="button"
          onClick={() => service.reconnectRemembered().catch((e) => toast.error(errorMessage(e)))}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold btn-raised-accent"
        >
          <RotateCcw size={14} /> Reconnect {quickName}
        </button>
      )}
      <button
        type="button"
        onClick={() => connect(false)}
        className={
          quickName
            ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] border border-background-500 text-text-700 hover:bg-background-700'
            : 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold btn-raised-accent'
        }
      >
        <Bluetooth size={14} /> Connect laser meter
      </button>
      <button
        type="button"
        onClick={() => connect(true)}
        className="text-[12px] text-text-600 underline underline-offset-2 hover:text-text-900"
        title="List every nearby Bluetooth device, not just matching meters"
      >
        Not listed?
      </button>
    </div>
  );
};

export default ConnectLaserButton;
