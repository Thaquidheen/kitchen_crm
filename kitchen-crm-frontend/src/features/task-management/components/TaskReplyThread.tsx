/**
 * TaskReplyThread — the conversation under an assigned task. The assignee asks about anything
 * unclear; the admin who assigned it answers. Opening the thread marks the other side's replies as
 * read (clears them from the bell). New replies arrive through the owning list's polling.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useMarkTaskRepliesSeenMutation, useReplyToTaskMutation } from '../taskAPI';
import type { EmployeeTask } from '../types';
import { fmtReminderDateTime } from '@/utils/reminderFormat';

export type ReplyViewer = 'assignee' | 'assigner';

interface Props {
  task: EmployeeTask;
  viewer: ReplyViewer;
  autoFocus?: boolean;
}

const MAX_LEN = 2000;

/** Replies the given side has not read yet. */
export const unreadRepliesFor = (task: EmployeeTask, viewer: ReplyViewer): number =>
  (viewer === 'assigner' ? task.unreadForAssigner : task.unreadForAssignee) ?? 0;

/** The newest reply written by the other side (what a notification should quote). */
export const latestReplyFromOtherSide = (task: EmployeeTask, viewer: ReplyViewer) => {
  const fromAssignee = viewer === 'assigner';
  const replies = task.replies ?? [];
  for (let i = replies.length - 1; i >= 0; i--) {
    if (replies[i].fromAssignee === fromAssignee) {return replies[i];}
  }
  return null;
};

export const TaskReplyThread: React.FC<Props> = ({ task, viewer, autoFocus }) => {
  const [text, setText] = useState('');
  const [sendReply, { isLoading: isSending }] = useReplyToTaskMutation();
  const [markSeen] = useMarkTaskRepliesSeenMutation();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const replies = task.replies ?? [];
  const unread = unreadRepliesFor(task, viewer);

  // Reading the thread clears the other side's unread replies. Re-runs when a poll brings a new one.
  useEffect(() => {
    if (unread > 0) {
      markSeen(task.id);
    }
  }, [unread, task.id, markSeen]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) {el.scrollTop = el.scrollHeight;}
  }, [replies.length]);

  useEffect(() => {
    if (autoFocus) {inputRef.current?.focus();}
  }, [autoFocus]);

  const send = async () => {
    const message = text.trim();
    if (!message) {return;}
    try {
      await sendReply({ taskId: task.id, message }).unwrap();
      setText('');
      inputRef.current?.focus();
    } catch (e: any) {
      toast.error(e?.message || e?.data?.message || 'Failed to send reply');
    }
  };

  const mine = (fromAssignee: boolean) => (viewer === 'assignee' ? fromAssignee : !fromAssignee);
  const otherName = viewer === 'assignee' ? task.assignedByName : task.assignedToUserName;

  return (
    <div
      className="px-4 pb-3 pt-2 border-t border-background-600"
      style={{ background: 'color-mix(in oklab, var(--color-background-700) 35%, transparent)' }}
    >
      {replies.length === 0 ? (
        <p className="m-0 py-2 text-[12px] text-text-500">
          {viewer === 'assignee'
            ? `Any doubt about this task? Ask ${otherName ?? 'your admin'} here.`
            : `No replies from ${otherName ?? 'them'} yet.`}
        </p>
      ) : (
        <div ref={listRef} className="max-h-[260px] overflow-y-auto flex flex-col gap-2 py-2">
          {replies.map((r) => {
            const own = mine(r.fromAssignee);
            return (
              <div key={r.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[85%] rounded-[12px] px-3 py-2"
                  style={
                    own
                      ? { background: 'color-mix(in oklab, var(--color-primary-600) 14%, var(--color-background-800))' }
                      : { background: 'var(--color-background-800)', border: '1px solid var(--color-background-600)' }
                  }
                >
                  <div className="text-[11px] text-text-500 mb-0.5">
                    <span className="font-semibold text-text-700">{own ? 'You' : r.authorName || otherName || '—'}</span>
                    {' · '}
                    {fmtReminderDateTime(r.createdAt)}
                  </div>
                  <div className="text-[13px] text-text-900 whitespace-pre-wrap break-words">{r.message}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-end gap-2 mt-1.5">
        <textarea
          ref={inputRef}
          value={text}
          maxLength={MAX_LEN}
          rows={1}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={viewer === 'assignee' ? 'Type your question or reply…' : `Reply to ${otherName ?? 'them'}…`}
          aria-label="Reply"
          className="flex-1 min-h-[36px] max-h-[120px] px-3 py-2 rounded-[10px] border border-background-600 bg-background-900 text-text-900 text-[13px] outline-none focus:border-primary-600 transition-colors placeholder:text-text-500 resize-y"
        />
        <button
          type="button"
          onClick={send}
          disabled={isSending || !text.trim()}
          className="btn-raised-accent inline-flex items-center gap-1.5 h-[36px] px-3.5 rounded-[10px] text-[13px] font-semibold disabled:opacity-50"
        >
          <Send size={14} />
          {isSending ? 'Sending…' : 'Send'}
        </button>
      </div>
      <p className="m-0 mt-1 text-[11px] text-text-500">Enter to send · Shift+Enter for a new line</p>
    </div>
  );
};

export default TaskReplyThread;
