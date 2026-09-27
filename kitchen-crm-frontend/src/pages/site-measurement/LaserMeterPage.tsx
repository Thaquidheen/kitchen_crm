/**
 * Laser Meter hub: try the meter, per-device settings, and (admins) the Device Lab and the
 * adapter editor.
 */

import { useState } from 'react';
import { Tabs } from '@/components/ui';
import {
  ConnectLaserButton,
  GuidedMeasurePanel,
  LaserSettings,
  getBleSupport,
  useApplyLaserSettings,
  useGuidedMeasure,
  useLaserSettings,
  useSyncAdapters,
  DEFAULT_LAYOUT,
} from '@/features/laser-meter';

/** A throwaway two-wall sequence to check the meter works before going on site. */
const TryItOut = () => {
  const [settings] = useLaserSettings();
  useApplyLaserSettings(settings);
  const [layout] = useState({ ...DEFAULT_LAYOUT, wallCount: 2, includeCeiling: true });
  const guided = useGuidedMeasure(layout, settings.sequence, {
    autoAdvance: settings.autoAdvance,
    beep: settings.beep,
    vibrate: settings.vibrate,
  });
  const ble = getBleSupport();
  return (
    <div className="max-w-2xl">
      <p className="m-0 mb-3 text-[13px] text-text-600">
        Practice area — nothing here is saved. Connect your meter (or choose keyboard / manual mode) and take a
        few readings.
      </p>
      <GuidedMeasurePanel
        guided={guided}
        settings={settings}
        bleSupported={ble.supported}
        bluetoothControls={<ConnectLaserButton adapterId={settings.adapterId} />}
      />
    </div>
  );
};

const LaserMeterPage = () => {
  useSyncAdapters();
  const tabs = [
    { label: 'Try it out', content: <TryItOut /> },
    { label: 'Settings', content: <LaserSettings /> },
  ];

  return (
    <div className="w-full">
      <div className="mb-4">
        <h1 className="m-0 text-[19px] font-[650] text-text-900">Laser meter</h1>
        <p className="m-0 mt-0.5 text-[12.5px] text-text-600">
          Measure with a Bluetooth laser meter, a meter paired as a keyboard, or by hand.
        </p>
      </div>
      <Tabs tabs={tabs} />
    </div>
  );
};

export default LaserMeterPage;
