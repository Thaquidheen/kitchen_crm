/**
 * MarginCodesTab — Settings > Margin Codes (SUPER_ADMIN).
 * The administrator names margin percentages with short codes (R = 45%); staff see and choose only
 * the codes. One form adds a code or changes the one being edited; the table below lists them with
 * an on/off switch. The format rules are checked here first, the server has the last word.
 */

import { useRef, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { Edit2, Info, Plus, Save, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  cardCls,
  thClass,
  thActionsClass,
  iconBtn,
  inputCls,
  labelCls,
  SkeletonRows,
  ErrorRow,
  EmptyRow,
} from '@/features/products/components/tableKit';
import {
  useGetMarginCodesQuery,
  useSaveMarginCodeMutation,
  useDeleteMarginCodeMutation,
  type MarginCode,
} from './marginCodesAPI';
import {
  MAX_CODE_LENGTH,
  MAX_PERCENTAGE,
  formatPercentage,
  marginCodeProblems,
  refusalMessage,
  samePercentage,
  sortMarginCodes,
  type MarginCodeDraft,
} from './marginCodeRules';

const COL_COUNT = 5;
const EMPTY: MarginCodeDraft = { code: '', percentage: '', note: '' };
// A field with a problem gets a red border (inline, so it wins over the input's own border).
const problemBorder = (problem?: string) => (problem ? { borderColor: 'var(--color-error)' } : undefined);

/** On/off switch, the PermissionsPage one: on = offered to staff. */
const OfferedSwitch = ({ code, disabled, onChange }: { code: MarginCode; disabled?: boolean; onChange: () => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={code.active}
    aria-label={`Offer ${code.code} to staff`}
    title={
      code.active
        ? 'Offered to staff. Click to switch off'
        : 'Switched off: staff cannot choose it, quotations using it still show it. Click to switch on'
    }
    disabled={disabled}
    onClick={onChange}
    className="relative inline-flex h-[22px] w-10 shrink-0 items-center rounded-full transition-colors disabled:opacity-60"
    style={{ background: code.active ? 'var(--color-primary-600)' : 'var(--color-background-500)' }}
  >
    <span
      className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
      style={{ transform: code.active ? 'translateX(21px)' : 'translateX(3px)' }}
    />
  </button>
);

export function MarginCodesTab() {
  const { data, isLoading, isError } = useGetMarginCodesQuery();
  const [saveCode, { isLoading: saving }] = useSaveMarginCodeMutation();
  // A second instance for the switches, so moving one does not lock the form.
  const [switchCode] = useSaveMarginCodeMutation();
  const [deleteCode, { isLoading: deleting }] = useDeleteMarginCodeMutation();

  const [draft, setDraft] = useState<MarginCodeDraft>(EMPTY);
  const [editing, setEditing] = useState<MarginCode | null>(null);
  const [tried, setTried] = useState(false);
  const [switching, setSwitching] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MarginCode | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const codes = data ?? [];
  const rows = sortMarginCodes(codes);
  const problems = marginCodeProblems(draft, codes, editing?.id);
  // A field's problem shows once something is typed in it, or after the form was sent.
  const problem = (field: 'code' | 'percentage') =>
    tried || draft[field].trim() !== '' ? problems[field] : undefined;
  // Quotations keep the percentage they were made with, and their code is looked up by it.
  const movesPercentage =
    editing !== null && !problems.percentage && !samePercentage(Number(draft.percentage), editing.percentage);

  const set = (field: keyof MarginCodeDraft, value: string) => setDraft((prev) => ({ ...prev, [field]: value }));

  const reset = () => {
    setEditing(null);
    setDraft(EMPTY);
    setTried(false);
  };

  const startEdit = (code: MarginCode) => {
    setEditing(code);
    setDraft({ code: code.code, percentage: formatPercentage(code.percentage), note: code.note ?? '' });
    setTried(false);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (problems.code || problems.percentage) {
      setTried(true);
      return;
    }
    const code = draft.code.trim();
    try {
      await saveCode({
        id: editing?.id,
        code,
        percentage: Number(draft.percentage),
        note: draft.note.trim() || null,
      }).unwrap();
      toast.success(editing ? `Code ${code} saved` : `Code ${code} added`);
      reset();
    } catch (err) {
      toast.error(refusalMessage(err, 'Failed to save the margin code'));
    }
  };

  const toggle = async (code: MarginCode) => {
    setSwitching(code.id);
    try {
      // The server wants the whole code with every save; only "active" changes.
      await switchCode({
        id: code.id,
        code: code.code,
        percentage: code.percentage,
        note: code.note ?? null,
        active: !code.active,
      }).unwrap();
      toast.success(code.active ? `Code ${code.code} switched off` : `Code ${code.code} switched on`);
    } catch (err) {
      toast.error(refusalMessage(err, 'Failed to change the margin code'));
    } finally {
      setSwitching(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    try {
      await deleteCode(deleteTarget.id).unwrap();
      toast.success(`Code ${deleteTarget.code} deleted`);
      if (editing?.id === deleteTarget.id) {
        reset();
      }
      setDeleteTarget(null);
    } catch (err) {
      toast.error(refusalMessage(err, 'Failed to delete the margin code'));
    }
  };

  const codeProblem = problem('code');
  const percentageProblem = problem('percentage');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Explanation + add/edit form */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-text-900">Margin codes</h3>
          <p className="text-sm text-text-600 mt-1">
            Staff see and choose these codes, never the percentage behind them. A quotation keeps the percentage it
            was made with, so changing a code's percentage later does not change quotations already made.
          </p>
        </CardHeader>
        <CardBody>
          <form ref={formRef} onSubmit={submit} noValidate>
            <div className="text-[13px] font-semibold text-text-900 mb-3">
              {editing ? `Change code ${editing.code}` : 'Add a code'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[160px_180px_1fr] gap-3 sm:gap-4 items-start">
              <div>
                <label htmlFor="margin-code-code" className={labelCls}>
                  Code
                </label>
                <input
                  id="margin-code-code"
                  value={draft.code}
                  onChange={(e) => set('code', e.target.value)}
                  maxLength={MAX_CODE_LENGTH}
                  placeholder="R"
                  autoComplete="off"
                  aria-invalid={!!codeProblem}
                  className={inputCls}
                  style={problemBorder(codeProblem)}
                  disabled={saving}
                />
                {codeProblem && <p className="text-error text-xs mt-1">{codeProblem}</p>}
              </div>
              <div>
                <label htmlFor="margin-code-percentage" className={labelCls}>
                  Percentage
                </label>
                <div className="relative">
                  <input
                    id="margin-code-percentage"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={MAX_PERCENTAGE}
                    step="0.01"
                    value={draft.percentage}
                    onChange={(e) => set('percentage', e.target.value)}
                    placeholder="45"
                    autoComplete="off"
                    aria-invalid={!!percentageProblem}
                    className={`${inputCls} pr-8 tabular-nums`}
                    style={problemBorder(percentageProblem)}
                    disabled={saving}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-600 text-[13px] pointer-events-none">
                    %
                  </span>
                </div>
                {percentageProblem && <p className="text-error text-xs mt-1">{percentageProblem}</p>}
              </div>
              <div>
                <label htmlFor="margin-code-note" className={labelCls}>
                  Note <span className="font-normal text-text-500">(optional)</span>
                </label>
                <input
                  id="margin-code-note"
                  value={draft.note}
                  onChange={(e) => set('note', e.target.value)}
                  maxLength={255}
                  placeholder="For example: standard kitchens"
                  autoComplete="off"
                  className={inputCls}
                  disabled={saving}
                />
              </div>
            </div>

            {movesPercentage && editing && (
              <p className="mt-3 text-xs" style={{ color: 'var(--st-nego-fg)' }}>
                Quotations already made with {editing.code} keep {formatPercentage(editing.percentage)}% and their
                prices. They will show "Custom" instead of {editing.code}.
              </p>
            )}

            <div className="mt-4 flex flex-col-reverse sm:flex-row sm:items-center gap-3">
              <p className="flex-1 flex items-start gap-2 text-xs text-text-600">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>
                  A code is 1 to {MAX_CODE_LENGTH} letters, digits or dashes, and each code is used once. A percentage
                  is 0 to {MAX_PERCENTAGE} with up to 2 decimals, and has at most one code.
                </span>
              </p>
              {editing && (
                <Button type="button" variant="ghost" onClick={reset} disabled={saving}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                isLoading={saving}
                leftIcon={editing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              >
                {editing ? 'Save changes' : 'Add code'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* The codes */}
      <div className={cardCls}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-background-700">
                <th className={thClass}>Code</th>
                <th className={thClass}>Percentage</th>
                <th className={thClass}>Note</th>
                <th className={thClass}>Offered to staff</th>
                <th className={thActionsClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows cols={COL_COUNT} rows={3} />
              ) : isError ? (
                <ErrorRow cols={COL_COUNT} entity="the margin codes" />
              ) : rows.length === 0 ? (
                <EmptyRow
                  cols={COL_COUNT}
                  filtered={false}
                  title="No margin codes yet"
                  sub='Add the first code above. Until then staff see "Custom" for every margin.'
                />
              ) : (
                rows.map((code) => (
                  <tr
                    key={code.id}
                    className={`border-t border-background-600 hover:bg-background-700 transition-colors ${
                      editing?.id === code.id ? 'bg-background-700' : ''
                    }`}
                  >
                    <td className="px-3 py-[13px] text-[13.5px] font-semibold text-text-900 whitespace-nowrap">
                      {code.code}
                    </td>
                    <td className="px-3 py-[13px] text-[13px] text-text-800 tabular-nums whitespace-nowrap">
                      {formatPercentage(code.percentage)}%
                    </td>
                    <td className="px-3 py-[13px]">
                      <div
                        className="text-[13px] text-text-800 whitespace-nowrap overflow-hidden text-ellipsis max-w-[380px]"
                        title={code.note || undefined}
                      >
                        {code.note || '—'}
                      </div>
                    </td>
                    <td className="px-3 py-[13px]">
                      <OfferedSwitch code={code} disabled={switching !== null} onChange={() => toggle(code)} />
                    </td>
                    <td className="px-3.5 py-[13px]">
                      <div className="flex justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => startEdit(code)}
                          title="Edit"
                          aria-label={`Edit ${code.code}`}
                          className={iconBtn}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(code)}
                          title="Delete"
                          aria-label={`Delete ${code.code}`}
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="m-0 text-[12px] text-text-600">
        A switched-off code is no longer offered to staff; quotations that use it still show it. Deleting a code makes
        those quotations show "Custom". Their prices do not change either way.
      </p>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete margin code"
        message={
          deleteTarget
            ? `Delete the code ${deleteTarget.code} (${formatPercentage(deleteTarget.percentage)}%)? Quotations that use it will show "Custom" instead; their prices do not change. To stop offering it but keep it on those quotations, switch it off instead.`
            : ''
        }
        confirmText="Delete"
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
}

export default MarginCodesTab;
