/**
 * The "One person" view of the Permissions page: one staff member's own permissions on top of
 * their staff type — e.g. one designer who may only open Designs while the other designers keep
 * what the Designer column gives them.
 *
 * Pick a person on the left; every module then shows what their staff type gives and what this
 * person gets. Moving a switch sets something just for them ("Custom"); "Use staff type" puts it
 * back. Nothing is saved until "Save changes"; only what was moved is sent.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Search, ShieldCheck, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  useGetPermissionPeopleQuery,
  useGetPersonPermissionsQuery,
  useResetPersonPermissionsMutation,
  useSavePersonPermissionsMutation,
} from '../permissionsAPI';
import {
  applyModuleToPerson,
  appliesTo,
  blockedByAnswer,
  clearOverride,
  moduleSwitchNext,
  moduleSwitchState,
  personAnswer,
  personChanges,
  type ModuleSwitchState,
} from '../permissionRules';
import type { PermissionInfo, PersonOverrides, PersonSummary } from '../types';
import { NotForType, PermissionSwitch, ScreenOnlyBadge } from './PermissionSwitch';

const card = 'bg-background-800 border border-background-600 rounded-[14px]';
const countBadge =
  'text-[10.5px] font-[650] px-1.5 py-px rounded-full tabular-nums whitespace-nowrap';
const errorText = (e: any, fallback: string): string => e?.data?.message || e?.message || fallback;

/* ---------- Picker ---------- */

const PeoplePicker: React.FC<{ selected: number | null; onChoose: (id: number) => void }> = ({ selected, onChoose }) => {
  const { data: people = [], isLoading, isError } = useGetPermissionPeopleQuery();
  const [q, setQ] = useState('');

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) {return people;}
    return people.filter(
      (p: PersonSummary) =>
        p.name.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        p.staffTypeLabel.toLowerCase().includes(term),
    );
  }, [people, q]);

  return (
    <div className={`${card} overflow-hidden lg:sticky lg:top-4`}>
      <div className="p-3 border-b border-background-600">
        <div className="relative">
          <Search size={15} className="absolute left-[11px] top-1/2 -translate-y-1/2 text-text-500 pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find a staff member…"
            aria-label="Find a staff member"
            className="w-full h-[34px] pl-[34px] pr-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500"
          />
        </div>
      </div>
      <div className="max-h-[260px] lg:max-h-[calc(100dvh-260px)] overflow-y-auto p-1.5" role="listbox" aria-label="Staff">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-11 m-1 rounded-[10px] bg-background-700 animate-pulse" />
          ))
        ) : isError ? (
          <div className="px-3 py-8 text-center text-[12.5px] text-text-700">Staff could not be loaded</div>
        ) : visible.length === 0 ? (
          <div className="px-3 py-8 text-center text-[12.5px] text-text-700">
            {people.length === 0 ? 'No staff yet' : 'Nobody matches'}
          </div>
        ) : (
          visible.map((p: PersonSummary) => {
            const active = p.userId === selected;
            return (
              <button
                key={p.userId}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => onChoose(p.userId)}
                className={`w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-[10px] transition-colors ${
                  active ? '' : 'hover:bg-background-700'
                }`}
                style={active ? { background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)' } : undefined}
              >
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-[13px] whitespace-nowrap overflow-hidden text-ellipsis ${
                      active ? 'font-semibold text-text-900' : 'font-medium text-text-900'
                    } ${p.active ? '' : 'opacity-70'}`}
                  >
                    {p.name}
                  </div>
                  <div className="text-[11.5px] text-text-600 whitespace-nowrap overflow-hidden text-ellipsis">
                    {p.staffTypeLabel}
                    {!p.active && ' · Inactive'}
                  </div>
                </div>
                {p.overrides > 0 && (
                  <span
                    className={countBadge}
                    style={{ background: 'var(--st-nego-bg)', color: 'var(--st-nego-fg)' }}
                    title={`${p.overrides} ${p.overrides === 1 ? 'permission is' : 'permissions are'} set just for ${p.name}`}
                  >
                    {p.overrides} custom
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

/* ---------- One person's tables ---------- */

/** What the staff type gives, as text: the person's switch sits right next to it. */
const TypeAnswer: React.FC<{ state: ModuleSwitchState }> = ({ state }) => {
  const label = state === 'on' ? 'On' : state === 'off' ? 'Off' : state === 'mixed' ? 'Some' : '—';
  const style =
    state === 'on'
      ? { background: 'var(--st-confirmed-bg)', color: 'var(--st-confirmed-fg)' }
      : { background: 'var(--color-background-700)', color: 'var(--color-text-600)' };
  return (
    <span className="inline-block text-[11.5px] font-semibold px-2 py-[2px] rounded-full min-w-[40px]" style={style}>
      {label}
    </span>
  );
};

const PersonDetail: React.FC<{ userId: number; onPendingChange: (pending: number) => void }> = ({
  userId,
  onPendingChange,
}) => {
  const { data: person, isLoading, isError, error } = useGetPersonPermissionsQuery(userId);
  const [save, { isLoading: saving }] = useSavePersonPermissionsMutation();
  const [reset, { isLoading: resetting }] = useResetPersonPermissionsMutation();
  const [edited, setEdited] = useState<PersonOverrides | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const busy = saving || resetting;

  // Start from what is saved for the person, and again after every save (see the staff type view).
  const savedKey = person ? `${person.staffType}:${JSON.stringify(person.overrides)}` : '';
  useEffect(() => {
    if (person) {
      setEdited({ ...person.overrides });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey]);

  const changes = useMemo(() => (person && edited ? personChanges(person.overrides, edited) : {}), [person, edited]);
  const pending = Object.keys(changes).length;
  useEffect(() => onPendingChange(pending), [pending, onPendingChange]);

  if (isLoading || (person && !edited)) {
    return <div className={`${card} p-6 animate-pulse h-64`} />;
  }
  if (isError || !person || !edited) {
    return (
      <div className={`${card} px-6 py-12 text-center`}>
        <div className="text-[14px] font-semibold text-text-900">This person's permissions could not be loaded</div>
        <div className="text-[12.5px] text-text-700 mt-1">{errorText(error, 'Refresh the page to try again.')}</div>
      </div>
    );
  }

  const type = person.staffType;
  const typeLabel = person.staffTypeLabel;
  const answer = (p: PermissionInfo) => personAnswer(p, type, person.typeValues, edited);
  const typeAnswer = (p: PermissionInfo) => person.typeValues[p.key] === true;
  const savedCustom = Object.keys(person.overrides).length;

  const discard = () => setEdited({ ...person.overrides });

  const submit = async () => {
    if (pending === 0) {return;}
    try {
      await save({ userId, values: changes }).unwrap();
      toast.success(pending === 1 ? 'Permission saved' : `${pending} permissions saved`);
    } catch (e: any) {
      toast.error(errorText(e, 'Failed to save permissions'));
    }
  };

  const resetToStaffType = async () => {
    try {
      await reset(userId).unwrap();
      setConfirmReset(false);
      toast.success(`${person.name} follows the ${typeLabel} permissions again`);
    } catch (e: any) {
      toast.error(errorText(e, 'Failed to reset permissions'));
    }
  };

  return (
    <div className="min-w-0">
      <div className={`${card} px-4 py-3.5 mb-4 flex items-center gap-3 flex-wrap`}>
        <div className="w-9 h-9 rounded-[10px] bg-background-600 border border-background-500 flex items-center justify-center text-text-700 shrink-0">
          <UserRound size={17} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14.5px] font-semibold text-text-900">{person.name}</span>
            {!person.active && (
              <span
                className="text-[11px] font-semibold px-2 py-[2px] rounded-full"
                style={{ background: 'var(--st-draft-bg)', color: 'var(--st-draft-fg)' }}
              >
                Inactive
              </span>
            )}
          </div>
          <div className="text-[12px] text-text-600">
            {typeLabel} · {savedCustom === 0 ? 'follows the staff type' : `${savedCustom} set just for them`}
          </div>
        </div>
        <span className="flex-1" />
        <div className="flex items-center gap-2 flex-wrap">
          {pending > 0 && (
            <>
              <span className="text-[12.5px] text-text-700">
                {pending} {pending === 1 ? 'change' : 'changes'} not saved
              </span>
              <button
                type="button"
                onClick={discard}
                disabled={busy}
                className="px-3 py-2 rounded-[10px] text-[13px] font-medium text-text-700 hover:bg-background-700"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="btn-raised-accent px-4 py-2 rounded-[10px] text-[13px] font-semibold disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            disabled={busy || savedCustom === 0}
            className="px-3 py-2 rounded-[10px] text-[13px] font-medium border border-background-600 text-text-700 hover:bg-background-700 disabled:opacity-50 disabled:hover:bg-transparent"
            title={
              savedCustom === 0
                ? `Nothing is saved just for ${person.name}`
                : `Remove everything set just for ${person.name}`
            }
          >
            Use staff type for everything
          </button>
        </div>
      </div>

      <p className="m-0 mb-4 text-[12px] text-text-600">
        Dashboard and Laser Meter are always available. Staff, Settings, Permissions and Income &amp; Expenses stay
        with the administrator.
      </p>

      {person.modules.map((module) => {
        const personState = moduleSwitchState(module, type, answer);
        const typeState = moduleSwitchState(module, type, typeAnswer);
        const moduleChanged = module.permissions.some((p) => p.key in changes);
        return (
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
                    <th className="text-left px-4 py-2.5 text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500 min-w-[240px]">
                      Permission
                    </th>
                    <th className="px-3 py-2.5 text-center align-bottom min-w-[110px]">
                      <div className="text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500">Staff type</div>
                      <div className="text-[11px] font-normal text-text-600 whitespace-nowrap">{typeLabel}</div>
                    </th>
                    <th className="px-3 py-2.5 text-center align-bottom min-w-[120px]">
                      <div className="text-[11px] font-[650] tracking-[0.05em] uppercase text-text-500">This person</div>
                      <div className="text-[11px] font-normal text-text-600 whitespace-nowrap max-w-[140px] mx-auto overflow-hidden text-ellipsis">
                        {person.name}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-background-600 bg-background-700/50">
                    <td className="px-4 py-2.5 align-top">
                      <div className="text-[13px] font-semibold text-text-900">Whole module</div>
                      <div className="text-[12px] text-text-600 mt-0.5 max-w-[520px]">
                        Everything in {module.name} at once, just for {person.name}.
                      </div>
                    </td>
                    {personState === 'none' ? (
                      <>
                        <td className="px-3 py-2.5 text-center align-middle">
                          <NotForType what={`${module.name} — whole module`} type={typeLabel} />
                        </td>
                        <td className="px-3 py-2.5 text-center align-middle">
                          <NotForType what={`${module.name} — whole module`} type={typeLabel} />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2.5 text-center align-middle">
                          <TypeAnswer state={typeState} />
                        </td>
                        <td className="px-3 py-2.5 text-center align-middle">
                          <PermissionSwitch
                            on={personState === 'on'}
                            mixed={personState === 'mixed'}
                            changed={moduleChanged}
                            disabled={busy}
                            label={`${module.name}, whole module — ${person.name}`}
                            title={
                              personState === 'on'
                                ? `Everything in ${module.name} allowed — click to refuse it all for ${person.name}`
                                : personState === 'mixed'
                                  ? `Some of ${module.name} allowed — click to allow it all for ${person.name}`
                                  : `Nothing in ${module.name} allowed — click to allow it all for ${person.name}`
                            }
                            onChange={() =>
                              setEdited((prev) =>
                                prev ? applyModuleToPerson(prev, module, type, moduleSwitchNext(personState)) : prev,
                              )
                            }
                          />
                        </td>
                      </>
                    )}
                  </tr>
                  {module.permissions.map((p) => {
                    if (!appliesTo(p, type)) {
                      return (
                        <tr key={p.key} className="border-t border-background-600">
                          <td className="px-4 py-2.5 align-top">
                            <span className="text-[13px] font-semibold text-text-600">{p.label}</span>
                            <div className="text-[12px] text-text-600 mt-0.5 max-w-[520px]">{p.description}</div>
                          </td>
                          <td className="px-3 py-2.5 text-center align-middle">
                            <NotForType what={p.label} type={typeLabel} />
                          </td>
                          <td className="px-3 py-2.5 text-center align-middle">
                            <NotForType what={p.label} type={typeLabel} />
                          </td>
                        </tr>
                      );
                    }
                    const custom = p.key in edited;
                    const on = answer(p);
                    const blocker = on ? blockedByAnswer(person.modules, p, answer) : null;
                    return (
                      <tr key={p.key} className="border-t border-background-600">
                        <td className="px-4 py-2.5 align-top">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-semibold text-text-900">{p.label}</span>
                            {p.screenOnly && <ScreenOnlyBadge />}
                            {custom && (
                              <>
                                <span
                                  className={countBadge}
                                  style={{ background: 'var(--st-nego-bg)', color: 'var(--st-nego-fg)' }}
                                  title={`Set just for ${person.name}; the ${typeLabel} column does not change it`}
                                >
                                  Custom
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setEdited((prev) => (prev ? clearOverride(prev, p.key) : prev))}
                                  disabled={busy}
                                  className="text-[11px] font-medium text-primary-600 hover:underline disabled:text-text-500"
                                  title={`Follow the ${typeLabel} column again`}
                                >
                                  Use staff type
                                </button>
                              </>
                            )}
                          </div>
                          <div className="text-[12px] text-text-600 mt-0.5 max-w-[520px]">{p.description}</div>
                        </td>
                        <td className="px-3 py-2.5 text-center align-middle">
                          <TypeAnswer state={typeAnswer(p) ? 'on' : 'off'} />
                        </td>
                        <td className="px-3 py-2.5 text-center align-middle">
                          <div className="inline-flex flex-col items-center gap-1">
                            <PermissionSwitch
                              on={on}
                              changed={p.key in changes}
                              disabled={busy}
                              label={`${p.label} — ${person.name}`}
                              onChange={(next) => setEdited((prev) => (prev ? { ...prev, [p.key]: next } : prev))}
                            />
                            {blocker && (
                              <span
                                className="text-[10.5px] leading-tight text-text-600 max-w-[110px]"
                                title={`Does nothing while “${blocker.label}” is off for ${person.name}`}
                              >
                                needs “{blocker.label}”
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <p className="m-0 text-[12px] text-text-600">
        A change reaches {person.name} within a minute; they do not need to sign in again. Anything not set just for
        them follows the {typeLabel} column of “Staff types”.
      </p>

      <ConfirmDialog
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={resetToStaffType}
        title="Use staff type for everything"
        message={`Remove the ${savedCustom} ${savedCustom === 1 ? 'permission' : 'permissions'} set just for ${
          person.name
        }? They will get exactly what the ${typeLabel} column gives.`}
        confirmText={resetting ? 'Removing…' : 'Use staff type'}
        type="warning"
        isLoading={resetting}
      />
    </div>
  );
};

/* ---------- The view ---------- */

export const PersonPermissionsView: React.FC<{
  personId: number | null;
  onChoose: (id: number) => void;
  onPendingChange?: (pending: number) => void;
}> = ({ personId, onChoose, onPendingChange }) => {
  const [pending, setPending] = useState(0);
  const [switchTo, setSwitchTo] = useState<number | null>(null);

  useEffect(() => onPendingChange?.(pending), [pending, onPendingChange]);

  // Choosing someone else while switches are moved would throw them away: ask first.
  const choose = (id: number) => {
    if (id === personId) {return;}
    if (pending > 0) {
      setSwitchTo(id);
    } else {
      onChoose(id);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] items-start">
      <PeoplePicker selected={personId} onChoose={choose} />
      {personId === null ? (
        <div className={`${card} px-6 py-14 text-center`}>
          <UserRound size={26} className="mx-auto text-text-500" />
          <div className="text-[14.5px] font-semibold text-text-900 mt-3">Choose a staff member</div>
          <div className="text-[12.5px] text-text-700 mt-1 max-w-[420px] mx-auto">
            Give one person something different from the rest of their staff type — for example, one designer who
            only sees Designs.
          </div>
        </div>
      ) : (
        // Keyed on the person, so switches moved for one person never carry over to the next.
        <PersonDetail key={personId} userId={personId} onPendingChange={setPending} />
      )}

      <ConfirmDialog
        isOpen={switchTo !== null}
        onClose={() => setSwitchTo(null)}
        onConfirm={() => {
          if (switchTo !== null) {
            setPending(0);
            onChoose(switchTo);
          }
          setSwitchTo(null);
        }}
        title="Discard changes?"
        message={`${pending} ${pending === 1 ? 'change is' : 'changes are'} not saved for this person. Choose someone else and discard ${
          pending === 1 ? 'it' : 'them'
        }?`}
        confirmText="Discard and continue"
        type="warning"
      />
    </div>
  );
};

export default PersonPermissionsView;
