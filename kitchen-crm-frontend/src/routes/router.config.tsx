/**
 * Router Configuration
 * Defines all application routes using React Router's data router API
 */

import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import { ROUTES } from './routes.config';
import { AppLayout } from '../components/layout/AppLayout';
import { RouterLayout } from '../components/RouterLayout';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
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
import QuotationDetailPage from '../pages/quotations/QuotationDetailPage';
import QuotationBuilderPage from '../pages/quotations/QuotationBuilderPage';

// Projects
import ProjectsPage from '../pages/projects/ProjectsPage';
import ProjectDetailPage from '../pages/projects/ProjectDetailPage';
import ProjectFormPage from '../pages/projects/ProjectFormPage';
import ConvertQuotationPage from '../pages/projects/ConvertQuotationPage';

// Payments
import PaymentsPage from '../pages/payments/PaymentsPage';

// Design Phase
import DesignPhasePage from '../pages/design-phase/DesignPhasePage';
import DesignPhaseDetailPage from '../pages/design-phase/DesignPhaseDetailPage';

// Production
import ProductionPage from '../pages/production/ProductionPage';
import ProductionDetailPage from '../pages/production/ProductionDetailPage';

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
      {
        path: ROUTES.SIGNUP,
        element: (
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        ),
      },
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

          // Products
          {
            path: ROUTES.PRODUCTS,
            element: <ProductsPage />,
          },

          // Quotations
          {
            path: ROUTES.QUOTATIONS,
            element: <QuotationsPage />,
          },
          {
            path: ROUTES.QUOTATIONS_DETAIL,
            element: <QuotationDetailPage />,
          },
          {
            path: ROUTES.QUOTATIONS_NEW,
            element: <QuotationBuilderPage />,
          },
          {
            path: ROUTES.QUOTATIONS_EDIT,
            element: <QuotationBuilderPage />,
          },

          // Projects
          {
            path: ROUTES.PROJECTS,
            element: <ProjectsPage />,
          },
          {
            path: ROUTES.PROJECTS_NEW,
            element: <ProjectFormPage />,
          },
          {
            path: ROUTES.PROJECTS_CONVERT,
            element: <ConvertQuotationPage />,
          },
          {
            path: ROUTES.PROJECTS_DETAIL,
            element: <ProjectDetailPage />,
          },
          {
            path: ROUTES.PROJECTS_EDIT,
            element: <ProjectFormPage />,
          },

          // Payments
          {
            path: ROUTES.PAYMENTS,
            element: <PaymentsPage />,
          },

          // Design Phase
          {
            path: ROUTES.DESIGN_PHASE,
            element: <DesignPhasePage />,
          },
          {
            path: ROUTES.DESIGN_PHASE_DETAIL,
            element: <DesignPhaseDetailPage />,
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

          // Settings
          {
            path: ROUTES.SETTINGS,
            element: <SettingsPage />,
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

          // Staff
          {
            path: ROUTES.STAFF,
            element: <StaffPage />,
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
