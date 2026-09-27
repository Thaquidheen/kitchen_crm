/**
 * Site Measurement Mode for one customer: room layout, guided measuring with a laser meter
 * (Bluetooth or keyboard mode) or by hand, and save. Unsaved work is kept as a local draft.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, History, Save, Settings2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Modal, Spinner } from '@/components/ui';
import { useGetCustomerByIdQuery } from '@/features/customers/customersAPI';
import {
  ConnectLaserButton,
  MeasureWorkspace,
  LaserSettings,
  laserMeter,
  resolveMode,
  getBleSupport,
  useApplyLaserSettings,
  useGuidedMeasure,
  useLaserSettings,
  useSyncAdapters,
  useGetSiteMeasurementQuery,
  useSaveSiteMeasurementMutation,
  sanitizeLayout,
  DEFAULT_LAYOUT,
  valueList,
  saveDraft,
  loadDraft,
  clearDraft,
  draftIsNewer,
  type MeasurementDraft,
  type RoomLayout,
} from '@/features/laser-meter';
import { getCustomerDetailRoute } from '@/routes/routes.config';

const SiteMeasurementPage = () => {
  const { id } = useParams<{ id: string }>();
  const customerId = Number(id);
  const navigate = useNavigate();
  const draftScope = `customer:${customerId}`;

  const { data: customer } = useGetCustomerByIdQuery(customerId, { skip: !customerId });
  const { data: record, isLoading, isError } = useGetSiteMeasurementQuery(customerId, { skip: !customerId });
  const [saveMeasurement, { isLoading: saving }] = useSaveSiteMeasurementMutation();

  const [settings] = useLaserSettings();
  useApplyLaserSettings(settings);
  useSyncAdapters();
  const ble = useMemo(() => getBleSupport(), []);

  const [layout, setLayout] = useState<RoomLayout>(DEFAULT_LAYOUT);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<MeasurementDraft | null>(null);

  const guided = useGuidedMeasure(layout, settings.sequence, {
    autoAdvance: settings.autoAdvance,
    beep: settings.beep,
    vibrate: settings.vibrate,
  });
  const { load } = guided;

  // Pick the starting mode once per visit, without disturbing a meter that's already connected.
  useEffect(() => {
    const s = laserMeter.getState();
    if (s.status === 'connected' || s.status === 'connecting' || s.status === 'reconnecting') {
      return;
    }
    const mode = resolveMode(settings.preferredMode, {
      bleSupported: ble.supported,
      hasAdapter: !!settings.adapterId,
    });
    const start =
      mode === 'ble' ? laserMeter.prepareBle() : mode === 'keyboard' ? laserMeter.enableKeyboard() : laserMeter.useManual();
    start.catch(() => undefined);
    // Only on entering the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hydrate from the server once, then offer a newer local draft if there is one.
  useEffect(() => {
    if (!record || hydrated) {
      return;
    }
    const hasServerData = !!record.layout || record.values.length > 0;
    setLayout(hasServerData ? sanitizeLayout(record.layout) : DEFAULT_LAYOUT);
    load(record.values);
    const draft = loadDraft(draftScope);
    if (draftIsNewer(draft, record.updatedAt)) {
      setPendingDraft(draft);
    }
    setHydrated(true);
  }, [record, hydrated, load, draftScope]);

  // Any change after hydration marks the session dirty and refreshes the local draft.
  const firstChange = useRef(true);
  useEffect(() => {
    if (!hydrated) {
      return;
    }
    if (firstChange.current) {
      firstChange.current = false;
      return;
    }
    setDirty(true);
    saveDraft(draftScope, { layout, values: valueList(guided.values), savedAt: Date.now() });
    // guided.values changes with revision.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guided.revision, layout, hydrated]);

  useEffect(() => {
    if (!dirty) {
      return;
    }
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const onSave = async () => {
    // Drop values whose target no longer exists (e.g. a removed window).
    const keys = new Set(guided.targets.map((t) => t.key));
    const values = valueList(guided.values).filter((v) => keys.has(v.key));
    try {
      await saveMeasurement({ customerId, layout, values }).unwrap();
      clearDraft(draftScope);
      setDirty(false);
      toast.success('Measurements saved');
    } catch {
      toast.error('Could not save. Your measurements are kept on this device — try again when online.');
    }
  };

  if (!customerId) {
    return <p className="text-text-600">Invalid customer.</p>;
  }
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="py-10 text-center text-text-700">
        Could not load site measurements.
        <button className="ml-2 text-primary-600 hover:underline" onClick={() => navigate(getCustomerDetailRoute(customerId))}>
          Back to customer
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(getCustomerDetailRoute(customerId))}
          className="w-[34px] h-[34px] rounded-[10px] border border-background-500 bg-background-800 text-text-700 hover:bg-background-700 hover:text-text-900 flex items-center justify-center shrink-0"
          title="Back to customer"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="m-0 text-[19px] font-[650] text-text-900 truncate">Site measurement</h1>
          <p className="m-0 mt-0.5 text-[12.5px] text-text-600 truncate">
            {customer?.name ?? `Customer #${customerId}`}
            {record?.updatedAt && !dirty && ` · Saved ${new Date(record.updatedAt).toLocaleString()}`}
            {dirty && ' · Unsaved changes'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="p-2 rounded-[10px] border border-background-500 bg-background-800 text-text-700 hover:bg-background-700"
          aria-label="Laser meter settings"
        >
          <Settings2 size={16} />
        </button>
      </div>

      {pendingDraft && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-[10px] border border-warning px-3 py-2.5 text-[13px] text-text-800">
          <History size={16} className="text-warning" />
          <span className="flex-1 min-w-[12rem]">
            Unsaved measurements from {new Date(pendingDraft.savedAt).toLocaleString()} were found on this device.
          </span>
          <Button
            size="sm"
            onClick={() => {
              setLayout(sanitizeLayout(pendingDraft.layout));
              load(pendingDraft.values);
              setPendingDraft(null);
              setDirty(true);
            }}
          >
            Restore
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              clearDraft(draftScope);
              setPendingDraft(null);
            }}
          >
            Discard
          </Button>
        </div>
      )}

      <MeasureWorkspace
        layout={layout}
        onLayoutChange={setLayout}
        guided={guided}
        settings={settings}
        bleSupported={ble.supported}
        bluetoothControls={
          <ConnectLaserButton adapterId={settings.adapterId} onChooseModel={() => setSettingsOpen(true)} />
        }
        onStatusClick={() => setSettingsOpen(true)}
      />

      {/* Save bar */}
      <div className="fixed bottom-0 inset-x-0 md:left-auto md:right-6 md:bottom-6 md:inset-x-auto z-20 p-3 md:p-0 bg-background-900 md:bg-transparent border-t border-background-600 md:border-0">
        <Button fullWidth size="lg" onClick={onSave} isLoading={saving} disabled={!dirty || saving} leftIcon={<Save size={16} />}>
          {dirty ? 'Save measurements' : 'Saved'}
        </Button>
      </div>

      <Modal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="Laser meter settings" size="lg">
        <LaserSettings />
      </Modal>
    </div>
  );
};

export default SiteMeasurementPage;
