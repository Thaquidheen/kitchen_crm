/**
 * Unlock state for the concealed reporting module (Income & Expenses).
 *
 * Held IN MEMORY ONLY — deliberately not sessionStorage or localStorage, which every other piece
 * of state in this app uses. Persisting it would leave the module reachable after a refresh and
 * leave a key sitting in devtools' storage inspector, both of which defeat the point. A refresh
 * re-locks, which is the stricter reading of "when we leave the module it hides again".
 *
 * The key is only half the lock: the server independently verifies it on every finance request and
 * answers 404 without it. Clearing this state cannot be used to *gain* access, only to drop it.
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface FinanceAccessState {
  /** Scoped token from the unlock endpoint; null means locked. */
  key: string | null;
  /** Epoch ms after which the server will reject the key anyway. */
  expiresAt: number | null;
}

const initialState: FinanceAccessState = { key: null, expiresAt: null };

const financeAccessSlice = createSlice({
  name: 'financeAccess',
  initialState,
  reducers: {
    unlocked: (state, action: PayloadAction<{ key: string; expiresInSeconds: number }>) => {
      state.key = action.payload.key;
      state.expiresAt = Date.now() + action.payload.expiresInSeconds * 1000;
    },
    lock: (state) => {
      state.key = null;
      state.expiresAt = null;
    },
  },
  extraReducers: (builder) => {
    // Signing out must drop the key too. The re-lock-on-leave watcher lives in AppLayout, which
    // unmounts on the way to /login, so without this the key would outlive the session in the
    // store. Matched by action type rather than by importing authSlice, to keep the dependency
    // one-directional.
    builder.addMatcher(
      (action: { type: string }) => action.type === 'auth/logout',
      (state) => {
        state.key = null;
        state.expiresAt = null;
      }
    );
  },
});

export const { unlocked, lock } = financeAccessSlice.actions;
export default financeAccessSlice.reducer;

/** Treats an expired key as locked, so the UI hides before the server starts refusing. */
export const selectFinanceKey = (state: { financeAccess: FinanceAccessState }): string | null => {
  const { key, expiresAt } = state.financeAccess;
  if (!key || !expiresAt || Date.now() >= expiresAt) return null;
  return key;
};
