import { useMemo, useSyncExternalStore } from 'react';
import { laserMeter } from '../instance';

let version = 0;
laserMeter.registry.onChange(() => {
  version += 1;
});

/** Adapters a surveyor can choose, re-rendering when the registry changes. */
export const useSelectableAdapters = (includeMock: boolean) => {
  const v = useSyncExternalStore(
    (cb) => laserMeter.registry.onChange(cb),
    () => version
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => laserMeter.registry.listSelectable({ includeMock }), [v, includeMock]);
};
