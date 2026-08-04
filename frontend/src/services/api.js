import { gasRequest, withToken } from './gasClient';
import { tokenStorage } from './tokenStorage';

export const authAPI = {
  login: (credentials) => gasRequest('POST', '/auth/login', { data: credentials }),
  logout: () => gasRequest('POST', '/auth/logout', withToken()),
  getCurrentUser: () => gasRequest('GET', '/auth/me', withToken()),
};

export const dashboardAPI = {
  getStats: (params) => gasRequest('GET', '/dashboard/stats', withToken({ params })),
  getCharts: (params) => gasRequest('GET', '/dashboard/charts', withToken({ params })),
  getRecentOrders: (params) => gasRequest('GET', '/dashboard/recent-orders', withToken({ params })),
};

export const ordersAPI = {
  getAll: (params) => gasRequest('GET', '/orders', withToken({ params })),
  getById: (id) => gasRequest('GET', `/orders/${id}`, withToken()),
  create: (data) => gasRequest('POST', '/orders', withToken({ data })),
  update: (id, data) => gasRequest('PUT', `/orders/${id}`, withToken({ data })),
  delete: (id) => gasRequest('DELETE', `/orders/${id}`, withToken()),
  duplicate: (id) => gasRequest('POST', `/orders/${id}/duplicate`, withToken()),
  updateStatus: (id, status) => gasRequest('PATCH', `/orders/${id}/status`, withToken({ data: { status } })),
};

export const customersAPI = {
  getAll: (params) => gasRequest('GET', '/customers', withToken({ params })),
  getById: (id) => gasRequest('GET', `/customers/${id}`, withToken()),
  create: (data) => gasRequest('POST', '/customers', withToken({ data })),
  update: (id, data) => gasRequest('PUT', `/customers/${id}`, withToken({ data })),
  delete: (id) => gasRequest('DELETE', `/customers/${id}`, withToken()),
  getLedger: (id) => gasRequest('GET', `/customers/${id}/ledger`, withToken()),
};

export const productsAPI = {
  getAll: (params) => gasRequest('GET', '/products', withToken({ params })),
  getById: (id) => gasRequest('GET', `/products/${id}`, withToken()),
  create: (data) => gasRequest('POST', '/products', withToken({ data })),
  update: (id, data) => gasRequest('PUT', `/products/${id}`, withToken({ data })),
  delete: (id) => gasRequest('DELETE', `/products/${id}`, withToken()),
};

export const designersAPI = {
  getAll: (params) => gasRequest('GET', '/designers', withToken({ params })),
  getById: (id) => gasRequest('GET', `/designers/${id}`, withToken()),
  create: (data) => gasRequest('POST', '/designers', withToken({ data })),
  update: (id, data) => gasRequest('PUT', `/designers/${id}`, withToken({ data })),
  delete: (id) => gasRequest('DELETE', `/designers/${id}`, withToken()),
  getWorkload: (id) => gasRequest('GET', `/designers/${id}/workload`, withToken()),
};

export const filesAPI = {
  upload: (formData) => gasRequest('POST', '/files/upload', withToken({ data: Object.fromEntries(formData.entries()) })),
  delete: (fileId) => gasRequest('DELETE', `/files/${fileId}`, withToken()),
  getDownloadUrl: (fileId) => gasRequest('GET', `/files/${fileId}/download-url`, withToken()),
};

export const invoicesAPI = {
  getAll: (params) => gasRequest('GET', '/invoices', withToken({ params })),
  getById: (id) => gasRequest('GET', `/invoices/${id}`, withToken()),
  getByToken: (token) => gasRequest('GET', `/public/invoice/${token}`),
  create: (data) => gasRequest('POST', '/invoices', withToken({ data })),
  update: (id, data) => gasRequest('PUT', `/invoices/${id}`, withToken({ data })),
  delete: (id) => gasRequest('DELETE', `/invoices/${id}`, withToken()),
};

export const expensesAPI = {
  getAll: (params) => gasRequest('GET', '/expenses', withToken({ params })),
  create: (data) => gasRequest('POST', '/expenses', withToken({ data })),
  update: (id, data) => gasRequest('PUT', `/expenses/${id}`, withToken({ data })),
  delete: (id) => gasRequest('DELETE', `/expenses/${id}`, withToken()),
};

export const settingsAPI = {
  get: () => gasRequest('GET', '/settings', withToken()),
  update: (data) => gasRequest('PUT', '/settings', withToken({ data })),
};

export const vendorsAPI = {
  getAll: (params) => gasRequest('GET', '/vendors', withToken({ params })),
  getById: (id) => gasRequest('GET', `/vendors/${id}`, withToken()),
  create: (data) => gasRequest('POST', '/vendors', withToken({ data })),
  update: (id, data) => gasRequest('PUT', `/vendors/${id}`, withToken({ data })),
  delete: (id) => gasRequest('DELETE', `/vendors/${id}`, withToken()),
};

export const purchasesAPI = {
  getAll: (params) => gasRequest('GET', '/purchases', withToken({ params })),
  getById: (id) => gasRequest('GET', `/purchases/${id}`, withToken()),
  create: (data) => gasRequest('POST', '/purchases', withToken({ data })),
  update: (id, data) => gasRequest('PUT', `/purchases/${id}`, withToken({ data })),
  delete: (id) => gasRequest('DELETE', `/purchases/${id}`, withToken()),
};

export const reportsAPI = {
  getAll: (params) => gasRequest('GET', '/reports', withToken({ params })),
};

export const paymentsAPI = {
  getAll: (params) => gasRequest('GET', '/payments', withToken({ params })),
  create: (data) => gasRequest('POST', '/payments', withToken({ data })),
  update: (id, data) => gasRequest('PUT', `/payments/${id}`, withToken({ data })),
  delete: (id) => gasRequest('DELETE', `/payments/${id}`, withToken()),
};

export const countersAPI = {
  getAll: () => gasRequest('GET', '/counters', withToken()),
  create: (data) => gasRequest('POST', '/counters', withToken({ data })),
};

export const tokensAPI = {
  getAll: (params) => gasRequest('GET', '/tokens', withToken({ params })),
  create: (data) => gasRequest('POST', '/tokens', withToken({ data })),
  getById: (id) => gasRequest('GET', `/tokens/${id}`, withToken()),
  call: (id) => gasRequest('POST', `/tokens/${id}/call`, withToken()),
  complete: (id) => gasRequest('POST', `/tokens/${id}/complete`, withToken()),
  skip: (id) => gasRequest('POST', `/tokens/${id}/skip`, withToken()),
  linkOrder: (id, data) => gasRequest('POST', `/tokens/${id}/link-order`, withToken({ data })),
};

export default {
  authAPI,
  dashboardAPI,
  ordersAPI,
  customersAPI,
  productsAPI,
  designersAPI,
  filesAPI,
  invoicesAPI,
  expensesAPI,
  settingsAPI,
  vendorsAPI,
  purchasesAPI,
  reportsAPI,
  paymentsAPI,
  countersAPI,
  tokensAPI,
};
