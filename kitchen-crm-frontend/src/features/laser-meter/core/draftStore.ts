/**
 * Local draft of an unsaved measuring session. Sites often have no signal, and a surveyor may
 * lock the tablet or close the tab before saving — the draft lets them pick up where they were.
 */

import type { RoomLayout } from './guidedSequence';
import type { MeasurementValue } from './measurementSession';
import { safeLocalStorage, type StorageLike } from './adapters/registry';

export interface MeasurementDraft {
  layout: RoomLayout;
  values: MeasurementValue[];
  /** Epoch ms. */
  savedAt: number;
}

const keyFor = (scope: string) => `laserMeter.draft.v1:${scope}`;

export const saveDraft = (scope: string, draft: MeasurementDraft, storage: StorageLike | null = safeLocalStorage()) => {
  try {
    storage?.setItem(keyFor(scope), JSON.stringify(draft));
  } catch {
    // Quota / private mode: nothing we can do; the in-memory session is still intact.
  }
};

export const loadDraft = (scope: string, storage: StorageLike | null = safeLocalStorage()): MeasurementDraft | null => {
  try {
    const raw = storage?.getItem(keyFor(scope));
    const d = raw ? (JSON.parse(raw) as MeasurementDraft) : null;
    return d && Array.isArray(d.values) && d.layout ? d : null;
  } catch {
    return null;
  }
};

export const clearDraft = (scope: string, storage: StorageLike | null = safeLocalStorage()) => {
  try {
    storage?.removeItem(keyFor(scope));
  } catch {
    // ignore
  }
};

/** Is the draft newer than what the server has? */
export const draftIsNewer = (draft: MeasurementDraft | null, serverUpdatedAt: string | null | undefined): boolean => {
  if (!draft) {
    return false;
  }
  if (!serverUpdatedAt) {
    return draft.values.length > 0;
  }
  const t = Date.parse(serverUpdatedAt);
  return Number.isNaN(t) || draft.savedAt > t;
};
