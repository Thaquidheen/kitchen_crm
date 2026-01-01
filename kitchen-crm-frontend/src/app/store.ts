/**
 * Redux Store Configuration
 * Combines all reducers and middleware
 */

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from './baseApi';
import quotationsApi from '../features/quotations/quotationsAPI';
import projectsApi from '../features/projects/projectsAPI';
import { settingsApi } from '../services/settingsAPI';
import { vendorsApi } from '../features/vendors/vendorsAPI';
import { expensesApi } from '../features/expenses/expensesAPI';
import authReducer from '../features/auth/authSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import customersReducer from '../features/customers/customersSlice';
import productsReducer from '../features/products/productsSlice';
import quotationsReducer from '../features/quotations/quotationsSlice';
import projectsReducer from '../features/projects/projectsSlice';
import paymentsReducer from '../features/payments/paymentsSlice';
import designPhaseReducer from '../features/design-phase/designPhaseSlice';
import themeReducer from '../features/theme/themeSlice';

export const store = configureStore({
  reducer: {
    // Add the RTK Query API reducers
    [baseApi.reducerPath]: baseApi.reducer,
    [quotationsApi.reducerPath]: quotationsApi.reducer,
    [projectsApi.reducerPath]: projectsApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [vendorsApi.reducerPath]: vendorsApi.reducer,
    [expensesApi.reducerPath]: expensesApi.reducer,
    // Add other reducers
    auth: authReducer,
    dashboard: dashboardReducer,
    customers: customersReducer,
    products: productsReducer,
    quotations: quotationsReducer,
    projects: projectsReducer,
    payments: paymentsReducer,
    designPhase: designPhaseReducer,
    theme: themeReducer,
  },
  // Adding the api middleware enables caching, invalidation, polling, and other features of RTK Query
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware, quotationsApi.middleware, projectsApi.middleware, settingsApi.middleware, vendorsApi.middleware, expensesApi.middleware),
  devTools: import.meta.env.MODE !== 'production',
});

// Optional: Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
