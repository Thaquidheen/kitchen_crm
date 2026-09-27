/**
 * Mode switcher + connection controls for a measuring screen:
 * [Bluetooth] [Keyboard meter] [Manual], plus Connect / Disconnect / Reconnect and, in dev
 * mode, the simulated meter.
 */

import clsx from 'clsx';
import { Bluetooth, FlaskConical, Keyboard, PenLine, Unplug, Wand2, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLaserMeter } from '../hooks/useLaserMeter';
import { useLaserDevTools } from '../hooks/useLaserSettings';
import { errorMessage } from '../core/LaserMeterService';
import type { ReactNode } from 'react';

export interface LaserModeBarProps {
  /** Rendered in the Bluetooth segment (the Connect button; needs a user gesture). */
  bluetoothControls?: ReactNode;
  bleSupported?: boolean;
}

const Segment = ({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={clsx(
      'inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-[8px] transition-colors whitespace-nowrap',
      active ? 'bg-background-600 text-text-900 shadow-sm' : 'text-text-600 hover:text-text-900'
    )}
  >
    {icon}
    {children}
  </button>
);

export const LaserModeBar = ({ bluetoothControls, bleSupported = false }: LaserModeBarProps) => {
  const { state, service } = useLaserMeter();
  const devTools = useLaserDevTools();
  const bleLike = state.mode === 'ble' || state.mode === 'mock';

  const run = (p: Promise<unknown>) => p.catch((e) => toast.error(errorMessage(e)));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex p-1 rounded-[10px] bg-background-700 border border-background-600">
        {(bleSupported || state.mode === 'mock') && (
          <Segment
            active={bleLike}
            onClick={() => !bleLike && run(service.prepareBle())}
            icon={<Bluetooth size={14} />}
          >
            Bluetooth
          </Segment>
        )}
        <Segment
          active={state.mode === 'keyboard'}
          onClick={() => state.mode !== 'keyboard' && run(service.enableKeyboard())}
          icon={<Keyboard size={14} />}
        >
          Keyboard meter
        </Segment>
        <Segment
          active={state.mode === 'manual'}
          onClick={() => state.mode !== 'manual' && run(service.useManual())}
          icon={<PenLine size={14} />}
        >
          Manual
        </Segment>
      </div>

      {bleLike && state.mode === 'ble' && bluetoothControls}

      {bleLike && state.needsManualReconnect && (
        <button
          type="button"
          onClick={() => run(service.retryNow())}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] border border-background-500 text-text-700 hover:bg-background-700"
        >
          <WifiOff size={14} /> Reconnect
        </button>
      )}

      {bleLike && (state.status === 'connected' || state.status === 'reconnecting') && (
        <button
          type="button"
          onClick={() => run(service.disconnect())}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] border border-background-500 text-text-700 hover:bg-background-700"
        >
          <Unplug size={14} /> Disconnect
        </button>
      )}

      {devTools && (
        <div className="inline-flex flex-wrap items-center gap-1.5 pl-2 ml-1 border-l border-background-600">
          <span className="text-[11px] uppercase tracking-wide text-text-500">Dev</span>
          {state.mode !== 'mock' || state.status === 'disconnected' ? (
            <button
              type="button"
              onClick={() => run(service.connectMock())}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[12px] border border-dashed border-background-500 text-text-700 hover:bg-background-700"
            >
              <FlaskConical size={13} /> Simulated meter
            </button>
          ) : (
            <button
              type="button"
              onClick={() => service.simulateDisconnect()}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[12px] border border-dashed border-background-500 text-text-700 hover:bg-background-700"
            >
              <WifiOff size={13} /> Drop link
            </button>
          )}
          <button
            type="button"
            onClick={() => service.simulateReading()}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[12px] border border-dashed border-background-500 text-text-700 hover:bg-background-700"
          >
            <Wand2 size={13} /> Simulate reading
          </button>
        </div>
      )}
    </div>
  );
};

export default LaserModeBar;
