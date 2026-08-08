/**
 * MyTodosTab — the logged-in user's private checklist on the Reminders page.
 * Grouped Overdue / Today / Upcoming / No date / Completed from one query;
 * dated items also feed the notification bell (server-side, per user).
 */

import React, { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  useGetMyTodosQuery,
  useCreateAdminTodoMutation,
  useUpdateAdminTodoMutation,
  useMarkTodoCompleteMutation,
  useMarkTodoIncompleteMutation,
  useDeleteAdminTodoMutation,
} from '@/features/task-management/taskAPI';
import type { AdminTodo } from '@/features/task-management/types';

const PRIORITY_META: Record<string, { st: string; label: string }> = {
  URGENT: { st: 'lost', label: 'Urgent' },
  HIGH: { st: 'nego', label: 'High' },
  MEDIUM: { st: 'lead', label: 'Medium' },
  LOW: { st: 'confirmed', label: 'Low' },
};

const localToday = () => {
  const now = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
};

// Format a YYYY-MM-DD string without new Date(iso) (avoids timezone shifting).
const fmtDay = (iso?: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(d)} ${months[Number(m) - 1]} ${y}`;
};

interface GroupDef {
  key: string;
  label: string;
  st?: string;
  items: AdminTodo[];
}

export const MyTodosTab: React.FC = () => {
  const { data: todos = [], isLoading } = useGetMyTodosQuery();

  // Composer
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');

  // Edit modal
  const [editing, setEditing] = useState<AdminTodo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPriority, setEditPriority] = useState('MEDIUM');
  const [editNotes, setEditNotes] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminTodo | null>(null);

  const [createTodo, { isLoading: isCreating }] = useCreateAdminTodoMutation();
  const [updateTodo, { isLoading: isUpdating }] = useUpdateAdminTodoMutation();
  const [markComplete] = useMarkTodoCompleteMutation();
  const [markIncomplete] = useMarkTodoIncompleteMutation();
  const [deleteTodo, { isLoading: isDeleting }] = useDeleteAdminTodoMutation();

  const groups: GroupDef[] = useMemo(() => {
    const today = localToday();
    const open = todos.filter((t) => !t.completed);
    const done = todos
      .filter((t) => t.completed)
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
    const byDate = (a: AdminTodo, b: AdminTodo) => (a.todoDate ?? '').localeCompare(b.todoDate ?? '');
    return [
      { key: 'overdue', label: 'Overdue', st: 'lost', items: open.filter((t) => t.todoDate && t.todoDate < today).sort(byDate) },
      { key: 'today', label: 'Today', st: 'potential', items: open.filter((t) => t.todoDate === today) },
      { key: 'upcoming', label: 'Upcoming', st: 'lead', items: open.filter((t) => t.todoDate && t.todoDate > today).sort(byDate) },
      { key: 'nodate', label: 'No date', st: 'draft', items: open.filter((t) => !t.todoDate) },
      { key: 'done', label: 'Completed', st: 'confirmed', items: done },
    ];
  }, [todos]);

  const openCount = todos.filter((t) => !t.completed).length;

  const handleAdd = async () => {
    if (!newTitle.trim()) {
      toast.error('Type the to-do first');
      return;
    }
    try {
      await createTodo({
        todoTitle: newTitle.trim(),
        todoDate: newDate || undefined,
        priority: newPriority as any,
      }).unwrap();
      toast.success('To-do added');
      setNewTitle('');
      setNewDate('');
      setNewPriority('MEDIUM');
    } catch (e: any) {
      toast.error(e?.message || e?.data?.message || 'Failed to add to-do');
    }
  };

  const openEdit = (t: AdminTodo) => {
    setEditing(t);
    setEditTitle(t.todoTitle);
    setEditDate(t.todoDate ?? '');
    setEditPriority(t.priority ?? 'MEDIUM');
    setEditNotes(t.notes ?? '');
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    if (!editTitle.trim()) {
      toast.error('The to-do text cannot be empty');
      return;
    }
    try {
      await updateTodo({
        todoId: editing.id,
        todo: {
          todoTitle: editTitle.trim(),
          todoDate: editDate || undefined,
          clearDate: !editDate && !!editing.todoDate ? true : undefined,
          priority: editPriority as any,
          notes: editNotes.trim() || undefined,
        },
      }).unwrap();
      toast.success('To-do updated');
      setEditing(null);
    } catch (e: any) {
      toast.error(e?.message || e?.data?.message || 'Failed to update to-do');
    }
  };

  const handleToggle = async (t: AdminTodo) => {
    try {
      if (t.completed) {
        await markIncomplete(t.id).unwrap();
      } else {
        await markComplete(t.id).unwrap();
      }
    } catch (e: any) {
      toast.error(e?.message || e?.data?.message || 'Failed to update to-do');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTodo(deleteTarget.id).unwrap();
      toast.success('To-do deleted');
    } catch (e: any) {
      toast.error(e?.message || e?.data?.message || 'Failed to delete to-do');
    }
    setDeleteTarget(null);
  };

  const priorityPill = (p?: string) => {
    const meta = PRIORITY_META[p ?? 'MEDIUM'] ?? PRIORITY_META.MEDIUM;
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-[2.5px] rounded-full text-[10.5px] font-semibold whitespace-nowrap"
        style={{ background: `var(--st-${meta.st}-bg)`, color: `var(--st-${meta.st}-fg)` }}
      >
        {meta.label}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Composer */}
      <div className="bg-background-800 border border-background-600 rounded-[14px] px-4 py-3.5">
        <div className="flex items-end gap-2.5 flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium text-text-700 mb-1.5">New to-do</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
              placeholder="e.g. Call the plywood supplier"
              className="w-full h-[36px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-700 mb-1.5">Date (optional)</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="h-[36px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-700 mb-1.5">Priority</label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
              className="h-[36px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={isCreating}
            className="btn-raised-accent inline-flex items-center gap-1.5 h-[36px] px-4 rounded-[10px] text-[13px] font-semibold"
          >
            <Plus size={14} />
            {isCreating ? 'Adding…' : 'Add'}
          </button>
        </div>
        <p className="m-0 mt-2 text-[11.5px] text-text-500">
          Only you can see this list. Dated to-dos appear in your notification bell from their day onward.
        </p>
      </div>

      {/* Groups */}
      {isLoading ? (
        <div className="bg-background-800 border border-background-600 rounded-[14px] px-4 py-10 text-center">
          <p className="m-0 text-[13px] text-text-600">Loading your to-dos…</p>
        </div>
      ) : todos.length === 0 ? (
        <div className="bg-background-800 border border-background-600 rounded-[14px] px-4 py-12 text-center">
          <CalendarDays className="w-8 h-8 mx-auto mb-2 text-text-500" />
          <p className="m-0 text-[13px] text-text-600">No to-dos yet — add your first task above.</p>
        </div>
      ) : (
        groups.map((g) => {
          if (g.items.length === 0) return null;
          const isDone = g.key === 'done';
          return (
            <div key={g.key} className="bg-background-800 border border-background-600 rounded-[14px] overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-background-600">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11px] font-semibold"
                  style={{ background: `var(--st-${g.st}-bg)`, color: `var(--st-${g.st}-fg)` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: `var(--st-${g.st}-fg)` }} />
                  {g.label}
                </span>
                <span className="text-[11px] font-[650] px-2 py-0.5 rounded-full bg-background-700 border border-background-600 text-text-700 tabular-nums">
                  {g.items.length}
                </span>
                {g.key === 'overdue' && (
                  <span className="text-[11.5px] text-text-500">— still open from earlier days</span>
                )}
              </div>
              <div className="divide-y divide-background-600">
                {g.items.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-background-700 transition-colors group">
                    <button
                      onClick={() => handleToggle(t)}
                      title={t.completed ? 'Mark as not done' : 'Mark as done'}
                      className="w-[19px] h-[19px] rounded-[6px] flex items-center justify-center shrink-0 transition-colors"
                      style={
                        t.completed
                          ? { background: 'var(--st-confirmed-fg)', color: '#fff' }
                          : { border: '1.5px solid var(--color-background-500)', background: 'var(--color-background-900)' }
                      }
                    >
                      {t.completed && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-[13px] truncate ${
                          t.completed ? 'line-through text-text-500' : 'font-medium text-text-900'
                        }`}
                        title={t.todoTitle}
                      >
                        {t.todoTitle}
                      </div>
                      {(t.todoDate || t.notes) && (
                        <div className="text-[11.5px] text-text-500 truncate">
                          {t.todoDate ? fmtDay(t.todoDate) : ''}
                          {t.todoDate && t.notes ? ' · ' : ''}
                          {t.notes ?? ''}
                        </div>
                      )}
                    </div>
                    {!isDone && priorityPill(t.priority)}
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(t)}
                        title="Edit"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-500 hover:bg-background-600 hover:text-text-900 transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        title="Delete"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-500 hover:bg-background-600 hover:text-text-900 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}

      {openCount > 0 && (
        <p className="m-0 text-[12px] text-text-500 text-center">
          {openCount} open to-do{openCount === 1 ? '' : 's'}
        </p>
      )}

      {/* Edit modal */}
      <Modal isOpen={editing != null} onClose={() => setEditing(null)} title="Edit To-do" size="sm">
        <ModalBody>
          <div className="space-y-4">
            <Input label="To-do *" type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <Input label="Date" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                <p className="mt-1 mb-0 text-[11px] text-text-500">Clear the date to make it an undated item.</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">Priority</label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="w-full h-[38px] px-3 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>
            <TextArea label="Notes" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setEditing(null)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveEdit} disabled={isUpdating}>
            {isUpdating ? 'Saving…' : 'Save Changes'}
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete To-do"
        message={deleteTarget ? `Delete "${deleteTarget.todoTitle}"?` : ''}
        confirmText={isDeleting ? 'Deleting…' : 'Delete'}
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default MyTodosTab;
