/**
 * PermissionsPage — the administrator decides what each staff type may do.
 *
 * One table per module: a row per permission, a column per staff type, a switch in each cell.
 * Nothing is saved until "Save changes"; only the switches that were moved are sent. The
 * administrator is not in the table — an administrator can always do everything.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGetPermissionMatrixQuery, useSavePermissionsMutation } from '@/features/permissions/permissionsAPI';
import { changedValues, countChanges, isOnDefaults } from '@/features/permissions/permissionRules';
import type { PermissionValues } from '@/features/permissions/types';

const card = 'bg-background-800 border border-background-600 rounded-[14px]';

const Switch: React.FC<{ on: boolean; changed: boolean; label: string; disabled?: boolean; onChange: (next: boolean) => void }> = ({
  on,
  changed,
  label,
  disabled,
  onChange,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    title={on ? 'Allowed — click to refuse' : 'Not allowed — click to allow'}
    disabled={disabled}
    onClick={() => onChange(!on)}
    className="relative inline-flex h-[22px] w-10 shrink-0 items-center rounded-full transition-colors disabled:opacity-60"
    style={{
      background: on ? 'var(--color-primary-600)' : 'var(--color-background-500)',
      // A moved switch stays marked until it is saved or put back.
      boxShadow: changed ? '0 0 0 2px var(--color-background-800), 0 0 0 4px var(--st-nego-fg)' : undefined,
    }}
  >
    <span
      className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
      style={{ transform: on ? 'translateX(21px)' : 'translateX(3px)' }}
    />
  </button>
);

const PermissionsPage: React.FC = () => {
  const { data: matrix, isLoading, isError } = useGetPermissionMatrixQuery();
  const [save, { isLoading: saving }] = useSavePermissionsMutation();
  const [edited, setEdited] = useState<PermissionValues | null>(null);

  // Start from what is saved, and again after every save. Keyed on the saved answers themselves,
  // so reloading the same answers in the background never throws away switches being moved.
  const savedKey = matrix ? JSON.stringify(matrix.values) : '';
  useEffect(() => {
    if (matrix) {
      setEdited(JSON.parse(JSON.stringify(matrix.values)) as PermissionValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey]);

  const changes = useMemo(() => (matrix && edited ? changedValues(matrix.values, edited) : {}), [matrix, edited]);
  const pending = countChanges(changes);

  if (isLoading || (matrix && !edited)) {
    return <div className={`${card} p-6 animate-pulse h-64`} />;
  }
  if (isError || !matrix || !edited) {
    return (
      <div className={`${card} px-6 py-12 text-center`}>
        <div className="text-[14px] font-semibold text-text-900">Permissions could not be loaded</div>
        <div className="text-[12.5px] text-text-700 mt-1">Refresh the page to try again.</div>
      </div>
    );
  }

  const set = (staffType: string, key: string, allowed: boolean) =>
    setEdited((prev) => (prev ? { ...prev, [staffType]: { ...prev[staffType], [key]: allowed } } : prev));

  const applyDefaults = (staffType: string) =>
    setEdited((prev) => {
      if (!prev) {return prev;}
      const row = { ...prev[staffType] };
      matrix.modules.forEach((m) => m.permissions.forEach((p) => (row[p.key] = p.defaultAllowed)));
      return { ...prev, [staffType]: row };
    });

  const discard = () => setEdited(JSON.parse(JSON.stringify(matrix.values)) as PermissionValues);

  const submit = async () => {
    if (pending === 0) {return;}
    try {
      await save(changes).unwrap();
      toast.success(pending === 1 ? 'Permission saved' : `${pending} permissions saved`);
    } catch (e: any) {
      toast.error(e?.message || e?.data?.message || 'Failed to save permissions');
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-end gap-4 flex-wrap mb-[18px]">
        <div className="min-w-0">
          <h1 className="m-0 text-[22px] font-[650] tracking-[-0.01em] text-text-900">Permissions</h1>
          <p className="m-0 mt-1 text-[13px] text-text-600">
            What each staff type can do. The Administrator can always do everything.
          </p>
        </div>
        <span className="flex-1" />
        {pending > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[12.5px] text-text-700">
              {pending} {pending === 1 ? 'change' : 'changes'} not saved
            </span>
            <button
              type="button"
              onClick={discard}
              disabled={saving}
              className="px-3 py-2 rounded-[10px] text-[13px] font-medium text-text-700 hover:bg-background-700"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="btn-raised-accent px-4 py-2 rounded-[10px] text-[13px] font-semibold disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </div>

      {matrix.modules.map((module) => (
        <section key={module.name} className={`${card} mb-4 overflow-hidden`} aria-label={`${module.name} permissions`}>
          <div className="px-4 pt-3.5 pb-3 flex items-center gap-2 border-b border-background-600">
            <ShieldCheck size={16} className="text-primary-600" />
            <span className="text-[14px] font-semibold text-text-900">{module.name}</span>
            <span className="text-[12px] text-text-600">{module.permissions.length} permissions</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-4 py-2.5 text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500 min-w-[260px]">
                    Permission
                  </th>
                  {matrix.staffTypes.map((t) => (
                    <th key={t.key} className="px-3 py-2.5 text-center align-bottom min-w-[120px]">
                      <div className="text-[12.5px] font-semibold text-text-900 whitespace-nowrap">{t.label}</div>
                      <div className="text-[11px] font-normal text-text-600 whitespace-nowrap">
                        {t.users === 0 ? 'no staff yet' : `${t.users} staff`}
                      </div>
                      <button
                        type="button"
                        onClick={() => applyDefaults(t.key)}
                        disabled={saving || isOnDefaults(matrix, edited, t.key)}
                        className="mt-1 text-[11px] font-medium text-primary-600 hover:underline disabled:text-text-500 disabled:no-underline"
                        title="Put this column back to the built-in defaults"
                      >
                        Use defaults
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {module.permissions.map((p) => (
                  <tr key={p.key} className="border-t border-background-600">
                    <td className="px-4 py-2.5 align-top">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-text-900">{p.label}</span>
                        {p.screenOnly && (
                          <span
                            className="text-[10.5px] font-semibold px-1.5 py-[1px] rounded-full bg-background-700 border border-background-600 text-text-700"
                            title="This one only hides the buttons on the screen."
                          >
                            Screen only
                          </span>
                        )}
                      </div>
                      <div className="text-[12px] text-text-600 mt-0.5 max-w-[520px]">{p.description}</div>
                    </td>
                    {matrix.staffTypes.map((t) => {
                      const on = edited[t.key]?.[p.key] === true;
                      return (
                        <td key={t.key} className="px-3 py-2.5 text-center align-middle">
                          <Switch
                            on={on}
                            changed={matrix.values[t.key]?.[p.key] !== on}
                            disabled={saving}
                            label={`${p.label} — ${t.label}`}
                            onChange={(next) => set(t.key, p.key, next)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <p className="m-0 text-[12px] text-text-600">
        A change reaches staff within a minute; they do not need to sign in again. Staff whose type is not set in Staff
        use the “Type not set” column.
      </p>
    </div>
  );
};

export default PermissionsPage;
