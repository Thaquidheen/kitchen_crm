/**
 * RequirementSheet — a customer's checklist from the company's paper requirement sheet.
 *
 * Editable (customer page, with "Requirement sheet"): each item is marked Needed or Not needed
 * (clicking the same mark again clears it), with quick choices, a quantity and a note; every
 * section takes extra rows of its own. Nothing is saved until "Save changes", and only the items
 * that changed are sent. Read-only (designers in Designs, staff without the permission): what was
 * filled in, nothing to change. Both can print a clean sheet.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBlocker } from 'react-router-dom';
import { Check, Plus, Printer, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { usePermissions } from '@/features/permissions/usePermissions';
import { fmtReminderDateTime } from '@/utils/reminderFormat';
import {
  useGetRequirementSheetQuery,
  useSaveRequirementSheetMutation,
  type RequirementCounts,
  type RequirementItem,
  type RequirementSection,
  type RequirementSheet as SheetData,
  type RequirementStatus,
} from '../requirementSheetAPI';
import {
  MAX_LABEL,
  MAX_NOTE,
  NO_EDITS,
  EMPTY_DRAFT,
  buildChanges,
  choiceText,
  editProblems,
  isSheetEmpty,
  labelError,
  liveCounts,
  nextStatus,
  parseChoice,
  sectionRows,
  shownItems,
  toggleChoice,
  type ItemDraft,
  type SheetEdits,
  type SheetRow,
} from '../requirementSheetRules';

const card = 'bg-background-800 border border-background-600 rounded-[14px]';
const inputCls =
  'h-[34px] px-2.5 rounded-[9px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors';
const smallBtn =
  'inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] border border-background-600 bg-background-800 text-[12.5px] font-medium text-text-900 hover:bg-background-700 disabled:opacity-50 disabled:cursor-not-allowed';
const errMsg = (e: any, fallback: string) => e?.message || e?.data?.message || fallback;

const MARK: Record<RequirementStatus, { label: string; st: string }> = {
  NEEDED: { label: 'Needed', st: 'confirmed' },
  NOT_NEEDED: { label: 'Not needed', st: 'lost' },
};

const markText = (status: RequirementStatus | null) => (status ? MARK[status].label : 'Not marked');

// ---------------------------------------------------------------- printing

/**
 * The printed sheet sits in its own element on <body> while printing; print CSS hides everything
 * else, so the app's dark theme, sidebar and any open drawer stay off the paper.
 */
const PRINT_CSS = `
.rs-print { display: none; }
@media print {
  @page { margin: 12mm; }
  html, body { background: #fff !important; overflow: visible !important; height: auto !important; }
  body > *:not(.rs-print) { display: none !important; }
  .rs-print { display: block !important; color: #111; font: 11px/1.35 system-ui, -apple-system, "Segoe UI", sans-serif; }
  .rs-print h1 { font-size: 16px; margin: 0 0 2px; }
  .rs-print .rs-meta { color: #444; margin: 0 0 8px; }
  .rs-print h2 { font-size: 11.5px; margin: 10px 0 3px; text-transform: uppercase; letter-spacing: .05em; }
  .rs-print table { width: 100%; border-collapse: collapse; }
  .rs-print tr { page-break-inside: avoid; }
  .rs-print th, .rs-print td { border: 1px solid #bbb; padding: 3px 6px; text-align: left; vertical-align: top; }
  .rs-print th { background: #f0f0f0; font-weight: 600; }
  .rs-print .rs-mark { width: 74px; white-space: nowrap; }
  .rs-print .rs-qty { width: 44px; text-align: right; }
  .rs-print .rs-empty { color: #666; }
}`;

const countsText = (c: RequirementCounts) => `${c.needed} needed · ${c.notNeeded} not needed · ${c.unmarked} not marked`;

const lastUpdatedText = (sheet: SheetData) =>
  sheet.updatedAt
    ? `Last updated ${fmtReminderDateTime(sheet.updatedAt)}${sheet.updatedByName ? ` by ${sheet.updatedByName}` : ''}`
    : 'Nothing entered yet';

/** Sections worth showing, each with the items to show. */
const visibleSections = (sheet: SheetData, onlyMarked: boolean) =>
  sheet.sections
    .map((section) => ({ section, items: shownItems(section, onlyMarked) }))
    .filter(({ items }) => items.length > 0);

const SheetPrint: React.FC<{ sheet: SheetData; onlyMarked: boolean }> = ({ sheet, onlyMarked }) => {
  const sections = visibleSections(sheet, onlyMarked);
  return createPortal(
    <div className="rs-print">
      <style>{PRINT_CSS}</style>
      <h1>Requirement sheet — {sheet.customerName}</h1>
      <p className="rs-meta">
        Customer #{sheet.customerId} · {countsText(sheet.counts)} · {lastUpdatedText(sheet)} · Printed{' '}
        {new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
        {onlyMarked ? ' · Only marked items' : ''}
      </p>
      {sections.length === 0 && <p className="rs-empty">Nothing has been entered on this sheet yet.</p>}
      {sections.map(({ section, items }) => (
        <section key={section.key}>
          <h2>{section.title}</h2>
          <table>
            <thead>
              <tr>
                <th className="rs-mark">Mark</th>
                <th>Item</th>
                <th>Choice</th>
                <th className="rs-qty">Qty</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.key}>
                  <td className="rs-mark">
                    {item.status === 'NEEDED' ? '✓ Needed' : item.status === 'NOT_NEEDED' ? '✗ Not needed' : '—'}
                  </td>
                  <td>{item.label}</td>
                  <td>{choiceText(item.choice)}</td>
                  <td className="rs-qty">{item.quantity ?? ''}</td>
                  <td>{item.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>,
    document.body,
  );
};

/** Puts the print view on the page, prints, and takes it away once the print dialog is closed. */
const usePrint = () => {
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    if (!printing) {return;}
    const done = () => setPrinting(false);
    window.addEventListener('afterprint', done);
    // A moment for the print view to be on the page before the browser takes its picture of it.
    const timer = window.setTimeout(() => window.print(), 50);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('afterprint', done);
    };
  }, [printing]);
  return { printing, print: () => (printing ? window.print() : setPrinting(true)) };
};

// ---------------------------------------------------------------- shared bits

const CountChips: React.FC<{ counts: RequirementCounts }> = ({ counts }) => (
  <div className="flex items-center gap-1.5 flex-wrap">
    <span
      className="inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[12px] font-semibold tabular-nums"
      style={{ background: 'var(--st-confirmed-bg)', color: 'var(--st-confirmed-fg)' }}
    >
      <Check size={12} strokeWidth={3} /> {counts.needed} needed
    </span>
    <span
      className="inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full text-[12px] font-semibold tabular-nums"
      style={{ background: 'var(--st-lost-bg)', color: 'var(--st-lost-fg)' }}
    >
      <X size={12} strokeWidth={3} /> {counts.notNeeded} not needed
    </span>
    <span
      className="inline-flex items-center px-2.5 py-[3px] rounded-full text-[12px] font-semibold tabular-nums"
      style={{ background: 'var(--st-draft-bg)', color: 'var(--st-draft-fg)' }}
    >
      {counts.unmarked} not marked
    </span>
  </div>
);

const OnlyMarkedToggle: React.FC<{ value: boolean; onChange: (v: boolean) => void }> = ({ value, onChange }) => (
  <label className="inline-flex items-center gap-2 text-[12.5px] text-text-700 cursor-pointer select-none whitespace-nowrap">
    <input
      type="checkbox"
      checked={value}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 accent-[var(--color-primary-600)]"
    />
    Only marked items
  </label>
);

const MarkBadge: React.FC<{ status: RequirementStatus | null }> = ({ status }) =>
  status ? (
    <span
      className="inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[11.5px] font-semibold whitespace-nowrap"
      style={{ background: `var(--st-${MARK[status].st}-bg)`, color: `var(--st-${MARK[status].st}-fg)` }}
    >
      {status === 'NEEDED' ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
      {MARK[status].label}
    </span>
  ) : (
    <span
      className="inline-flex items-center px-2 py-[2px] rounded-full text-[11.5px] font-semibold whitespace-nowrap"
      style={{ background: 'var(--st-draft-bg)', color: 'var(--st-draft-fg)' }}
    >
      Not marked
    </span>
  );

const changedBy = (row: { updatedByName?: string | null; updatedAt?: string | null }) =>
  row.updatedAt ? `Last changed ${fmtReminderDateTime(row.updatedAt)}${row.updatedByName ? ` by ${row.updatedByName}` : ''}` : undefined;

// ---------------------------------------------------------------- read only

const ReadOnlyRow: React.FC<{ item: RequirementItem }> = ({ item }) => {
  const choices = parseChoice(item.choice);
  return (
    <div className="px-4 py-2.5 border-t border-background-600 first:border-t-0" title={changedBy(item)}>
      <div className="flex items-center gap-x-3 gap-y-1.5 flex-wrap">
        <MarkBadge status={item.status} />
        <span className="min-w-0 flex-1 text-[13px] font-medium text-text-900 break-words">{item.label}</span>
        {choices.length > 0 && (
          <span className="flex items-center gap-1 flex-wrap">
            {choices.map((c) => (
              <span
                key={c}
                className="px-2 py-[1px] rounded-full border border-background-500 text-[11.5px] font-medium text-text-800"
              >
                {c}
              </span>
            ))}
          </span>
        )}
        {item.quantity !== null && item.quantity !== undefined && (
          <span className="text-[12.5px] text-text-700 tabular-nums whitespace-nowrap">
            Qty <span className="font-semibold text-text-900">{item.quantity}</span>
          </span>
        )}
      </div>
      {item.note && <p className="m-0 mt-1 text-[12.5px] text-text-700 whitespace-pre-wrap break-words">{item.note}</p>}
    </div>
  );
};

const ReadOnlySheet: React.FC<{ sheet: SheetData }> = ({ sheet }) => {
  // Read only, the filled-in items are what matters; the full list is one click away.
  const [onlyMarked, setOnlyMarked] = useState(true);
  const { printing, print } = usePrint();

  if (isSheetEmpty(sheet)) {
    return (
      <div className={`${card} px-6 py-10 text-center`}>
        <div className="text-[14px] font-semibold text-text-900">No requirement sheet yet</div>
        <div className="text-[12.5px] text-text-700 mt-1">Nothing has been marked for {sheet.customerName} so far.</div>
      </div>
    );
  }

  const sections = visibleSections(sheet, onlyMarked);
  return (
    <div className="space-y-3">
      <div className={`${card} px-4 py-3 flex items-center gap-x-4 gap-y-2 flex-wrap`}>
        <CountChips counts={sheet.counts} />
        <span className="text-[12px] text-text-600">{lastUpdatedText(sheet)}</span>
        <span className="flex-1" />
        <OnlyMarkedToggle value={onlyMarked} onChange={setOnlyMarked} />
        <button type="button" onClick={print} className={smallBtn}>
          <Printer size={13} /> Print
        </button>
      </div>
      {sections.map(({ section, items }) => (
        <section key={section.key} className={`${card} overflow-hidden`} aria-label={section.title}>
          <div className="px-4 pt-3 pb-2.5 border-b border-background-600 text-[13.5px] font-semibold text-text-900">
            {section.title}
          </div>
          {items.map((item) => (
            <ReadOnlyRow key={item.key} item={item} />
          ))}
        </section>
      ))}
      {printing && <SheetPrint sheet={sheet} onlyMarked={onlyMarked} />}
    </div>
  );
};

// ---------------------------------------------------------------- editable

const MarkToggle: React.FC<{ status: RequirementStatus | null; label: string; onClick: (s: RequirementStatus) => void }> = ({
  status,
  label,
  onClick,
}) => (
  <div className="flex items-center gap-1 shrink-0" role="group" aria-label={`${label}: ${markText(status)}`}>
    {(['NEEDED', 'NOT_NEEDED'] as RequirementStatus[]).map((s) => {
      const active = status === s;
      return (
        <button
          key={s}
          type="button"
          onClick={() => onClick(s)}
          aria-pressed={active}
          title={active ? `${MARK[s].label} — click again to clear` : MARK[s].label}
          className={`w-[30px] h-[30px] rounded-[8px] border flex items-center justify-center transition-colors ${
            active ? 'border-transparent' : 'border-background-600 text-text-500 hover:bg-background-700 hover:text-text-900'
          }`}
          style={active ? { background: `var(--st-${MARK[s].st}-bg)`, color: `var(--st-${MARK[s].st}-fg)` } : undefined}
        >
          {s === 'NEEDED' ? <Check size={15} strokeWidth={3} /> : <X size={15} strokeWidth={3} />}
        </button>
      );
    })}
  </div>
);

const ChoiceChips: React.FC<{ options: string[][]; choice: string | null; onToggle: (value: string) => void }> = ({
  options,
  choice,
  onToggle,
}) => {
  const chosen = parseChoice(choice);
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {options.map((group, gi) => (
        <React.Fragment key={gi}>
          {gi > 0 && <span className="w-px h-4 bg-background-500 mx-0.5" aria-hidden />}
          {group.map((opt) => {
            const on = chosen.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onToggle(opt)}
                aria-pressed={on}
                className={`h-7 px-2.5 rounded-full border text-[12px] font-medium whitespace-nowrap transition-colors ${
                  on ? 'border-primary-600 text-primary-600' : 'border-background-600 text-text-700 hover:bg-background-700'
                }`}
                style={on ? { background: 'color-mix(in oklab, var(--color-primary-600) 14%, transparent)' } : undefined}
              >
                {opt}
              </button>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

// Mark | Item | Options | Qty | Note | remove — wraps into lines on a phone.
const ROW_GRID = 'lg:grid lg:grid-cols-[64px_minmax(140px,1fr)_minmax(0,1.5fr)_84px_minmax(180px,1.6fr)_30px] lg:items-center';

const EditRow: React.FC<{
  row: SheetRow;
  problem?: string;
  onChange: (fn: (d: ItemDraft) => ItemDraft) => void;
  onRemove?: () => void;
}> = ({ row, problem, onChange, onRemove }) => (
  <div
    className="px-4 py-2.5 border-t border-background-600"
    style={row.changed ? { boxShadow: 'inset 3px 0 0 var(--color-primary-600)' } : undefined}
  >
    <div className={`flex items-center gap-x-3 gap-y-2 flex-wrap ${ROW_GRID}`}>
      <MarkToggle status={row.draft.status} label={row.label} onClick={(s) => onChange((d) => ({ ...d, status: nextStatus(d.status, s) }))} />
      <span className="min-w-0 flex-1 lg:flex-none text-[13px] font-medium text-text-900 break-words" title={changedBy(row)}>
        {row.label}
        {row.isNew && <span className="ml-1.5 text-[11px] font-semibold text-primary-600">new</span>}
      </span>
      <div className={row.options.length > 0 ? 'w-full lg:w-auto' : 'hidden lg:block'}>
        {row.options.length > 0 && (
          <ChoiceChips
            options={row.options}
            choice={row.draft.choice}
            onToggle={(v) => onChange((d) => ({ ...d, choice: toggleChoice(row.options, d.choice, v) }))}
          />
        )}
      </div>
      <input
        type="text"
        inputMode="decimal"
        value={row.draft.quantity}
        onChange={(e) => {
          const quantity = e.target.value;
          onChange((d) => ({ ...d, quantity }));
        }}
        placeholder="Qty"
        aria-label={`${row.label} quantity`}
        className={`w-[84px] ${inputCls} tabular-nums`}
      />
      <input
        type="text"
        value={row.draft.note}
        onChange={(e) => {
          const note = e.target.value;
          onChange((d) => ({ ...d, note }));
        }}
        maxLength={MAX_NOTE}
        placeholder="Note"
        aria-label={`${row.label} note`}
        className={`flex-1 min-w-[160px] lg:min-w-0 lg:w-full ${inputCls}`}
      />
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${row.label}`}
          title="Remove this item"
          className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-text-500 hover:bg-background-600 hover:text-text-900"
        >
          <X size={15} />
        </button>
      ) : (
        <span className="hidden lg:block" />
      )}
    </div>
    {problem && (
      <p className="m-0 mt-1 text-[12px]" style={{ color: 'var(--st-lost-fg)' }}>
        {problem}
      </p>
    )}
  </div>
);

const AddItem: React.FC<{ title: string; onAdd: (label: string) => boolean }> = ({ title, onAdd }) => {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const add = () => {
    if (onAdd(label)) {
      setLabel('');
      setOpen(false);
    }
  };
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-primary-600 hover:underline"
      >
        <Plus size={14} /> Add item
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        autoFocus
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add();
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        maxLength={MAX_LABEL}
        placeholder={`New item in ${title}`}
        className={`flex-1 min-w-[200px] ${inputCls}`}
      />
      <button type="button" onClick={add} className="btn-raised-accent h-8 px-3 rounded-[9px] text-[12.5px] font-semibold">
        Add
      </button>
      <button
        type="button"
        onClick={() => {
          setLabel('');
          setOpen(false);
        }}
        className="h-8 px-3 rounded-[9px] text-[12.5px] font-medium text-text-700 hover:bg-background-700"
      >
        Cancel
      </button>
    </div>
  );
};

const SheetEditor: React.FC<{ sheet: SheetData }> = ({ sheet }) => {
  const [save, { isLoading: saving }] = useSaveRequirementSheetMutation();
  // Only what was changed on the screen is held here, on top of the saved sheet, so a refetch in
  // the background never throws away what is being filled in.
  const [edits, setEdits] = useState<SheetEdits>(NO_EDITS);
  const [onlyMarked, setOnlyMarked] = useState(false);
  const { printing, print } = usePrint();
  const newId = useRef(0);

  const changes = useMemo(() => buildChanges(sheet, edits), [sheet, edits]);
  const problems = useMemo(() => editProblems(sheet, edits), [sheet, edits]);
  const counts = useMemo(() => liveCounts(sheet, edits), [sheet, edits]);
  const pending = changes.length;
  const problemCount = Object.keys(problems).length;

  // Staff fill this in at the client's site: leaving with answers not saved is asked first.
  useEffect(() => {
    if (pending === 0) {return;}
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [pending]);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => pending > 0 && currentLocation.pathname !== nextLocation.pathname,
  );

  const change = (row: SheetRow, fn: (d: ItemDraft) => ItemDraft) =>
    setEdits((prev) =>
      row.isNew
        ? { ...prev, added: prev.added.map((r) => (r.tempId === row.id ? { ...r, draft: fn(r.draft) } : r)) }
        : { ...prev, drafts: { ...prev.drafts, [row.id]: fn(prev.drafts[row.id] ?? row.draft) } },
    );

  const remove = (row: SheetRow) =>
    setEdits((prev) => {
      if (row.isNew) {return { ...prev, added: prev.added.filter((r) => r.tempId !== row.id) };}
      const drafts = { ...prev.drafts };
      delete drafts[row.id];
      return { ...prev, drafts, removed: [...prev.removed, row.id] };
    });

  const add = (section: RequirementSection, label: string): boolean => {
    const problem = labelError(label);
    if (problem) {
      toast.error(problem);
      return false;
    }
    newId.current += 1;
    const row = { tempId: `new-${newId.current}`, section: section.key, label: label.trim(), draft: EMPTY_DRAFT };
    setEdits((prev) => ({ ...prev, added: [...prev.added, row] }));
    return true;
  };

  const discard = () => setEdits(NO_EDITS);

  const submit = async () => {
    if (pending === 0 || problemCount > 0) {return;}
    try {
      await save({ customerId: sheet.customerId, items: changes }).unwrap();
      setEdits(NO_EDITS);
      toast.success(pending === 1 ? 'Requirement saved' : `${pending} requirements saved`);
    } catch (e) {
      toast.error(errMsg(e, 'Failed to save the requirement sheet'));
    }
  };

  const saveControls = pending > 0 && (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[12.5px] text-text-700">
        {problemCount > 0
          ? `Fix ${problemCount} ${problemCount === 1 ? 'item' : 'items'} to save`
          : `${pending} ${pending === 1 ? 'change' : 'changes'} not saved`}
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
        disabled={saving || problemCount > 0}
        className="btn-raised-accent px-4 py-2 rounded-[10px] text-[13px] font-semibold disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className={`${card} px-4 py-3 flex items-center gap-x-4 gap-y-2 flex-wrap`}>
        <CountChips counts={counts} />
        <span className="text-[12px] text-text-600">{lastUpdatedText(sheet)}</span>
        <span className="flex-1" />
        {saveControls || (
          <div className="flex items-center gap-3 flex-wrap">
            <OnlyMarkedToggle value={onlyMarked} onChange={setOnlyMarked} />
            <button type="button" onClick={print} className={smallBtn} title="Print the saved sheet">
              <Printer size={13} /> Print
            </button>
          </div>
        )}
      </div>

      {sheet.sections.map((section) => {
        const rows = sectionRows(section, edits);
        const needed = rows.filter((r) => r.draft.status === 'NEEDED').length;
        return (
          <section key={section.key} className={`${card} overflow-hidden`} aria-label={section.title}>
            <div className="px-4 pt-3 pb-2.5 flex items-center gap-2 flex-wrap">
              <span className="text-[13.5px] font-semibold text-text-900">{section.title}</span>
              {needed > 0 && <span className="text-[12px] text-text-600 tabular-nums">{needed} needed</span>}
              {section.hint && rows.length > 0 && <span className="text-[12px] text-text-500">· {section.hint}</span>}
            </div>
            {rows.length > 0 && (
              <div
                className={`hidden px-4 pb-1.5 text-[10.5px] font-semibold tracking-[0.07em] uppercase text-text-500 gap-x-3 ${ROW_GRID}`}
              >
                <span>Mark</span>
                <span>Item</span>
                <span>Options</span>
                <span>Qty</span>
                <span>Note</span>
                <span />
              </div>
            )}
            {rows.length === 0 && (
              <p className="m-0 px-4 pb-1 text-[12.5px] text-text-500">{section.hint || 'No items yet.'}</p>
            )}
            {rows.map((row) => (
              <EditRow
                key={row.id}
                row={row}
                problem={problems[row.id]}
                onChange={(fn) => change(row, fn)}
                onRemove={row.custom ? () => remove(row) : undefined}
              />
            ))}
            <div className="px-4 py-2.5 border-t border-background-600">
              <AddItem title={section.title} onAdd={(label) => add(section, label)} />
            </div>
          </section>
        );
      })}

      {/* A long sheet on a phone: the save is at the bottom too. */}
      {saveControls && <div className={`${card} px-4 py-3 flex justify-end`}>{saveControls}</div>}

      {printing && <SheetPrint sheet={sheet} onlyMarked={onlyMarked} />}

      <ConfirmDialog
        isOpen={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        title="Leave without saving?"
        message={`${pending} ${pending === 1 ? 'change' : 'changes'} to the requirement sheet ${pending === 1 ? 'is' : 'are'} not saved and will be lost.`}
        confirmText="Leave"
        cancelText="Stay"
        type="warning"
      />
    </div>
  );
};

// ---------------------------------------------------------------- entry points

/** The sheet itself: editable, or read only (no edit controls at all). */
export const RequirementSheet: React.FC<{ sheet: SheetData; readOnly?: boolean }> = ({ sheet, readOnly }) =>
  readOnly ? <ReadOnlySheet sheet={sheet} /> : <SheetEditor sheet={sheet} />;

/** The customer page's Requirements tab: editable with "Requirement sheet", read only without. */
export const CustomerRequirementSheet: React.FC<{ customerId: number }> = ({ customerId }) => {
  const { can, ready } = usePermissions();
  const { data: sheet, isLoading, isError } = useGetRequirementSheetQuery(customerId, { refetchOnFocus: true });

  if (isLoading || !ready) {
    return <div className={`${card} p-6 animate-pulse h-64`} />;
  }
  // Only when nothing was ever loaded: a failed background refresh keeps the sheet (and whatever is
  // being typed into it) on screen.
  if (!sheet) {
    return (
      <div className={`${card} px-6 py-12 text-center`}>
        <div className="text-[14px] font-semibold text-text-900">The requirement sheet could not be loaded</div>
        <div className="text-[12.5px] text-text-700 mt-1">Refresh the page to try again.</div>
      </div>
    );
  }
  // Keyed by customer: moving to another customer starts from their saved sheet.
  return <RequirementSheet key={customerId} sheet={sheet} readOnly={!can('customers.requirements')} />;
};

export default RequirementSheet;
