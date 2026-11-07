/**
 * Redux Store Configuration
 * Combines all reducers and middleware
 */

import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from './baseApi';
import { settingsApi } from '../services/settingsAPI';
import { vendorsApi } from '../features/vendors/vendorsAPI';
import authReducer, { logout } from '../features/auth/authSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import customersReducer from '../features/customers/customersSlice';
import productsReducer from '../features/products/productsSlice';
import quotationsReducer from '../features/quotations/quotationsSlice';
import themeReducer from '../features/theme/themeSlice';
import financeAccessReducer from '../features/finance/financeAccessSlice';

// Signing out must not leave the previous user's responses in the RTK Query caches. Without a page
// reload the next person to sign in on the same tab would otherwise be served them until they
// expire — an administrator's quotations with their margins, shown to staff. Listening for the
// action (rather than resetting at each call site) covers every place that signs out: the header
// menu, the change-password dialog and baseApi's failed-refresh paths. The effect runs inside the
// logout dispatch, so the caches are already empty when React re-renders; a request still in flight
// is dropped when it answers, because its cache entry no longer exists. Each createApi() keeps its
// own cache, so every API in the reducer map below has to be reset here.
const resetApisOnLogout = createListenerMiddleware();
resetApisOnLogout.startListening({
  actionCreator: logout,
  effect: (_action, { dispatch }) => {
    dispatch(baseApi.util.resetApiState());
    dispatch(settingsApi.util.resetApiState());
    dispatch(vendorsApi.util.resetApiState());
  },
});

export const store = configureStore({
  reducer: {
    // Add the RTK Query API reducers
    [baseApi.reducerPath]: baseApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [vendorsApi.reducerPath]: vendorsApi.reducer,
    // Add other reducers
    auth: authReducer,
    dashboard: dashboardReducer,
    customers: customersReducer,
    products: productsReducer,
    quotations: quotationsReducer,
    theme: themeReducer,
    financeAccess: financeAccessReducer,
  },
  // Adding the api middleware enables caching, invalidation, polling, and other features of RTK Query
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .prepend(resetApisOnLogout.middleware)
      .concat(
        baseApi.middleware,
        settingsApi.middleware,
        vendorsApi.middleware
      ),
  devTools: import.meta.env.MODE !== 'production',
});

// Optional: Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
