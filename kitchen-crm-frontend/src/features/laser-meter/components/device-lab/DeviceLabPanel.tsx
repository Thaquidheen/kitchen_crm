/** Device Lab plus the "Save as Adapter" editor, so saving doesn't leave the lab. */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { DeviceLab } from './DeviceLab';
import { AdapterEditor } from '../AdapterEditor';
import { apiErrorMessage } from '../../api/apiError';
import { useCreateLaserAdapterMutation } from '../../api/laserMeterAPI';
import type { LaserAdapterConfig } from '../../core/types';

export const DeviceLabPanel = () => {
  const [draft, setDraft] = useState<LaserAdapterConfig | null>(null);
  const [draftKey, setDraftKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [createAdapter, { isLoading }] = useCreateLaserAdapterMutation();

  return (
    <>
      <DeviceLab
        onSaveAsAdapter={(cfg) => {
          setError(null);
          setDraft(cfg);
          setDraftKey((k) => k + 1);
        }}
      />
      {draft && (
        <AdapterEditor
          key={draftKey}
          isOpen
          isNew
          initial={draft}
          saving={isLoading}
          serverError={error}
          onClose={() => setDraft(null)}
          onSave={async (config) => {
            try {
              await createAdapter({
                adapterKey: config.id,
                displayName: config.displayName,
                active: config.active,
                config,
              }).unwrap();
              toast.success(`Adapter "${config.displayName}" created — surveyors can now select it`);
              setDraft(null);
            } catch (e) {
              setError(apiErrorMessage(e, 'Could not create the adapter'));
            }
          }}
        />
      )}
    </>
  );
};

export default DeviceLabPanel;
