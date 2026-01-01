/**
 * Main App Component
 * Handles routing configuration with protected and public routes
 */

import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PublicRoute } from './routes/PublicRoute';
import { ROUTES } from './routes/routes.config';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ComponentShowcase from './pages/ComponentShowcase';
import AdvancedComponentShowcase from './pages/AdvancedComponentShowcase';
import { AppLayout } from './components/layout/AppLayout';
import CustomersPage from './pages/customers/CustomersPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import ProductsPage from './pages/products/ProductsPage';
import QuotationsPage from './pages/quotations/QuotationsPage';
import QuotationDetailPage from './pages/quotations/QuotationDetailPage';
import QuotationBuilderPage from './pages/quotations/QuotationBuilderPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import ProjectFormPage from './pages/projects/ProjectFormPage';
import ConvertQuotationPage from './pages/projects/ConvertQuotationPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import DesignPhasePage from './pages/design-phase/DesignPhasePage';
import DesignPhaseDetailPage from './pages/design-phase/DesignPhaseDetailPage';
import ProductionPage from './pages/production/ProductionPage';
import ProductionDetailPage from './pages/production/ProductionDetailPage';
import ApprovalPage from './pages/public/approval/ApprovalPage';
import SettingsPage from './pages/settings/SettingsPage';
import VendorsPage from './pages/vendors/VendorsPage';
import ArchitectsPage from './pages/architects/ArchitectsPage';
import StaffPage from './pages/staff/StaffPage';
import { ThemeProvider } from './features/theme/ThemeProvider';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-background-800)',
            color: 'var(--color-text-900)',
            border: '1px solid var(--color-primary-700)',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-success)',
              secondary: 'var(--color-text-900)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-error)',
              secondary: 'var(--color-text-900)',
            },
          },
        }}
      />

      {/* Routes */}
      <Routes>
        {/* Root redirect - check authentication first */}
        <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />

        {/* Public Routes */}
        <Route
          path={ROUTES.LOGIN}
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path={ROUTES.SIGNUP}
          element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          }
        />
        <Route path={ROUTES.APPROVAL} element={<ApprovalPage />} />

        {/* Protected Routes with App Layout (Sidebar/Header) */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout>
                <Outlet />
              </AppLayout>
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />

          {/* Customers */}
          <Route path={ROUTES.CUSTOMERS} element={<CustomersPage />} />
          <Route path={ROUTES.CUSTOMERS_DETAIL} element={<CustomerDetailPage />} />

          {/* Products */}
          <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />

          {/* Quotations */}
          <Route path={ROUTES.QUOTATIONS} element={<QuotationsPage />} />
          <Route path={ROUTES.QUOTATIONS_DETAIL} element={<QuotationDetailPage />} />
          <Route path={ROUTES.QUOTATIONS_NEW} element={<QuotationBuilderPage />} />
          <Route path={ROUTES.QUOTATIONS_EDIT} element={<QuotationBuilderPage />} />

          {/* Projects */}
          <Route path={ROUTES.PROJECTS} element={<ProjectsPage />} />
          <Route path={ROUTES.PROJECTS_NEW} element={<ProjectFormPage />} />
          <Route path={ROUTES.PROJECTS_CONVERT} element={<ConvertQuotationPage />} />
          <Route path={ROUTES.PROJECTS_DETAIL} element={<ProjectDetailPage />} />
          <Route path={ROUTES.PROJECTS_EDIT} element={<ProjectFormPage />} />

          {/* Payments */}
          <Route path={ROUTES.PAYMENTS} element={<PaymentsPage />} />

          {/* Design Phase */}
          <Route path={ROUTES.DESIGN_PHASE} element={<DesignPhasePage />} />
          <Route path={ROUTES.DESIGN_PHASE_DETAIL} element={<DesignPhaseDetailPage />} />

          {/* Production */}
          <Route path={ROUTES.PRODUCTION} element={<ProductionPage />} />
          <Route path={ROUTES.PRODUCTION_DETAIL} element={<ProductionDetailPage />} />

          {/* Settings (Super Admin only) */}
          <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />

          {/* Vendors */}
          <Route path={ROUTES.VENDORS} element={<VendorsPage />} />

          {/* Architects */}
          <Route path={ROUTES.ARCHITECTS} element={<ArchitectsPage />} />

          {/* Staff */}
          <Route path={ROUTES.STAFF} element={<StaffPage />} />

          {/* Component showcases (dev only) */}
          <Route path={ROUTES.COMPONENTS} element={<ComponentShowcase />} />
          <Route path={ROUTES.COMPONENTS_ADVANCED} element={<AdvancedComponentShowcase />} />
        </Route>

        {/* 404 - Redirect to login */}
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
