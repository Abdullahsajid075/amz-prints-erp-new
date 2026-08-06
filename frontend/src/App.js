import React, { useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { BrandProvider } from '@/context/BrandContext';
import { Toaster } from '@/components/ui/sonner';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/components/modules/auth/Login';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/components/modules/dashboard/Dashboard';
import OrdersList from '@/components/modules/orders/OrdersList';
import OrderForm from '@/components/modules/orders/OrderForm';
import DeliverySlip from '@/components/modules/orders/DeliverySlip';
import Customers from '@/components/modules/customers/Customers';
import CustomerCRM from '@/components/modules/crm/CustomerCRM';
import Products from '@/components/modules/products/Products';
import Designers from '@/components/modules/designers/Designers';
import Inventory from '@/components/modules/inventory/Inventory';
import Invoices from '@/components/modules/invoices/Invoices';
import InvoiceView from '@/components/modules/invoices/InvoiceView';
import InvoiceForm from '@/components/modules/invoices/InvoiceForm';
import Payments from '@/components/modules/payments/Payments';
import Expenses from '@/components/modules/expenses/Expenses';
import Reports from '@/components/modules/reports/Reports';
import Settings from '@/components/modules/settings/Settings';
import Vendors from '@/components/modules/vendors/Vendors';
import Purchases from '@/components/modules/purchases/Purchases';
import TokenBooking from '@/components/modules/tokens/TokenBooking';
import CounterScreen from '@/components/modules/tokens/CounterScreen';
import Quotations from '@/components/modules/quotations/Quotations';
import QuotationForm from '@/components/modules/quotations/QuotationForm';
import Warehouse from '@/components/modules/warehouse/Warehouse';
import Accounts from '@/components/modules/accounts/Accounts';
import POS from '@/components/modules/pos/POS';
import PrintingCostCalculator from '@/components/modules/calculator/PrintingCostCalculator';
import PublicOrderTracking from '@/components/modules/tracking/PublicOrderTracking';

/**
 * App shell (Brand + Auth) only mounts for protected routes.
 * Login is OUTSIDE — stops provider/API/401 remount loops on the login screen.
 */
function AuthenticatedApp() {
  return (
    <BrandProvider>
      <AuthProvider>
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </BrandProvider>
  );
}

function App() {
  useEffect(() => {
    document.title = 'AMAZON ERP';
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public — no Auth / no Vercel login */}
        <Route path="/login" element={<Login />} />
        <Route
          path="/invoice/:shareToken"
          element={(
            <BrandProvider>
              <InvoiceView isPublic={true} />
            </BrandProvider>
          )}
        />
        <Route
          path="/track"
          element={(
            <BrandProvider>
              <PublicOrderTracking />
              <Toaster position="top-right" richColors closeButton />
            </BrandProvider>
          )}
        />
        <Route
          path="/track/:code"
          element={(
            <BrandProvider>
              <PublicOrderTracking />
              <Toaster position="top-right" richColors closeButton />
            </BrandProvider>
          )}
        />

        {/* Protected app */}
        <Route path="/" element={<AuthenticatedApp />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="quotations" element={<Quotations />} />
          <Route path="quotations/new" element={<QuotationForm />} />
          <Route path="quotations/:quotationId/edit" element={<QuotationForm />} />
          <Route path="quotations/:quotationId/print" element={<QuotationForm printMode />} />

          <Route path="tokens" element={<TokenBooking />} />
          <Route path="tokens/counter" element={<CounterScreen />} />

          <Route path="orders" element={<OrdersList />} />
          <Route path="orders/new" element={<OrderForm />} />
          <Route path="orders/:orderId" element={<OrdersList />} />
          <Route path="orders/:orderId/edit" element={<OrderForm />} />
          <Route path="orders/:orderId/delivery-slip" element={<DeliverySlip />} />

          <Route path="customers" element={<Customers />} />
          <Route path="crm" element={<CustomerCRM />} />

          <Route path="warehouse" element={<Warehouse />} />
          <Route path="warehouse/products" element={<Products />} />
          <Route path="warehouse/purchases" element={<Purchases />} />
          <Route path="warehouse/inventory" element={<Inventory />} />

          <Route path="products" element={<Navigate to="/warehouse/products" replace />} />
          <Route path="purchases" element={<Navigate to="/warehouse/purchases" replace />} />
          <Route path="inventory" element={<Navigate to="/warehouse/inventory" replace />} />
          <Route path="production" element={<Navigate to="/warehouse" replace />} />
          <Route path="designers" element={<Designers />} />
          <Route path="employees" element={<Navigate to="/dashboard" replace />} />

          <Route path="pos" element={<POS />} />

          <Route path="calculator" element={<PrintingCostCalculator />} />

          <Route path="accounts" element={<Accounts />} />
          <Route path="accounts/payments" element={<Payments />} />
          <Route path="accounts/expenses" element={<Expenses />} />
          <Route path="accounts/vendors" element={<Vendors />} />

          <Route path="payments" element={<Navigate to="/accounts/payments" replace />} />
          <Route path="expenses" element={<Navigate to="/accounts/expenses" replace />} />
          <Route path="vendors" element={<Navigate to="/accounts/vendors" replace />} />

          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/new" element={<InvoiceForm />} />
          <Route path="invoices/:invoiceId" element={<InvoiceView />} />
          <Route path="invoices/:invoiceId/edit" element={<InvoiceForm />} />

          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Unknown URLs → login (NOT dashboard — that caused bounce loops) */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
