/**
 * DesignNotesThread — admin <-> designer notes on a design job. Opening it marks the other side's
 * notes as read (clears them from the bell); new notes arrive through the drawer's polling.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAddDesignNoteMutation, useMarkDesignSeenMutation } from '../designAPI';
import { versionLabel } from '../designUi';
import type { DesignJob } from '../types';
import { fmtReminderDateTime } from '@/utils/reminderFormat';

interface Props {
  job: DesignJob;
  viewer: 'admin' | 'designer';
}

export const DesignNotesThread: React.FC<Props> = ({ job, viewer }) => {
  const [text, setText] = useState('');
  const [addNote, { isLoading: sending }] = useAddDesignNoteMutation();
  const [markSeen] = useMarkDesignSeenMutation();
  const listRef = useRef<HTMLDivElement>(null);
  const notes = job.notes ?? [];
  const unread = viewer === 'admin' ? job.unreadForAdmin : job.unreadForDesigner;

  useEffect(() => {
    if (unread > 0) {
      markSeen(job.id);
    }
  }, [unread, job.id, markSeen]);

  useEffect(() => {
    const el = listRef.current;
    if (el) {el.scrollTop = el.scrollHeight;}
  }, [notes.length]);

  const send = async () => {
    const message = text.trim();
    if (!message) {return;}
    try {
      await addNote({ id: job.id, message }).unwrap();
      setText('');
    } catch (e: any) {
      toast.error(e?.message || e?.data?.message || 'Failed to add note');
    }
  };

  const mine = (fromDesigner: boolean) => (viewer === 'designer' ? fromDesigner : !fromDesigner);

  return (
    <div>
      {notes.length === 0 ? (
        <p className="m-0 py-2 text-[12px] text-text-500">
          {viewer === 'designer' ? 'Any question about this design? Write to the admin here.' : 'No notes yet.'}
        </p>
      ) : (
        <div ref={listRef} className="max-h-[240px] overflow-y-auto flex flex-col gap-2 py-1">
          {notes.map((n, i) => {
            const own = mine(n.fromDesigner);
            // A redesign continues the same conversation: mark where each later version starts.
            const startsVersion = i > 0 && (n.versionNo ?? 1) !== (notes[i - 1].versionNo ?? 1);
            return (
              <React.Fragment key={n.id}>
                {startsVersion && (
                  <div className="flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.08em] uppercase text-text-500">
                    <span className="h-px flex-1 bg-background-600" />
                    {versionLabel(n.versionNo)}
                    <span className="h-px flex-1 bg-background-600" />
                  </div>
                )}
              <div className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] rounded-[12px] px-3 py-2"
                  style={
                    own
                      ? { background: 'color-mix(in oklab, var(--color-primary-600) 14%, var(--color-background-800))' }
                      : { background: 'var(--color-background-800)', border: '1px solid var(--color-background-600)' }
                  }
                >
                  <div className="text-[11px] text-text-500 mb-0.5">
                    <span className="font-semibold text-text-700">
                      {own ? 'You' : n.authorName || (n.fromDesigner ? 'Designer' : 'Admin')}
                    </span>
                    {' · '}
                    {fmtReminderDateTime(n.createdAt)}
                  </div>
                  <div className="text-[13px] text-text-900 whitespace-pre-wrap break-words">{n.message}</div>
                </div>
              </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
      <div className="flex items-end gap-2 mt-2">
        <textarea
          value={text}
          rows={1}
          maxLength={2000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={viewer === 'designer' ? 'Write to the admin…' : `Write to ${job.designerName ?? 'the designer'}…`}
          aria-label="Note"
          className="flex-1 min-h-[36px] max-h-[120px] px-3 py-2 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500 resize-y"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !text.trim()}
          className="btn-raised-accent inline-flex items-center gap-1.5 h-[36px] px-3.5 rounded-[10px] text-[13px] font-semibold disabled:opacity-50"
        >
          <Send size={14} />
          {sending ? 'Sending…' : 'Send'}
        </button>
      </div>
      <p className="m-0 mt-1 text-[11px] text-text-500">Enter to send · Shift+Enter for a new line</p>
    </div>
  );
};

export default DesignNotesThread;
