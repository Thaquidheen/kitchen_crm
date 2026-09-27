import { useEffect, useSyncExternalStore } from 'react';
import { laserMeter } from '../instance';
import type { LaserSettings } from '../core/settings';

const subscribe = (cb: () => void) => laserMeter.on('state', cb);
const getSnapshot = () => laserMeter.getState();

/**
 * Live laser meter state plus the service for actions. Every component that calls this sees
 * the same device — the service is a singleton.
 */
export const useLaserMeter = () => {
  const state = useSyncExternalStore(subscribe, getSnapshot);
  return { state, service: laserMeter };
};

/** Push the user's settings into the service. Call once near the top of a measuring screen. */
export const useApplyLaserSettings = (settings: LaserSettings): void => {
  useEffect(() => {
    laserMeter.configureKeyboard({
      defaultUnit: settings.hid.defaultUnit,
      timing: settings.hid.timing,
      acceptHumanTyping: settings.hid.acceptHumanTyping,
      minMm: settings.hid.minMm,
      maxMm: settings.hid.maxMm,
    });
  }, [settings.hid]);

  useEffect(() => {
    // Don't yank the adapter out from under a connected device (e.g. the simulator).
    if (laserMeter.getState().status === 'disconnected') {
      laserMeter.setAdapter(settings.adapterId);
    }
  }, [settings.adapterId]);

  useEffect(() => {
    laserMeter.registry.setGenericOptionalServices(settings.labOptionalServices);
  }, [settings.labOptionalServices]);
};
