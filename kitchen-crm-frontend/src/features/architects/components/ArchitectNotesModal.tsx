/**
 * ArchitectNotesModal
 * A running, append-only notes history for an architect/builder — the same idea as the customer
 * notes feed: each new note is its own row, and every previous note stays listed below the
 * composer, newest first.
 */

import { useState } from 'react';
import { MessageSquare, Send, User, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import {
  useGetArchitectNotesQuery,
  useAddArchitectNoteMutation,
} from '../architectsAPI';
import type { Architect } from '../types';

interface ArchitectNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  architect: Architect | null;
}

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return { relative: '', full: '' };
  const date = new Date(timestamp);
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  let relative: string;
  if (diffMins < 1) relative = 'Just now';
  else if (diffMins < 60) relative = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  else if (diffHours < 24) relative = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  else if (diffDays < 7) relative = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  else relative = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const full = date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return { relative, full };
};

export default function ArchitectNotesModal({ isOpen, onClose, architect }: ArchitectNotesModalProps) {
  const architectId = architect?.id ?? 0;
  const { data: notes, isLoading, error } = useGetArchitectNotesQuery(architectId, {
    skip: !isOpen || !architect,
  });
  const [addNote, { isLoading: isSaving }] = useAddArchitectNoteMutation();
  const [draft, setDraft] = useState('');

  const submitNote = async () => {
    const note = draft.trim();
    if (!note || isSaving || !architect) return;
    try {
      await addNote({ id: architect.id, note }).unwrap();
      setDraft('');
      toast.success('Note added');
    } catch (e: any) {
      toast.error(e?.data?.message || 'Could not add the note');
    }
  };

  if (!architect) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Notes — ${architect.architectureName}`} size="lg">
      <div className="space-y-4">
        {/* Composer */}
        <div className="flex items-start gap-2">
          <textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter makes a new line — the usual comment-box behaviour.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void submitNote();
              }
            }}
            placeholder="Add a note…"
            disabled={isSaving}
            className="flex-1 px-3 py-2.5 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500 resize-none"
          />
          <button
            type="button"
            onClick={submitNote}
            disabled={!draft.trim() || isSaving}
            title="Add note"
            className="btn-raised-accent shrink-0 inline-flex items-center gap-1.5 px-3 h-[38px] rounded-[10px] text-[13px] font-semibold disabled:opacity-50"
          >
            <Send size={13} />
            {isSaving ? 'Adding…' : 'Add'}
          </button>
        </div>

        {/* History */}
        <div className="max-h-[55vh] overflow-y-auto -mx-1 px-1">
          {isLoading ? (
            <div className="py-10 text-center text-[13px] text-text-700">Loading notes…</div>
          ) : error ? (
            <div className="py-10 text-center text-[13px] text-text-700">Failed to load notes</div>
          ) : !notes || notes.length === 0 ? (
            <div className="py-10 text-center">
              <MessageSquare className="mx-auto mb-2 text-text-500" size={22} />
              <div className="text-[13.5px] font-semibold text-text-900">No notes yet</div>
              <div className="text-[12.5px] text-text-700 mt-1">
                Add the first one above — every note you add is kept here.
              </div>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {notes.map((n) => {
                const ts = formatTimestamp(n.createdAt);
                return (
                  <li
                    key={n.id}
                    className="rounded-[11px] border border-background-600 bg-background-900 px-3.5 py-3"
                  >
                    <div className="text-[13.5px] text-text-900 whitespace-pre-wrap break-words">
                      {n.note}
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-[11.5px] text-text-500">
                      {n.createdBy && (
                        <span className="inline-flex items-center gap-1">
                          <User size={12} />
                          {n.createdBy}
                        </span>
                      )}
                      {ts.relative && (
                        <span className="inline-flex items-center gap-1" title={ts.full}>
                          <Clock size={12} />
                          {ts.relative}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
