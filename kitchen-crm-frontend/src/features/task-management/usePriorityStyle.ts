/**
 * usePriorityStyle — the configured per-priority colours (Settings → Priority Colors) as inline
 * styles, with sensible defaults while they load. The production checklist uses the same palette,
 * so a task reads as the same priority everywhere it appears (to-dos, assigned tasks, the bell).
 */

import type { CSSProperties } from 'react';
import { useGetPriorityColorsQuery } from '@/services/settingsAPI';

const DEFAULTS: Record<string, string> = {
  LOW: '#9CA3AF',
  MEDIUM: '#3B82F6',
  HIGH: '#F97316',
  URGENT: '#EF4444',
};

export const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export function usePriorityStyle() {
  const { data } = useGetPriorityColorsQuery();
  const colors = (data?.data ?? DEFAULTS) as Record<string, string>;
  const hex = (level?: string): string => {
    const k = level ?? 'MEDIUM';
    return colors[k] || DEFAULTS[k] || DEFAULTS.MEDIUM;
  };
  return {
    hex,
    /** Small chip: tinted fill, coloured text, thin border (legible on a tinted row). */
    pill: (level?: string): CSSProperties => ({
      color: hex(level),
      background: `${hex(level)}26`,
      border: `1px solid ${hex(level)}66`,
    }),
    /** Whole-row tint plus a left accent stripe; lighter once the task is done. (2-hex suffix = alpha.) */
    row: (level?: string, done?: boolean): CSSProperties => ({
      borderLeft: `4px solid ${done ? `${hex(level)}80` : hex(level)}`,
      background: `${hex(level)}${done ? '0d' : '1a'}`,
    }),
  };
}

export default usePriorityStyle;
