import { afterEach, describe, expect, it, vi } from 'vitest';

// The auth slice reads localStorage when it is first imported, and the tests run in node, which has
// no Web Storage. vi.hoisted runs before the imports below.
vi.hoisted(() => {
  class MemoryStorage {
    private items = new Map<string, string>();
    getItem(key: string) {
      return this.items.get(key) ?? null;
    }
    setItem(key: string, value: string) {
      this.items.set(key, String(value));
    }
    removeItem(key: string) {
      this.items.delete(key);
    }
    clear() {
      this.items.clear();
    }
  }
  Object.assign(globalThis, {
    localStorage: new MemoryStorage(),
    sessionStorage: new MemoryStorage(),
  });
});

import { store } from './store';
import { baseApi } from './baseApi';
import { settingsApi } from '../services/settingsAPI';
import { vendorsApi } from '../features/vendors/vendorsAPI';
import {
  logout,
  setCredentials,
  tokenRefreshed,
} from '../features/auth/authSlice';
import { unlocked } from '../features/finance/financeAccessSlice';
import { UserRole, type User } from '../types';

const admin: User = {
  id: 1,
  username: 'admin',
  email: 'admin@example.test',
  role: UserRole.ROLE_SUPER_ADMIN,
};
const staff: User = {
  id: 2,
  username: 'staff',
  email: 'staff@example.test',
  role: UserRole.ROLE_STAFF,
};

// What only the administrator may see: a quotation with its margin.
const ADMIN_ONLY = {
  success: true,
  data: { content: [{ id: 7, marginPercentage: 32 }], totalElements: 1 },
};
const QUOTATIONS_ARG = { page: 0, size: 10 };

const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const fetchMock = vi.fn<(input: Request) => Promise<Response>>();
vi.stubGlobal('fetch', fetchMock);

const signIn = (user: User) =>
  store.dispatch(setCredentials({ user, token: `token-of-${user.username}` }));

const quotationsFor = (arg = QUOTATIONS_ARG) =>
  baseApi.endpoints.getQuotations.select(arg)(store.getState());

/** Every RTK Query slice in the store, found by shape so a new createApi() cannot be missed. */
const apiSlices = () =>
  Object.entries(store.getState()).filter(
    ([, slice]) =>
      typeof slice === 'object' &&
      slice !== null &&
      'queries' in slice &&
      'config' in slice
  ) as [string, { queries: object; mutations: object }][];

/** Loads one response into each API's cache, as the administrator's screens would. */
const loadEveryCache = async () => {
  fetchMock.mockImplementation(async () => json(ADMIN_ONLY));
  const subs = [
    store.dispatch(baseApi.endpoints.getQuotations.initiate(QUOTATIONS_ARG)),
    store.dispatch(settingsApi.endpoints.getMargins.initiate()),
    store.dispatch(vendorsApi.endpoints.getActiveVendors.initiate()),
  ];
  await Promise.all(subs);
  return subs;
};

afterEach(() => {
  store.dispatch(logout());
  fetchMock.mockReset();
});

describe('signing out', () => {
  it('resets every API slice the store holds', () => {
    // If this fails, an API was added to the store: reset it in resetApisOnLogout (store.ts) too.
    expect(
      apiSlices()
        .map(([name]) => name)
        .sort()
    ).toEqual(['api', 'settingsApi', 'vendorsApi']);
  });

  it('empties every RTK Query cache, so the next user signing in sees none of it', async () => {
    signIn(admin);
    const subs = await loadEveryCache();
    expect(quotationsFor().data).toEqual(ADMIN_ONLY.data);
    expect(
      settingsApi.endpoints.getMargins.select()(store.getState()).data
    ).toEqual(ADMIN_ONLY);
    for (const [, slice] of apiSlices()) {
      expect(Object.keys(slice.queries)).not.toHaveLength(0);
    }

    store.dispatch(logout());
    signIn(staff);

    for (const [name, slice] of apiSlices()) {
      expect(slice.queries, name).toEqual({});
      expect(slice.mutations, name).toEqual({});
    }
    expect(quotationsFor().data).toBeUndefined();
    expect(
      settingsApi.endpoints.getMargins.select()(store.getState()).data
    ).toBeUndefined();
    expect(
      vendorsApi.endpoints.getActiveVendors.select()(store.getState()).data
    ).toBeUndefined();
    subs.forEach((s) => s.unsubscribe());
  });

  it('drops an answer that was still on its way when the user signed out', async () => {
    // An argument no other test loads, so the request goes out even if an earlier test left a cache.
    const arg = { page: 1, size: 10 };
    signIn(admin);
    let answer!: (r: Response) => void;
    fetchMock.mockImplementationOnce(
      () => new Promise<Response>((resolve) => (answer = resolve))
    );
    const sub = store.dispatch(baseApi.endpoints.getQuotations.initiate(arg));
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    store.dispatch(logout());
    signIn(staff);
    answer(json(ADMIN_ONLY));
    await sub;

    expect(quotationsFor(arg).data).toBeUndefined();
    expect(store.getState().api.queries).toEqual({});
    sub.unsubscribe();
  });

  it('still clears the session and the reporting key', () => {
    signIn(admin);
    store.dispatch(unlocked({ key: 'reporting-key', expiresInSeconds: 600 }));

    store.dispatch(logout());

    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.token).toBeNull();
    expect(store.getState().financeAccess.key).toBeNull();
  });
});

describe('refreshing the token', () => {
  it('keeps the caches, since the same user is still signed in', async () => {
    signIn(admin);
    const subs = await loadEveryCache();

    store.dispatch(
      tokenRefreshed({ token: 'token-of-admin-2', expiresIn: 900 })
    );

    expect(quotationsFor().data).toEqual(ADMIN_ONLY.data);
    subs.forEach((s) => s.unsubscribe());
  });
});
