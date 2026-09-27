import { useEffect } from 'react';
import { laserMeter } from '../instance';
import { useGetActiveLaserAdaptersQuery } from '../api/laserMeterAPI';

/**
 * Refresh the adapter registry from the server. On failure (no signal on site) the registry
 * keeps its localStorage cache, so measuring keeps working.
 */
export const useSyncAdapters = (): void => {
  const { data } = useGetActiveLaserAdaptersQuery(undefined, { refetchOnMountOrArgChange: 300 });
  useEffect(() => {
    if (data) {
      laserMeter.registry.setConfigs(data);
    }
  }, [data]);
};
