/**
 * Redux Store Configuration
 * Combines all reducers and middleware
 */

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from './baseApi';
import { settingsApi } from '../services/settingsAPI';
import { vendorsApi } from '../features/vendors/vendorsAPI';
import authReducer from '../features/auth/authSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import customersReducer from '../features/customers/customersSlice';
import productsReducer from '../features/products/productsSlice';
import quotationsReducer from '../features/quotations/quotationsSlice';
import themeReducer from '../features/theme/themeSlice';
import financeAccessReducer from '../features/finance/financeAccessSlice';

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
    getDefaultMiddleware().concat(baseApi.middleware, settingsApi.middleware, vendorsApi.middleware),
  devTools: import.meta.env.MODE !== 'production',
});

// Optional: Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
