/**
 * PermissionsPage — the administrator decides what staff may do.
 *
 * Two views: "Staff types" (a column per staff type, the usual way) and "One person" (one staff
 * member's own permissions on top of their staff type). ?person=<userId> opens "One person" with
 * that person chosen — the Staff page links here that way. The administrator is in neither: an
 * administrator can always do everything.
 *
 * Both views stay mounted, so switches moved in one are still there after a look at the other.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import StaffTypePermissions from '@/features/permissions/components/StaffTypePermissions';
import PersonPermissionsView from '@/features/permissions/components/PersonPermissionsView';

type View = 'types' | 'person';

const parsePerson = (raw: string | null): number | null => {
  const id = Number(raw);
  return raw && Number.isInteger(id) && id > 0 ? id : null;
};

const PermissionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPerson = parsePerson(searchParams.get('person'));
  const view: View = urlPerson !== null || searchParams.get('view') === 'person' ? 'person' : 'types';

  // The chosen person outlives a look at "Staff types" (which drops it from the address).
  const [personId, setPersonId] = useState<number | null>(urlPerson);
  useEffect(() => {
    if (urlPerson !== null) {setPersonId(urlPerson);}
  }, [urlPerson]);

  const [typePending, setTypePending] = useState(0);
  const [personPending, setPersonPending] = useState(0);
  const onTypePending = useCallback((n: number) => setTypePending(n), []);
  const onPersonPending = useCallback((n: number) => setPersonPending(n), []);

  const show = (next: View) => {
    if (next === 'types') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams(personId !== null ? { person: String(personId) } : { view: 'person' }, { replace: true });
    }
  };

  const choose = (id: number) => {
    setPersonId(id);
    setSearchParams({ person: String(id) }, { replace: true });
  };

  const tab = (key: View, label: string, pending: number) => {
    const active = view === key;
    return (
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => show(key)}
        className={`inline-flex items-center gap-2 h-8 px-3 rounded-[8px] text-[12.5px] whitespace-nowrap transition-colors ${
          active ? 'font-semibold text-text-900' : 'font-medium text-text-600 hover:text-text-900'
        }`}
        style={active ? { background: 'color-mix(in oklab, var(--color-primary-600) 16%, transparent)' } : undefined}
      >
        {label}
        {pending > 0 && (
          <span
            className="text-[11px] font-[650] px-1.5 py-px rounded-full tabular-nums"
            style={{ background: 'var(--st-nego-bg)', color: 'var(--st-nego-fg)' }}
            title={`${pending} not saved`}
          >
            {pending}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="w-full">
      <div className="flex items-end gap-4 flex-wrap mb-[18px]">
        <div className="min-w-0">
          <h1 className="m-0 text-[22px] font-[650] tracking-[-0.01em] text-text-900">Permissions</h1>
          <p className="m-0 mt-1 text-[13px] text-text-600">
            What staff can do — per staff type, or for one person. The Administrator can always do everything.
          </p>
        </div>
        <span className="flex-1" />
        <div
          role="tablist"
          aria-label="Permissions views"
          className="inline-flex p-[3px] gap-[3px] rounded-[11px] border border-background-600 bg-background-800"
        >
          {tab('types', 'Staff types', typePending)}
          {tab('person', 'One person', personPending)}
        </div>
      </div>

      <div hidden={view !== 'types'}>
        <StaffTypePermissions onPendingChange={onTypePending} />
      </div>
      <div hidden={view !== 'person'}>
        <PersonPermissionsView personId={personId} onChoose={choose} onPendingChange={onPersonPending} />
      </div>
    </div>
  );
};

export default PermissionsPage;
