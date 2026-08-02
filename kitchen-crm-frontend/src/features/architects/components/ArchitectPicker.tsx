/**
 * ArchitectPicker
 * Search the Architects module for an architect or builder, or type a name that isn't there
 * yet and create it inline — the new record is saved to the module and reusable immediately.
 *
 * Headless UI's Combobox rather than a hand-rolled dropdown: it portals the option list via
 * `anchor`, which is what lets it escape the customer modal's `overflow-y-auto` clipping.
 */

import { useMemo, useState } from 'react';
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';
import { Building2, ChevronDown, Loader2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateArchitectMutation, useGetAllArchitectsQuery } from '../architectsAPI';
import { partnerTypeLabel, partnerTypeOf } from '../types';
import type { Architect, PartnerType } from '../types';

const inputCls =
  'w-full h-[38px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500';

/** Sentinel option value meaning "create a record from what was typed". */
const CREATE = '__create__';

export interface ArchitectPickerProps {
  type: PartnerType;
  valueId?: number;
  /** Denormalised fallbacks so an edit-mode row paints before /architects/all resolves. */
  valueName?: string;
  valueFirm?: string;
  valueContact?: string;
  /** Records already used by other rows — shown greyed out so they can't be added twice. */
  takenIds?: number[];
  disabled?: boolean;
  onSelect: (architect: Architect) => void;
  onClear: () => void;
}

export function ArchitectPicker({
  type,
  valueId,
  valueName,
  valueFirm,
  valueContact,
  takenIds = [],
  disabled = false,
  onSelect,
  onClear,
}: ArchitectPickerProps) {
  const [query, setQuery] = useState('');
  // Deliberately unfiltered: one cache entry serves every picker, and it is the same entry
  // createArchitect patches optimistically, so a record added in one row is instantly
  // visible to the next row's duplicate guard.
  const { data: allArchitects = [], isLoading } = useGetAllArchitectsQuery();
  const [createArchitect, { isLoading: isCreating }] = useCreateArchitectMutation();

  const label = partnerTypeLabel(type);
  const lower = label.toLowerCase();

  const pool = useMemo(
    () => allArchitects.filter((a) => partnerTypeOf(a) === type),
    [allArchitects, type]
  );

  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      (q
        ? pool.filter(
            (a) =>
              a.architectureName.toLowerCase().includes(q) ||
              a.firm?.toLowerCase().includes(q) ||
              a.principalArchitectName?.toLowerCase().includes(q) ||
              a.contactNumber?.toLowerCase().includes(q)
          )
        : pool
      ).slice(0, 50),
    [pool, q]
  );

  // Guard 1: an exact name match means there is nothing to create — offer the record instead.
  const exactMatch = q
    ? pool.find((a) => a.architectureName.trim().toLowerCase() === q)
    : undefined;
  const canCreate = !!q && !exactMatch && !isCreating;

  const handleCreate = async () => {
    const name = query.trim();
    if (!name) return;

    // Guard 2: the cache may have gained the record since canCreate was computed.
    const dupe = pool.find((a) => a.architectureName.trim().toLowerCase() === name.toLowerCase());
    if (dupe) {
      onSelect(dupe);
      setQuery('');
      toast(`Linked the existing ${lower} “${dupe.architectureName}”`);
      return;
    }

    try {
      const created = await createArchitect({ architectureName: name, partnerType: type }).unwrap();
      onSelect(created);
      setQuery('');
      toast.success(`${label} “${created.architectureName}” added to the Architects module`);
    } catch (e: any) {
      toast.error(e?.data?.message || `Could not create ${lower}`);
    }
  };

  // ----- Linked: show the record's details read-only -----
  if (valueId) {
    const selected = pool.find((a) => a.id === valueId);
    const name = selected?.architectureName ?? valueName;
    const firm = selected?.firm ?? valueFirm;
    const phone = selected?.contactNumber ?? valueContact;
    const details = [firm, phone].filter(Boolean).join(' · ');

    return (
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-[10px] border border-primary-600/40 bg-background-800">
        <Building2 size={15} className="text-primary-600 mt-[2px] shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-text-900 truncate">
            {name ?? `Linked ${lower}`}
          </div>
          <div className="text-[11.5px] text-text-600 mt-0.5 truncate">
            {details || `No firm or phone on record — add them in the Architects module`}
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={onClear}
            title={`Unlink ${lower}`}
            className="shrink-0 text-text-500 hover:text-error transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  }

  // ----- Unlinked: search or create -----
  return (
    <Combobox
      immediate
      value={null}
      onChange={(value: Architect | string | null) => {
        if (!value) return;
        if (value === CREATE) {
          void handleCreate();
          return;
        }
        onSelect(value as Architect);
        setQuery('');
      }}
      disabled={disabled || isCreating}
    >
      <div className="relative">
        <ComboboxInput
          className={`${inputCls} pr-9`}
          placeholder={`Search ${lower}s or type a new name…`}
          displayValue={() => query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            // This sits inside CustomerForm's <form>; without this Enter submits the customer.
            if (e.key === 'Enter') e.preventDefault();
          }}
          autoComplete="off"
        />
        <ComboboxButton className="absolute right-2 top-1/2 -translate-y-1/2 text-text-500 hover:text-text-900">
          {isCreating ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
        </ComboboxButton>

        <ComboboxOptions
          anchor="bottom start"
          // z-[60]: CustomerFormModal is a hand-rolled z-50 overlay and this portals to <body>.
          className="z-[60] w-[var(--input-width)] max-h-56 overflow-auto rounded-[10px] border border-background-500 bg-background-800 shadow-2xl p-1 [--anchor-gap:4px] empty:invisible"
        >
          {isLoading && (
            <div className="px-3 py-2 text-[12.5px] text-text-600">Loading {lower}s…</div>
          )}

          {!isLoading && matches.length === 0 && !canCreate && (
            <div className="px-3 py-2 text-[12.5px] text-text-600">
              No {lower}s yet — type a name to create one.
            </div>
          )}

          {matches.map((a) => {
            const taken = takenIds.includes(a.id);
            const sub = [a.firm, a.contactNumber].filter(Boolean).join(' · ');
            return (
              <ComboboxOption
                key={a.id}
                value={a}
                disabled={taken}
                className="flex items-center gap-2 px-2.5 py-2 rounded-[8px] cursor-pointer data-[focus]:bg-background-700 data-[disabled]:opacity-45 data-[disabled]:cursor-not-allowed"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-text-900 truncate">{a.architectureName}</div>
                  {sub && <div className="text-[11.5px] text-text-600 truncate">{sub}</div>}
                </div>
                {taken && <span className="text-[11px] text-text-500 shrink-0">Added</span>}
              </ComboboxOption>
            );
          })}

          {canCreate && (
            <ComboboxOption
              value={CREATE}
              className="flex items-center gap-2 px-2.5 py-2 mt-1 pt-2.5 rounded-[8px] cursor-pointer border-t border-background-600 data-[focus]:bg-background-700"
            >
              <Plus size={13} className="text-primary-600 shrink-0" />
              <span className="text-[12.5px] text-text-900 truncate">
                Create “<span className="font-semibold">{query.trim()}</span>” as a new {lower}
              </span>
            </ComboboxOption>
          )}

          {exactMatch && (
            <div className="px-2.5 py-1.5 text-[11.5px] text-text-500">
              “{exactMatch.architectureName}” already exists — pick it above.
            </div>
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}

export default ArchitectPicker;
