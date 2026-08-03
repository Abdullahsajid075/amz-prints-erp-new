import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/components/modules/auth/Login';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/components/modules/dashboard/Dashboard';
import OrdersList from '@/components/modules/orders/OrdersList';
import OrderForm from '@/components/modules/orders/OrderForm';
import Customers from '@/components/modules/customers/Customers';
import Products from '@/components/modules/products/Products';
import Designers from '@/components/modules/designers/Designers';
import Production from '@/components/modules/production/Production';
import Inventory from '@/components/modules/inventory/Inventory';
import Invoices from '@/components/modules/invoices/Invoices';
import InvoiceView from '@/components/modules/invoices/InvoiceView';
import InvoiceForm from '@/components/modules/invoices/InvoiceForm';
import Payments from '@/components/modules/payments/Payments';
import Expenses from '@/components/modules/expenses/Expenses';
import Employees from '@/components/modules/employees/Employees';
import Reports from '@/components/modules/reports/Reports';
import Settings from '@/components/modules/settings/Settings';
import Vendors from '@/components/modules/vendors/Vendors';
import Purchases from '@/components/modules/purchases/Purchases';

function App() {
  return (
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

            <Route path="orders" element={<OrdersList />} />
            <Route path="orders/new" element={<OrderForm />} />
            <Route path="orders/:orderId" element={<OrdersList />} />
            <Route path="orders/:orderId/edit" element={<OrderForm />} />

            <Route path="customers" element={<Customers />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="products" element={<Products />} />
            <Route path="designers" element={<Designers />} />
            <Route path="production" element={<Production />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/new" element={<InvoiceForm />} />
            <Route path="invoices/:invoiceId" element={<InvoiceView />} />
            <Route path="invoices/:invoiceId/edit" element={<InvoiceForm />} />
            <Route path="payments" element={<Payments />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="employees" element={<Employees />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
