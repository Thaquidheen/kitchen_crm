/**
 * LightingManager — the Lighting tab of the product catalog in the HOCH table idiom (tableKit).
 * The page shell renders the H1 and tab chips; this manager renders the four lighting sub-tabs
 * (Profiles / Drivers / Connectors / Sensors) as small chips, a count-plus-Add row, one table
 * card with a debounced client-side search on the headline field (the lighting endpoints are
 * fetch-all and the lists are small), and its own modals.
 *
 * Replaces the old card grid + shared "Name / Description / Active" form — a form that could
 * never work: none of the four entities has those columns, so Create always 400'd and Edit
 * silently dropped every meaningful field. Each sub-entity now gets a real form (profileType /
 * wattage / type, price, MRP, discount %, active). Also fixed: failures show an error row
 * instead of the empty state, delete confirms via ConfirmDialog instead of window.confirm and
 * keeps the server's error message (the old toast discarded it), 200-with-success:false deletes
 * surface the server message, and write controls are hidden from non-super-admins (the backend
 * is SUPER_ADMIN-only on every write anyway). Inactive rows show the status pill, not opacity.
 */

import { useState, type FormEvent } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useIsSuperAdmin } from '@/features/auth/useIsSuperAdmin';
import {
  useGetLightProfilesQuery,
  useCreateLightProfileMutation,
  useUpdateLightProfileMutation,
  useDeleteLightProfileMutation,
  useGetDriversQuery,
  useCreateDriverMutation,
  useUpdateDriverMutation,
  useDeleteDriverMutation,
  useGetConnectorsQuery,
  useCreateConnectorMutation,
  useUpdateConnectorMutation,
  useDeleteConnectorMutation,
  useGetSensorsQuery,
  useCreateSensorMutation,
  useUpdateSensorMutation,
  useDeleteSensorMutation,
} from '../lightingAPI';
import type { LightProfile, Driver, Connector, Sensor, ApiResponse } from '../types';
import {
  thClass,
  thActionsClass,
  iconBtn,
  searchInputCls,
  cardCls,
  inputCls,
  labelCls,
  ActivePill,
  SkeletonRows,
  ErrorRow,
  EmptyRow,
  useDebouncedSearch,
} from './tableKit';

/** Keep in sync with the header row below — the skeleton/empty/error rows span every column. */
const COL_COUNT = 7;

type SubTab = 'profiles' | 'drivers' | 'connectors' | 'sensors';
type AnyItem = LightProfile | Driver | Connector | Sensor;

const SUB_TABS: SubTab[] = ['profiles', 'drivers', 'connectors', 'sensors'];

interface SubTabMeta {
  /** Chip label */
  label: string;
  singular: string;
  Singular: string;
  plural: string;
  /** Table header for the headline column */
  headlineTh: string;
  /** Table header for the price column */
  priceTh: string;
  /**
   * profileType / connector type / sensor type are plain strings in types.ts ("backend enum
   * string" — no union to build a select from), so those get text inputs; wattage is numeric.
   */
  headlineKind: 'text' | 'number';
  headlineLabel: string;
  headlinePlaceholder: string;
  /** Helper line under the headline field, when the value must match a backend enum. */
  headlineHelp?: string;
  priceLabel: string;
  searchPlaceholder: string;
}

const META: Record<SubTab, SubTabMeta> = {
  profiles: {
    label: 'Profiles',
    singular: 'light profile',
    Singular: 'Light Profile',
    plural: 'light profiles',
    headlineTh: 'Profile Type',
    priceTh: 'Price / Meter',
    headlineKind: 'text',
    headlineLabel: 'Profile type',
    headlinePlaceholder: 'Enter profile type',
    headlineHelp: 'Stored as the backend profile-type value — the server rejects unknown types.',
    priceLabel: 'Price per meter (₹)',
    searchPlaceholder: 'Search profile type…',
  },
  drivers: {
    label: 'Drivers',
    singular: 'driver',
    Singular: 'Driver',
    plural: 'drivers',
    headlineTh: 'Wattage',
    priceTh: 'Price',
    headlineKind: 'number',
    headlineLabel: 'Wattage (W)',
    headlinePlaceholder: 'e.g. 24',
    priceLabel: 'Price (₹)',
    searchPlaceholder: 'Search wattage…',
  },
  connectors: {
    label: 'Connectors',
    singular: 'connector',
    Singular: 'Connector',
    plural: 'connectors',
    headlineTh: 'Type',
    priceTh: 'Price / Piece',
    headlineKind: 'text',
    headlineLabel: 'Connector type',
    headlinePlaceholder: 'Enter connector type',
    headlineHelp: 'Stored as the backend connector-type value — the server rejects unknown types.',
    priceLabel: 'Price per piece (₹)',
    searchPlaceholder: 'Search connector type…',
  },
  sensors: {
    label: 'Sensors',
    singular: 'sensor',
    Singular: 'Sensor',
    plural: 'sensors',
    headlineTh: 'Type',
    priceTh: 'Price / Piece',
    headlineKind: 'text',
    headlineLabel: 'Sensor type',
    headlinePlaceholder: 'Enter sensor type',
    headlineHelp: 'Stored as the backend sensor-type value — the server rejects unknown types.',
    priceLabel: 'Price per piece (₹)',
    searchPlaceholder: 'Search sensor type…',
  },
};

const fmtINR = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// ---------------------------------------------------------------------------
// Add/Edit modal — one real form shared by the four sub-entities, driven by META.
// Hand-rolled controlled state (as the old form was), validated on submit.
// ---------------------------------------------------------------------------

interface LightingFormValues {
  /** profileType / connector type / sensor type — or the wattage as a string for drivers */
  headline: string;
  price: number;
  mrp: number;
  discountPercentage: number;
  active: boolean;
}

function LightingFormModal({
  isOpen,
  onClose,
  meta,
  initial,
  busy,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  meta: SubTabMeta;
  /** null → create mode */
  initial: LightingFormValues | null;
  busy: boolean;
  /** Parent saves, toasts and closes; rejections are handled there. */
  onSave: (values: LightingFormValues) => Promise<void>;
}) {
  const [headline, setHeadline] = useState(initial?.headline ?? '');
  const [price, setPrice] = useState(initial != null ? String(initial.price) : '');
  const [mrp, setMrp] = useState(initial != null ? String(initial.mrp) : '');
  const [discount, setDiscount] = useState(
    initial?.discountPercentage ? String(initial.discountPercentage) : ''
  );
  const [active, setActive] = useState(initial?.active ?? true);
  const [errors, setErrors] = useState<
    Partial<Record<'headline' | 'price' | 'mrp' | 'discount', string>>
  >({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};

    const h = headline.trim();
    if (!h) errs.headline = `${meta.headlineLabel} is required`;
    else if (meta.headlineKind === 'number' && (!Number.isFinite(Number(h)) || Number(h) <= 0))
      errs.headline = 'Enter a wattage greater than 0';

    const p = Number(price);
    if (price.trim() === '' || !Number.isFinite(p)) errs.price = `${meta.priceLabel} is required`;
    else if (p < 0) errs.price = 'Must be 0 or more';

    const m = Number(mrp);
    if (mrp.trim() === '' || !Number.isFinite(m)) errs.mrp = 'MRP is required';
    else if (m < 0) errs.mrp = 'Must be 0 or more';

    let d = 0;
    if (discount.trim() !== '') {
      d = Number(discount);
      if (!Number.isFinite(d) || d < 0 || d > 100)
        errs.discount = 'Discount must be between 0 and 100';
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    void onSave({ headline: h, price: p, mrp: m, discountPercentage: d, active });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? `Edit ${meta.Singular}` : `Add ${meta.Singular}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Headline: profileType / wattage / type */}
        <div>
          <label className={labelCls}>
            {meta.headlineLabel} <span className="text-error">*</span>
          </label>
          {meta.headlineKind === 'number' ? (
            <input
              type="number"
              min={0}
              step={0.01}
              className={inputCls}
              placeholder={meta.headlinePlaceholder}
              disabled={busy}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />
          ) : (
            <input
              type="text"
              className={inputCls}
              placeholder={meta.headlinePlaceholder}
              disabled={busy}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />
          )}
          {errors.headline ? (
            <p className="text-error text-xs mt-1">{errors.headline}</p>
          ) : (
            meta.headlineHelp && <p className="text-xs text-text-600 mt-1">{meta.headlineHelp}</p>
          )}
        </div>

        {/* Price + MRP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              {meta.priceLabel} <span className="text-error">*</span>
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              className={inputCls}
              placeholder="0.00"
              disabled={busy}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            {errors.price && <p className="text-error text-xs mt-1">{errors.price}</p>}
          </div>
          <div>
            <label className={labelCls}>
              MRP (₹) <span className="text-error">*</span>
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              className={inputCls}
              placeholder="0.00"
              disabled={busy}
              value={mrp}
              onChange={(e) => setMrp(e.target.value)}
            />
            {errors.mrp && <p className="text-error text-xs mt-1">{errors.mrp}</p>}
          </div>
        </div>

        {/* Discount */}
        <div>
          <label className={labelCls}>Discount %</label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            className={inputCls}
            placeholder="0"
            disabled={busy}
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
          {errors.discount ? (
            <p className="text-error text-xs mt-1">{errors.discount}</p>
          ) : (
            <p className="text-xs text-text-600 mt-1">Optional — leave blank for no discount.</p>
          )}
        </div>

        {/* Active toggle */}
        <div>
          <span className={labelCls}>Status</span>
          <button
            type="button"
            role="switch"
            aria-checked={active}
            onClick={() => setActive((a) => !a)}
            disabled={busy}
            className="flex items-center gap-3 text-left"
          >
            <span
              className={`relative inline-block w-11 h-6 rounded-full transition-colors shrink-0 ${
                active ? 'bg-success' : 'bg-background-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-text-900 rounded-full transition-transform ${
                  active ? 'translate-x-5' : ''
                }`}
              />
            </span>
            <span>
              <span className="block text-[13px] font-medium text-text-900">
                {active ? 'Active' : 'Inactive'}
              </span>
              <span className="block text-xs text-text-600">
                {active
                  ? `This ${meta.singular} will be visible and usable`
                  : `This ${meta.singular} will be hidden`}
              </span>
            </span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-background-600">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={busy}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={busy} className="w-full sm:w-auto">
            {initial ? `Update ${meta.Singular}` : `Create ${meta.Singular}`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Manager
// ---------------------------------------------------------------------------

/** Everything the shared render needs, adapted per sub-tab from the four hook families. */
interface TabApi {
  meta: SubTabMeta;
  items: AnyItem[];
  isLoading: boolean;
  isError: boolean;
  /** Display headline: "RECESSED", "24W", "MOTION", … */
  headlineOf: (item: AnyItem) => string;
  priceOf: (item: AnyItem) => number;
  /** Raw form values for editing (drivers keep the bare wattage, no "W"). */
  formValuesOf: (item: AnyItem) => LightingFormValues;
  save: (values: LightingFormValues, editing: AnyItem | null) => Promise<void>;
  toggle: (item: AnyItem) => Promise<void>;
  remove: (id: number) => Promise<ApiResponse<string>>;
  saving: boolean;
  deleting: boolean;
}

export const LightingManager = () => {
  // Hooks first, unconditionally — the sub-tab switch below only picks which results to show.
  const isSuperAdmin = useIsSuperAdmin();
  const [subTab, setSubTab] = useState<SubTab>('profiles');

  const profilesQ = useGetLightProfilesQuery();
  const driversQ = useGetDriversQuery();
  const connectorsQ = useGetConnectorsQuery();
  const sensorsQ = useGetSensorsQuery();

  const [createProfile, { isLoading: creatingProfile }] = useCreateLightProfileMutation();
  const [updateProfile, { isLoading: updatingProfile }] = useUpdateLightProfileMutation();
  const [deleteProfile, { isLoading: deletingProfile }] = useDeleteLightProfileMutation();
  const [createDriver, { isLoading: creatingDriver }] = useCreateDriverMutation();
  const [updateDriver, { isLoading: updatingDriver }] = useUpdateDriverMutation();
  const [deleteDriver, { isLoading: deletingDriver }] = useDeleteDriverMutation();
  const [createConnector, { isLoading: creatingConnector }] = useCreateConnectorMutation();
  const [updateConnector, { isLoading: updatingConnector }] = useUpdateConnectorMutation();
  const [deleteConnector, { isLoading: deletingConnector }] = useDeleteConnectorMutation();
  const [createSensor, { isLoading: creatingSensor }] = useCreateSensorMutation();
  const [updateSensor, { isLoading: updatingSensor }] = useUpdateSensorMutation();
  const [deleteSensor, { isLoading: deletingSensor }] = useDeleteSensorMutation();

  const { draft, setDraft, search } = useDebouncedSearch();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AnyItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; headline: string } | null>(null);

  const tab: TabApi = (() => {
    switch (subTab) {
      case 'profiles':
        return {
          meta: META.profiles,
          items: profilesQ.data ?? [],
          isLoading: profilesQ.isLoading,
          isError: profilesQ.isError,
          headlineOf: (i) => (i as LightProfile).profileType,
          priceOf: (i) => (i as LightProfile).pricePerMeter,
          formValuesOf: (i) => {
            const p = i as LightProfile;
            return {
              headline: p.profileType,
              price: p.pricePerMeter,
              mrp: p.mrp,
              discountPercentage: p.discountPercentage ?? 0,
              active: p.active,
            };
          },
          save: async (v, edited) => {
            const body = {
              profileType: v.headline,
              pricePerMeter: v.price,
              mrp: v.mrp,
              discountPercentage: v.discountPercentage,
              active: v.active,
            };
            if (edited) await updateProfile({ ...(edited as LightProfile), ...body }).unwrap();
            else await createProfile(body).unwrap();
          },
          toggle: async (i) => {
            const p = i as LightProfile;
            await updateProfile({ ...p, active: !p.active }).unwrap();
          },
          remove: (id) => deleteProfile(id).unwrap(),
          saving: creatingProfile || updatingProfile,
          deleting: deletingProfile,
        };
      case 'drivers':
        return {
          meta: META.drivers,
          items: driversQ.data ?? [],
          isLoading: driversQ.isLoading,
          isError: driversQ.isError,
          headlineOf: (i) => `${(i as Driver).wattage}W`,
          priceOf: (i) => (i as Driver).price,
          formValuesOf: (i) => {
            const d = i as Driver;
            return {
              headline: String(d.wattage),
              price: d.price,
              mrp: d.mrp,
              discountPercentage: d.discountPercentage ?? 0,
              active: d.active,
            };
          },
          save: async (v, edited) => {
            const body = {
              wattage: Number(v.headline),
              price: v.price,
              mrp: v.mrp,
              discountPercentage: v.discountPercentage,
              active: v.active,
            };
            if (edited) await updateDriver({ ...(edited as Driver), ...body }).unwrap();
            else await createDriver(body).unwrap();
          },
          toggle: async (i) => {
            const d = i as Driver;
            await updateDriver({ ...d, active: !d.active }).unwrap();
          },
          remove: (id) => deleteDriver(id).unwrap(),
          saving: creatingDriver || updatingDriver,
          deleting: deletingDriver,
        };
      case 'connectors':
        return {
          meta: META.connectors,
          items: connectorsQ.data ?? [],
          isLoading: connectorsQ.isLoading,
          isError: connectorsQ.isError,
          headlineOf: (i) => (i as Connector).type,
          priceOf: (i) => (i as Connector).pricePerPiece,
          formValuesOf: (i) => {
            const c = i as Connector;
            return {
              headline: c.type,
              price: c.pricePerPiece,
              mrp: c.mrp,
              discountPercentage: c.discountPercentage ?? 0,
              active: c.active,
            };
          },
          save: async (v, edited) => {
            const body = {
              type: v.headline,
              pricePerPiece: v.price,
              mrp: v.mrp,
              discountPercentage: v.discountPercentage,
              active: v.active,
            };
            if (edited) await updateConnector({ ...(edited as Connector), ...body }).unwrap();
            else await createConnector(body).unwrap();
          },
          toggle: async (i) => {
            const c = i as Connector;
            await updateConnector({ ...c, active: !c.active }).unwrap();
          },
          remove: (id) => deleteConnector(id).unwrap(),
          saving: creatingConnector || updatingConnector,
          deleting: deletingConnector,
        };
      case 'sensors':
        return {
          meta: META.sensors,
          items: sensorsQ.data ?? [],
          isLoading: sensorsQ.isLoading,
          isError: sensorsQ.isError,
          headlineOf: (i) => (i as Sensor).type,
          priceOf: (i) => (i as Sensor).pricePerPiece,
          formValuesOf: (i) => {
            const s = i as Sensor;
            return {
              headline: s.type,
              price: s.pricePerPiece,
              mrp: s.mrp,
              discountPercentage: s.discountPercentage ?? 0,
              active: s.active,
            };
          },
          save: async (v, edited) => {
            const body = {
              type: v.headline,
              pricePerPiece: v.price,
              mrp: v.mrp,
              discountPercentage: v.discountPercentage,
              active: v.active,
            };
            if (edited) await updateSensor({ ...(edited as Sensor), ...body }).unwrap();
            else await createSensor(body).unwrap();
          },
          toggle: async (i) => {
            const s = i as Sensor;
            await updateSensor({ ...s, active: !s.active }).unwrap();
          },
          remove: (id) => deleteSensor(id).unwrap(),
          saving: creatingSensor || updatingSensor,
          deleting: deletingSensor,
        };
    }
  })();

  const meta = tab.meta;

  const countFor: Record<SubTab, number> = {
    profiles: profilesQ.data?.length ?? 0,
    drivers: driversQ.data?.length ?? 0,
    connectors: connectorsQ.data?.length ?? 0,
    sensors: sensorsQ.data?.length ?? 0,
  };

  const switchTab = (t: SubTab) => {
    setSubTab(t);
    setDraft('');
    setFormOpen(false);
    setEditing(null);
    setDeleteTarget(null);
  };

  // Client-side debounced search on the headline field ("24" and "24w" both match drivers).
  const q = search.toLowerCase();
  const visible = q
    ? tab.items.filter((i) => tab.headlineOf(i).toLowerCase().includes(q))
    : tab.items;

  const handleSave = async (values: LightingFormValues) => {
    try {
      await tab.save(values, editing);
      toast.success(editing ? `${meta.Singular} updated` : `${meta.Singular} created`);
      setFormOpen(false);
      setEditing(null);
    } catch (e: any) {
      toast.error(e?.data?.message || `Failed to save ${meta.singular}`);
    }
  };

  const handleToggleActive = async (item: AnyItem) => {
    try {
      await tab.toggle(item);
      toast.success(`${meta.Singular} ${item.active ? 'deactivated' : 'activated'}`);
    } catch (e: any) {
      toast.error(e?.data?.message || `Failed to update ${meta.singular}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await tab.remove(deleteTarget.id);
      // The backend answers 200 with success:false when the item is still referenced.
      if (res && res.success === false) {
        toast.error(res.message || `${meta.Singular} is in use and cannot be deleted`);
      } else {
        toast.success(`${meta.Singular} deleted`);
      }
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e?.data?.message || `Failed to delete ${meta.singular}`);
    }
  };

  const chipStyle = (active: boolean) =>
    active
      ? {
          borderColor: 'var(--color-primary-600)',
          background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)',
        }
      : { borderColor: 'var(--color-background-600)', background: 'var(--color-background-800)' };

  return (
    <div className="w-full">
      {/* Sub-tab chips (Profiles / Drivers / Connectors / Sensors) */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {SUB_TABS.map((t) => {
          const active = subTab === t;
          return (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className="flex items-center gap-1.5 px-2.5 py-[5px] rounded-full border transition-colors"
              style={chipStyle(active)}
            >
              <span
                className={`text-[12px] whitespace-nowrap ${
                  active ? 'font-semibold text-text-900' : 'font-medium text-text-700'
                }`}
              >
                {META[t].label}
              </span>
              <span
                className={`text-[12px] font-[650] tabular-nums ${
                  active ? 'text-primary-600' : 'text-text-900'
                }`}
              >
                {countFor[t]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Count + Add row (the page shell owns the H1 and tab chips) */}
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <span className="text-[13px] text-text-700 tabular-nums">
          {tab.items.length} {tab.items.length === 1 ? meta.singular : meta.plural}
        </span>
        <div className="flex-1" />
        {isSuperAdmin && (
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="btn-raised-accent inline-flex items-center gap-2 px-3.5 py-[7px] rounded-[10px] text-[13px] font-semibold whitespace-nowrap"
          >
            <span className="w-5 h-5 rounded-md bg-white/20 backdrop-blur-[2px] flex items-center justify-center shrink-0">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            Add {meta.Singular}
          </button>
        )}
      </div>

      {/* Table card */}
      <div className={cardCls}>
        {/* Toolbar */}
        <div className="flex items-center gap-2.5 px-3.5 py-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-[480px]">
            <Search
              size={15}
              className="absolute left-[11px] top-1/2 -translate-y-1/2 text-text-500 pointer-events-none"
            />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={meta.searchPlaceholder}
              className={searchInputCls}
            />
          </div>
          <div className="flex-1" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-t border-background-600 bg-background-700">
                <th className={thClass}>{meta.headlineTh}</th>
                <th className={thClass}>{meta.priceTh}</th>
                <th className={thClass}>MRP</th>
                <th className={thClass}>Discount</th>
                <th className={thClass}>Company Price</th>
                <th className={thClass}>Status</th>
                <th className={thActionsClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tab.isLoading ? (
                <SkeletonRows cols={COL_COUNT} />
              ) : tab.isError ? (
                <ErrorRow cols={COL_COUNT} entity={meta.plural} />
              ) : visible.length === 0 ? (
                <EmptyRow
                  cols={COL_COUNT}
                  filtered={!!search}
                  title={`No ${meta.plural} yet`}
                  sub={
                    isSuperAdmin
                      ? `Add the first ${meta.singular} with the button above.`
                      : `${meta.Singular}s added by an administrator will appear here.`
                  }
                />
              ) : (
                visible.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-background-600 hover:bg-background-700 transition-colors"
                  >
                    <td className="px-3 py-[13px] text-[13.5px] font-semibold text-text-900 whitespace-nowrap">
                      {tab.headlineOf(item)}
                    </td>
                    <td className="px-3 py-[13px] text-[13px] text-text-900 tabular-nums whitespace-nowrap">
                      {fmtINR(tab.priceOf(item))}
                    </td>
                    <td className="px-3 py-[13px] text-[13px] text-text-800 tabular-nums whitespace-nowrap">
                      {fmtINR(item.mrp)}
                    </td>
                    <td className="px-3 py-[13px] text-[13px] text-text-800 tabular-nums whitespace-nowrap">
                      {item.discountPercentage
                        ? `${Number(item.discountPercentage).toLocaleString('en-IN')}%`
                        : '—'}
                    </td>
                    <td className="px-3 py-[13px] text-[13px] font-semibold text-text-900 tabular-nums whitespace-nowrap">
                      {item.companyPrice ? fmtINR(item.companyPrice) : '—'}
                    </td>
                    <td className="px-3 py-[13px]">
                      <ActivePill active={item.active} />
                    </td>
                    <td className="px-3.5 py-[13px]">
                      {isSuperAdmin && (
                        <div className="flex justify-end gap-0.5">
                          <button
                            onClick={() => handleToggleActive(item)}
                            title={item.active ? 'Deactivate' : 'Activate'}
                            className={iconBtn}
                            disabled={tab.saving || tab.deleting}
                          >
                            {item.active ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button
                            onClick={() => {
                              setEditing(item);
                              setFormOpen(true);
                            }}
                            title="Edit"
                            className={iconBtn}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({ id: item.id, headline: tab.headlineOf(item) })
                            }
                            title="Delete"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-500 transition-colors"
                            onMouseEnter={(ev) => {
                              ev.currentTarget.style.background = 'var(--st-lost-bg)';
                              ev.currentTarget.style.color = 'var(--st-lost-fg)';
                            }}
                            onMouseLeave={(ev) => {
                              ev.currentTarget.style.background = 'transparent';
                              ev.currentTarget.style.color = '';
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Fetch-all endpoints: no pagination footer — the count line above the card covers it. */}
      </div>

      {/* Add/Edit modal — keyed so each open starts from the right row's values */}
      {formOpen && (
        <LightingFormModal
          key={editing ? `${subTab}-${editing.id}` : `${subTab}-new`}
          isOpen={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          meta={meta}
          initial={editing ? tab.formValuesOf(editing) : null}
          busy={tab.saving}
          onSave={handleSave}
        />
      )}

      {/* Delete confirmation — replaces the window.confirm the old tab used */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${meta.Singular}`}
        message={
          deleteTarget
            ? `Delete the ${meta.singular} "${deleteTarget.headline}"? This cannot be undone — if it is still in use, the server will refuse and nothing is lost.`
            : ''
        }
        confirmText="Delete"
        type="danger"
        isLoading={tab.deleting}
      />
    </div>
  );
};

export default LightingManager;
