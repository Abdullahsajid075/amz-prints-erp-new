import axios from 'axios';
import {
  mockAuthAPI, mockDashboardAPI, mockOrdersAPI, mockCustomersAPI,
  mockDesignersAPI, mockProductsAPI, mockInvoicesAPI, mockExpensesAPI, mockSettingsAPI,
  mockVendorsAPI, mockPurchasesAPI, mockReportsAPI, mockPaymentsAPI
} from './mockAuth';
import { tokenStorage } from './tokenStorage';

const GAS_API_BASE_URL = process.env.REACT_APP_GAS_API_URL || '';
const USE_MOCK = !GAS_API_BASE_URL || GAS_API_BASE_URL === '';

if (USE_MOCK) {
  console.log('%c🔶 MOCK MODE ENABLED', 'background: #F26522; color: white; padding: 8px; font-weight: bold; font-size: 14px;');
  console.log('%cUsing demo credentials: admin / admin123', 'color: #F26522; font-size: 12px;');
  console.log('%cTo use real backend, set REACT_APP_GAS_API_URL in .env file', 'color: #666; font-size: 11px;');
}

const api = axios.create({
  baseURL: GAS_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const createAPIWrapper = (realAPI, mockAPI) => {
  return new Proxy(realAPI, {
    get: (target, prop) => {
      return async (...args) => {
        if (USE_MOCK) {
          return mockAPI[prop](...args);
        }
        try {
          return await target[prop](...args);
        } catch (error) {
          if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
            console.warn('Backend unreachable, falling back to mock mode');
            if (mockAPI[prop]) {
              return mockAPI[prop](...args);
            }
          }
          throw error;
        }
      };
    }
  });
};

const realAuthAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me')
};

const realDashboardAPI = {
  getStats: (params) => api.get('/dashboard/stats', { params }),
  getCharts: (params) => api.get('/dashboard/charts', { params }),
  getRecentOrders: (params) => api.get('/dashboard/recent-orders', { params })
};

const realOrdersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  delete: (id) => api.delete(`/orders/${id}`),
  duplicate: (id) => api.post(`/orders/${id}/duplicate`),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status })
};

const realCustomersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getLedger: (id) => api.get(`/customers/${id}/ledger`)
};
const realProductsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`)
};

const realDesignersAPI = {
  getAll: (params) => api.get('/designers', { params }),
  getById: (id) => api.get(`/designers/${id}`),
  create: (data) => api.post('/designers', data),
  update: (id, data) => api.put(`/designers/${id}`, data),
  delete: (id) => api.delete(`/designers/${id}`),
  getWorkload: (id) => api.get(`/designers/${id}/workload`)
};

const realFilesAPI = {
  upload: (formData) => api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (fileId) => api.delete(`/files/${fileId}`),
  getDownloadUrl: (fileId) => api.get(`/files/${fileId}/download-url`)
};

const realInvoicesAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  getByToken: (token) => api.get(`/public/invoice/${token}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`)
};

const realExpensesAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`)
};

const realSettingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data)
};

const realVendorsAPI = {
  getAll: (params) => api.get('/vendors', { params }),
  getById: (id) => api.get(`/vendors/${id}`),
  create: (data) => api.post('/vendors', data),
  update: (id, data) => api.put(`/vendors/${id}`, data),
  delete: (id) => api.delete(`/vendors/${id}`)
};

const realPurchasesAPI = {
  getAll: (params) => api.get('/purchases', { params }),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  delete: (id) => api.delete(`/purchases/${id}`)
};

const realReportsAPI = {
  getAll: (params) => api.get('/reports', { params })
};

const realPaymentsAPI = {
  getAll: (params) => api.get('/payments', { params }),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`)
};

export const authAPI = createAPIWrapper(realAuthAPI, mockAuthAPI);
export const dashboardAPI = createAPIWrapper(realDashboardAPI, mockDashboardAPI);
export const ordersAPI = createAPIWrapper(realOrdersAPI, mockOrdersAPI);
export const customersAPI = createAPIWrapper(realCustomersAPI, mockCustomersAPI);
export const designersAPI = createAPIWrapper(realDesignersAPI, mockDesignersAPI);
export const productsAPI = createAPIWrapper(realProductsAPI, mockProductsAPI);
export const invoicesAPI = createAPIWrapper(realInvoicesAPI, mockInvoicesAPI);
export const expensesAPI = createAPIWrapper(realExpensesAPI, mockExpensesAPI);
export const settingsAPI = createAPIWrapper(realSettingsAPI, mockSettingsAPI);
export const vendorsAPI = createAPIWrapper(realVendorsAPI, mockVendorsAPI);
export const purchasesAPI = createAPIWrapper(realPurchasesAPI, mockPurchasesAPI);
export const reportsAPI = createAPIWrapper(realReportsAPI, mockReportsAPI);
export const paymentsAPI = createAPIWrapper(realPaymentsAPI, mockPaymentsAPI);

export const filesAPI = realFilesAPI;

export default api;