/**
 * Laser Meter hub: try the meter, per-device settings, and (admins) the Device Lab and the
 * adapter editor.
 */

import { useState } from 'react';
import { Tabs } from '@/components/ui';
import { useIsSuperAdmin } from '@/features/auth/useIsSuperAdmin';
import {
  AdapterAdmin,
  ConnectLaserButton,
  DeviceLabPanel,
  MeasureWorkspace,
  LaserSettings,
  getBleSupport,
  useApplyLaserSettings,
  useGuidedMeasure,
  useLaserSettings,
  useSyncAdapters,
  DEFAULT_LAYOUT,
  type RoomLayout,
} from '@/features/laser-meter';

/** A throwaway two-wall sequence to check the meter works before going on site. */
const TryItOut = () => {
  const [settings] = useLaserSettings();
  useApplyLaserSettings(settings);
  const [layout, setLayout] = useState<RoomLayout>({ ...DEFAULT_LAYOUT, wallCount: 2, includeCeiling: true });
  const guided = useGuidedMeasure(layout, settings.sequence, {
    autoAdvance: settings.autoAdvance,
    beep: settings.beep,
    vibrate: settings.vibrate,
  });
  const ble = getBleSupport();
  return (
    <div>
      <p className="m-0 mb-3 text-[13px] text-text-600">
        Practice area — nothing here is saved. Connect your meter (or choose keyboard / manual mode) and take a
        few readings.
      </p>
      <MeasureWorkspace
        layout={layout}
        onLayoutChange={setLayout}
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
  const isAdmin = useIsSuperAdmin();
  const tabs = [
    { label: 'Try it out', content: <TryItOut /> },
    { label: 'Settings', content: <LaserSettings /> },
    // Admin tools. The API enforces this too; hiding the tabs just keeps staff screens simple.
    ...(isAdmin
      ? [
          { label: 'Device Lab', content: <DeviceLabPanel /> },
          { label: 'Adapters', content: <AdapterAdmin /> },
        ]
      : []),
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
