/**
 * Admin: laser meter adapters — list, create, edit, activate/deactivate, delete, and the change
 * history (who changed what, with the config before and after).
 */

import { useState } from 'react';
import { History, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Modal, Spinner } from '@/components/ui';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  recordToConfig,
  useCreateLaserAdapterMutation,
  useDeleteLaserAdapterMutation,
  useGetLaserAdapterAuditQuery,
  useGetLaserAdaptersQuery,
  useUpdateLaserAdapterMutation,
  type LaserAdapterRecord,
} from '../api/laserMeterAPI';
import { AdapterEditor } from './AdapterEditor';
import { emptyAdapterConfig } from '../core/adapterDefaults';
import { apiErrorMessage } from '../api/apiError';
import { describeParser } from '../core/decodingProbe';
import type { LaserAdapterConfig } from '../core/types';


const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '—');

export interface AdapterAdminProps {
  /** Open the editor prefilled (e.g. from the Device Lab's "Save as Adapter"). */
  draft?: LaserAdapterConfig | null;
  onDraftConsumed?: () => void;
}

export const AdapterAdmin = ({ draft, onDraftConsumed }: AdapterAdminProps) => {
  const { data: adapters = [], isLoading } = useGetLaserAdaptersQuery();
  const [createAdapter, createState] = useCreateLaserAdapterMutation();
  const [updateAdapter, updateState] = useUpdateLaserAdapterMutation();
  const [deleteAdapter] = useDeleteLaserAdapterMutation();

  const [editing, setEditing] = useState<{ record: LaserAdapterRecord | null; config: LaserAdapterConfig } | null>(
    draft ? { record: null, config: draft } : null
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<LaserAdapterRecord | null>(null);
  const [historyFor, setHistoryFor] = useState<LaserAdapterRecord | 'all' | null>(null);

  const close = () => {
    setEditing(null);
    setServerError(null);
    onDraftConsumed?.();
  };

  const save = async (config: LaserAdapterConfig) => {
    setServerError(null);
    const body = { adapterKey: config.id, displayName: config.displayName, active: config.active, config };
    try {
      if (editing?.record) {
        await updateAdapter({ id: editing.record.id, ...body }).unwrap();
        toast.success('Adapter saved');
      } else {
        await createAdapter(body).unwrap();
        toast.success('Adapter created');
      }
      close();
    } catch (e) {
      setServerError(apiErrorMessage(e, 'Could not save the adapter'));
    }
  };

  const toggleActive = async (r: LaserAdapterRecord) => {
    const config = { ...recordToConfig(r), active: !r.active };
    try {
      await updateAdapter({ id: r.id, adapterKey: r.adapterKey, displayName: r.displayName, active: !r.active, config }).unwrap();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-[13px] text-text-600 max-w-xl">
          An adapter tells the app how to talk to one model of laser meter. Create them from the Device Lab, or by hand
          from the maker’s protocol notes.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" leftIcon={<History size={14} />} onClick={() => setHistoryFor('all')}>
            Change history
          </Button>
          <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setEditing({ record: null, config: emptyAdapterConfig() })}>
            New adapter
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : adapters.length === 0 ? (
        <p className="text-[13px] text-text-600">No adapters yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-[10px] border border-background-600">
          <table className="w-full text-[13px]">
            <thead className="bg-background-700 text-left text-text-600">
              <tr>
                <th className="px-3 py-2 font-medium">Model</th>
                <th className="px-3 py-2 font-medium">Reading format</th>
                <th className="px-3 py-2 font-medium">Updated</th>
                <th className="px-3 py-2 font-medium">Active</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {adapters.map((r) => (
                <tr key={r.id} className="border-t border-background-600 align-top">
                  <td className="px-3 py-2">
                    <div className="font-semibold text-text-900">{r.displayName}</div>
                    <div className="text-text-500 font-mono text-[12px]">{r.adapterKey}</div>
                  </td>
                  <td className="px-3 py-2 text-text-700">{r.config?.parser ? describeParser(r.config.parser) : '—'}</td>
                  <td className="px-3 py-2 text-text-600 whitespace-nowrap">
                    {fmt(r.updatedAt)}
                    {r.updatedBy && <div className="text-text-500">{r.updatedBy}</div>}
                  </td>
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={r.active} onChange={() => toggleActive(r)} aria-label={`Active: ${r.displayName}`} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    <button className="p-1.5 rounded-md hover:bg-background-700" onClick={() => setHistoryFor(r)} aria-label={`History of ${r.displayName}`}>
                      <History size={15} />
                    </button>
                    <button
                      className="p-1.5 rounded-md hover:bg-background-700"
                      onClick={() => setEditing({ record: r, config: recordToConfig(r) })}
                      aria-label={`Edit ${r.displayName}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button className="p-1.5 rounded-md hover:bg-background-700 hover:text-error" onClick={() => setDeleting(r)} aria-label={`Delete ${r.displayName}`}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <AdapterEditor
          key={editing.record?.id ?? 'new'}
          isOpen
          isNew={!editing.record}
          initial={editing.config}
          saving={createState.isLoading || updateState.isLoading}
          serverError={serverError}
          onClose={close}
          onSave={save}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) {
            return;
          }
          try {
            await deleteAdapter(deleting.id).unwrap();
            toast.success('Adapter deleted');
          } catch (e) {
            toast.error(apiErrorMessage(e));
          }
          setDeleting(null);
        }}
        title="Delete adapter?"
        message={`"${deleting?.displayName}" will no longer be offered to surveyors. Saved measurements keep their reference. Consider deactivating instead.`}
        confirmText="Delete"
      />

      {historyFor && (
        <AdapterHistory adapter={historyFor === 'all' ? null : historyFor} onClose={() => setHistoryFor(null)} />
      )}
    </div>
  );
};

const AdapterHistory = ({ adapter, onClose }: { adapter: LaserAdapterRecord | null; onClose: () => void }) => {
  const { data = [], isLoading } = useGetLaserAdapterAuditQuery(adapter ? adapter.id : undefined);
  return (
    <Modal isOpen onClose={onClose} title={adapter ? `History — ${adapter.displayName}` : 'Adapter change history'} size="lg">
      {isLoading ? (
        <Spinner />
      ) : data.length === 0 ? (
        <p className="text-[13px] text-text-600">No changes recorded.</p>
      ) : (
        <ul className="m-0 p-0 list-none flex flex-col gap-2">
          {data.map((a) => (
            <li key={a.id} className="rounded-lg border border-background-600 p-2.5 text-[13px]">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <span className="font-semibold text-text-900">{a.action}</span>
                <span className="font-mono text-text-600">{a.adapterKey}</span>
                <span className="text-text-600">{fmt(a.createdAt)}</span>
                <span className="text-text-600">{a.actorName ?? a.actorEmail ?? 'unknown'}</span>
              </div>
              <details className="mt-1.5">
                <summary className="cursor-pointer text-text-600">Show config</summary>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1.5">
                  <pre className="m-0 p-2 rounded bg-background-700 overflow-auto text-[11.5px] max-h-64">
                    {a.beforeConfig ? JSON.stringify(a.beforeConfig, null, 2) : '(none)'}
                  </pre>
                  <pre className="m-0 p-2 rounded bg-background-700 overflow-auto text-[11.5px] max-h-64">
                    {a.afterConfig ? JSON.stringify(a.afterConfig, null, 2) : '(deleted)'}
                  </pre>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};

export default AdapterAdmin;
