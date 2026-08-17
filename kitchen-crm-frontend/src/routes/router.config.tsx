/**
 * Router Configuration
 * Defines all application routes using React Router's data router API
 */

import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { ROUTES } from './routes.config';
import { UserRole } from '../types/common.types';
import { AppLayout } from '../components/layout/AppLayout';
import { RouterLayout } from '../components/RouterLayout';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';

// Dashboard
import DashboardPage from '../pages/dashboard/DashboardPage';

// Customers
import CustomersPage from '../pages/customers/CustomersPage';
import CustomerDetailPage from '../pages/customers/CustomerDetailPage';

// Products
import ProductsPage from '../pages/products/ProductsPage';

// Quotations
import QuotationsPage from '../pages/quotations/QuotationsPage';
import ApplianceQuartzPage from '../pages/appliance/ApplianceQuartzPage';
import RemindersPage from '../pages/reminders/RemindersPage';
import QuotationDetailPage from '../pages/quotations/QuotationDetailPage';
import QuotationBuilderPage from '../pages/quotations/QuotationBuilderPage';



// Production
import ProductionPage from '../pages/production/ProductionPage';
import ProductionDetailPage from '../pages/production/ProductionDetailPage';

// Finance (Income & Expenses, super-admin only)
import FinancePage from '../pages/finance/FinancePage';
import FinanceCustomerPage from '../pages/finance/FinanceCustomerPage';

// Settings & Management
import SettingsPage from '../pages/settings/SettingsPage';
import VendorsPage from '../pages/vendors/VendorsPage';
import ArchitectsPage from '../pages/architects/ArchitectsPage';
import StaffPage from '../pages/staff/StaffPage';

// Public Pages
import ApprovalPage from '../pages/public/approval/ApprovalPage';

// Dev Showcases
import ComponentShowcase from '../pages/ComponentShowcase';
import AdvancedComponentShowcase from '../pages/AdvancedComponentShowcase';

const routes = [
  {
    element: (
      <RouterLayout>
        <Outlet />
      </RouterLayout>
    ),
    children: [
      // Root redirect
      {
        path: '/',
        element: <Navigate to={ROUTES.LOGIN} replace />,
      },

      // Public Routes
      {
        path: ROUTES.LOGIN,
        element: (
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        ),
      },
      // No public /signup route. Accounts are provisioned by a super admin from the Staff
      // page; the backend endpoint is SUPER_ADMIN-only, so a public form could not work anyway.
      {
        path: ROUTES.FORGOT_PASSWORD,
        element: (
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        ),
      },
      {
        path: ROUTES.RESET_PASSWORD,
        element: (
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        ),
      },

      // Approval page (no auth wrapper)
      {
        path: ROUTES.APPROVAL,
        element: <ApprovalPage />,
      },

      // Protected Routes with App Layout
      {
        element: (
          <ProtectedRoute>
            <AppLayout>
              <Outlet />
            </AppLayout>
          </ProtectedRoute>
        ),
        children: [
          // Dashboard
          {
            path: ROUTES.DASHBOARD,
            element: <DashboardPage />,
          },

          // Customers
          {
            path: ROUTES.CUSTOMERS,
            element: <CustomersPage />,
          },
          {
            path: ROUTES.CUSTOMERS_DETAIL,
            element: <CustomerDetailPage />,
          },

          // Products — the second entry carries the active tab in the URL
          {
            path: ROUTES.PRODUCTS,
            element: <ProductsPage />,
          },
          {
            path: `${ROUTES.PRODUCTS}/:tab`,
            element: <ProductsPage />,
          },

          // Quotations
          {
            path: ROUTES.QUOTATIONS,
            element: <QuotationsPage />,
          },
          {
            path: ROUTES.QUOTATIONS_NEW,
            element: <QuotationBuilderPage />,
          },
          {
            path: ROUTES.QUOTATIONS_EDIT,
            element: <QuotationBuilderPage />,
          },
          {
            path: ROUTES.QUOTATIONS_DETAIL,
            element: <QuotationDetailPage />,
          },

          // Appliance & Quartz
          {
            path: ROUTES.APPLIANCE_QUARTZ,
            element: <ApplianceQuartzPage />,
          },

          // Reminders
          {
            path: ROUTES.REMINDERS,
            element: <RemindersPage />,
          },

          // Production
          {
            path: ROUTES.PRODUCTION,
            element: <ProductionPage />,
          },
          {
            path: ROUTES.PRODUCTION_DETAIL,
            element: <ProductionDetailPage />,
          },

          // Vendors
          {
            path: ROUTES.VENDORS,
            element: <VendorsPage />,
          },

          // Architects
          {
            path: ROUTES.ARCHITECTS,
            element: <ArchitectsPage />,
          },

          // Component Showcases (dev only)
          {
            path: ROUTES.COMPONENTS,
            element: <ComponentShowcase />,
          },
          {
            path: ROUTES.COMPONENTS_ADVANCED,
            element: <AdvancedComponentShowcase />,
          },

          // Super-admin only. The sidebar already hides these, but they were still reachable
          // by typing the URL — the page rendered and only the API calls failed.
          {
            element: (
              <ProtectedRoute requireRole={UserRole.ROLE_SUPER_ADMIN}>
                <Outlet />
              </ProtectedRoute>
            ),
            children: [
              {
                path: ROUTES.SETTINGS,
                element: <SettingsPage />,
              },
              {
                path: ROUTES.STAFF,
                element: <StaffPage />,
              },
              {
                path: ROUTES.FINANCE,
                element: <FinancePage />,
              },
              {
                path: ROUTES.FINANCE_DETAIL,
                element: <FinanceCustomerPage />,
              },
            ],
          },
        ],
      },

      // 404 - Catch-all redirect
      {
        path: '*',
        element: <Navigate to={ROUTES.LOGIN} replace />,
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
