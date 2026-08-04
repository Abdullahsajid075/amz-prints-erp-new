import React from 'react';
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

function App() {
  return (
    <BrandProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/invoice/:shareToken" element={<InvoiceView isPublic={true} />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
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

              <Route path="warehouse" element={<Warehouse />} />
              <Route path="warehouse/products" element={<Products />} />
              <Route path="warehouse/purchases" element={<Purchases />} />
              <Route path="warehouse/inventory" element={<Inventory />} />

              {/* Keep legacy paths working */}
              <Route path="products" element={<Navigate to="/warehouse/products" replace />} />
              <Route path="purchases" element={<Navigate to="/warehouse/purchases" replace />} />
              <Route path="inventory" element={<Navigate to="/warehouse/inventory" replace />} />
              <Route path="production" element={<Navigate to="/warehouse" replace />} />
              <Route path="designers" element={<Designers />} />
              <Route path="employees" element={<Navigate to="/dashboard" replace />} />

              <Route path="pos" element={<POS />} />

              <Route path="accounts" element={<Accounts />} />
              <Route path="accounts/payments" element={<Payments />} />
              <Route path="accounts/expenses" element={<Expenses />} />
              <Route path="accounts/vendors" element={<Vendors />} />

              {/* Keep legacy account paths */}
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

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster position="top-right" richColors closeButton />
        </BrowserRouter>
      </AuthProvider>
    </BrandProvider>
  );
}

export default App;
