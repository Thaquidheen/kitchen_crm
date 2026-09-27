import { useCallback, useSyncExternalStore } from 'react';
import { useAppSelector } from '@/app/hooks';
import { laserSettingsStore } from '../instance';
import type { LaserSettings } from '../core/settings';

/** Settings for the signed-in user on this device. */
export const useLaserSettings = (): [LaserSettings, (patch: Partial<LaserSettings>) => void] => {
  const userKey = String(useAppSelector((s) => s.auth.user?.id) ?? 'anonymous');
  const settings = useSyncExternalStore(
    (cb) => laserSettingsStore.subscribe(cb),
    () => laserSettingsStore.get(userKey)
  );
  const update = useCallback(
    (patch: Partial<LaserSettings>) => {
      laserSettingsStore.update(userKey, patch);
    },
    [userKey]
  );
  return [settings, update];
};

/** Dev tools (simulated meter, "Simulate reading") show in dev builds or when enabled in settings. */
export const useLaserDevTools = (): boolean => {
  const [settings] = useLaserSettings();
  return import.meta.env.DEV || settings.devTools;
};
