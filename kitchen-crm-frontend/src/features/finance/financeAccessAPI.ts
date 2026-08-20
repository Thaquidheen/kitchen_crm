/**
 * Unlock endpoint for the concealed reporting module.
 *
 * Kept in its own slice, and named neutrally, because the path is visible in the browser's network
 * tab — it should not announce what it opens. The response never distinguishes a wrong phrase from
 * an unset one or a throttled caller; the caller must not either.
 */

import { baseApi } from '../../app/baseApi';

interface UnlockResponse {
  success?: boolean;
  message?: string;
  data?: { key: string; expiresInSeconds: number };
}

export const financeAccessAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    unlockReporting: builder.mutation<UnlockResponse, { passphrase: string }>({
      query: (body) => ({ url: '/reporting-access/unlock', method: 'POST', body }),
    }),
    setReportingPassphrase: builder.mutation<
      { success?: boolean; message?: string },
      { current?: string; next: string }
    >({
      query: (body) => ({ url: '/reporting-access/passphrase', method: 'POST', body }),
    }),
  }),
});

export const { useUnlockReportingMutation, useSetReportingPassphraseMutation } = financeAccessAPI;
