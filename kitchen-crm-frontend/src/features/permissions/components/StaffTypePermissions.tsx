/**
 * The "Staff types" view of the Permissions page: what each staff type may do.
 *
 * One table per module: a row per permission, a column per staff type, a switch in each cell.
 * The first row of every module is "Whole module": one click turns everything in that module on
 * or off for a staff type. Nothing is saved until "Save changes"; only the switches that were
 * moved are sent.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGetPermissionMatrixQuery, useSavePermissionsMutation } from '../permissionsAPI';
import {
  applyModuleToType,
  appliesTo,
  blockedBy,
  changedValues,
  countChanges,
  isOnDefaults,
  moduleSwitchNext,
  moduleSwitchState,
} from '../permissionRules';
import type { PermissionValues } from '../types';
import { NotForType, PermissionSwitch, ScreenOnlyBadge } from './PermissionSwitch';

const card = 'bg-background-800 border border-background-600 rounded-[14px]';

export const StaffTypePermissions: React.FC<{ onPendingChange?: (pending: number) => void }> = ({ onPendingChange }) => {
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
  useEffect(() => onPendingChange?.(pending), [pending, onPendingChange]);

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
      matrix.modules.forEach((m) =>
        m.permissions.forEach((p) => {
          if (appliesTo(p, staffType)) {row[p.key] = p.defaultAllowed;}
        }),
      );
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
      <div className="flex items-center gap-4 flex-wrap mb-4 min-h-[38px]">
        <p className="m-0 text-[13px] text-text-600">
          What each staff type can do. Use “Whole module” to turn a module on or off with one click.
        </p>
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
                <tr className="border-t border-background-600 bg-background-700/50">
                  <td className="px-4 py-2.5 align-top">
                    <div className="text-[13px] font-semibold text-text-900">Whole module</div>
                    <div className="text-[12px] text-text-600 mt-0.5 max-w-[520px]">
                      Everything in {module.name} at once. Half way means only some of it is allowed.
                    </div>
                  </td>
                  {matrix.staffTypes.map((t) => {
                    const state = moduleSwitchState(module, t.key, (p) => edited[t.key]?.[p.key] === true);
                    if (state === 'none') {
                      return (
                        <td key={t.key} className="px-3 py-2.5 text-center align-middle">
                          <NotForType what={`${module.name} — whole module`} type={t.label} />
                        </td>
                      );
                    }
                    // Marked while any switch of the module in this column is moved and not saved.
                    const changed = module.permissions.some(
                      (p) => appliesTo(p, t.key) && matrix.values[t.key]?.[p.key] !== edited[t.key]?.[p.key],
                    );
                    return (
                      <td key={t.key} className="px-3 py-2.5 text-center align-middle">
                        <PermissionSwitch
                          on={state === 'on'}
                          mixed={state === 'mixed'}
                          changed={changed}
                          disabled={saving}
                          label={`${module.name}, whole module — ${t.label}`}
                          title={
                            state === 'on'
                              ? `Everything in ${module.name} allowed — click to refuse it all`
                              : state === 'mixed'
                                ? `Some of ${module.name} allowed — click to allow it all`
                                : `Nothing in ${module.name} allowed — click to allow it all`
                          }
                          onChange={() =>
                            setEdited((prev) =>
                              prev ? applyModuleToType(prev, module, t.key, moduleSwitchNext(state)) : prev,
                            )
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
                {module.permissions.map((p) => (
                  <tr key={p.key} className="border-t border-background-600">
                    <td className="px-4 py-2.5 align-top">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-text-900">{p.label}</span>
                        {p.screenOnly && <ScreenOnlyBadge />}
                      </div>
                      <div className="text-[12px] text-text-600 mt-0.5 max-w-[520px]">{p.description}</div>
                    </td>
                    {matrix.staffTypes.map((t) => {
                      if (!appliesTo(p, t.key)) {
                        return (
                          <td key={t.key} className="px-3 py-2.5 text-center align-middle">
                            <NotForType what={p.label} type={t.label} />
                          </td>
                        );
                      }
                      const on = edited[t.key]?.[p.key] === true;
                      const blocker = on ? blockedBy(matrix, edited, p, t.key) : null;
                      return (
                        <td key={t.key} className="px-3 py-2.5 text-center align-middle">
                          <div className="inline-flex flex-col items-center gap-1">
                            <PermissionSwitch
                              on={on}
                              changed={matrix.values[t.key]?.[p.key] !== on}
                              disabled={saving}
                              label={`${p.label} — ${t.label}`}
                              onChange={(next) => set(t.key, p.key, next)}
                            />
                            {blocker && (
                              <span
                                className="text-[10.5px] leading-tight text-text-600 max-w-[110px]"
                                title={`Does nothing while “${blocker.label}” is off`}
                              >
                                needs “{blocker.label}”
                              </span>
                            )}
                          </div>
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
        use the “Type not set” column. To give one person something different, use “One person”.
      </p>
    </div>
  );
};

export default StaffTypePermissions;
