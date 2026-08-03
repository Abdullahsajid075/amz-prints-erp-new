// Demo credentials sourced from environment variables so no secret is committed.
// Set REACT_APP_DEMO_PASSWORD and REACT_APP_DEMO_TOKEN in frontend/.env
const DEMO_PASSWORD = process.env.REACT_APP_DEMO_PASSWORD || '';
const MOCK_TOKEN = process.env.REACT_APP_DEMO_TOKEN || '';

const MOCK_USERS = [
  {
    id: 'mock_user_1',
    name: 'Admin User',
    email: 'admin',
    username: 'admin',
    password: DEMO_PASSWORD,
    role: 'Super Admin'
  }
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAuthAPI = {
  login: async (credentials) => {
    await delay(500);
    
    const user = MOCK_USERS.find(
      u => (u.email === credentials.email || u.username === credentials.email) &&
           u.password === credentials.password
    );
    
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return {
        data: {
          token: MOCK_TOKEN,
          user: userWithoutPassword
        }
      };
    }
    
    throw {
      response: {
        data: {
          message: 'Invalid credentials'
        }
      }
    };
  },
  
  logout: async () => {
    await delay(200);
    return { data: { success: true } };
  },
  
  getCurrentUser: async () => {
    await delay(300);
    const user = MOCK_USERS[0];
    const { password, ...userWithoutPassword } = user;
    return { data: userWithoutPassword };
  }
};

export const mockDashboardAPI = {
  getStats: async () => {
    await delay(500);
    return {
      data: {
        totalOrders: 156,
        pendingOrders: 23,
        completedOrders: 128,
        revenue: 485000,
        expenses: 142000,
        receivables: 89000,
        payables: 34000,
        activeCustomers: 47
      }
    };
  },
  
  getCharts: async () => {
    await delay(500);
    return {
      data: {
        monthlySales: [
          { month: 'Jan', sales: 45000 },
          { month: 'Feb', sales: 52000 },
          { month: 'Mar', sales: 48000 },
          { month: 'Apr', sales: 61000 },
          { month: 'May', sales: 55000 },
          { month: 'Jun', sales: 68000 }
        ],
        orderStatus: [
          { name: 'Received', value: 15 },
          { name: 'Designing', value: 12 },
          { name: 'Printing', value: 18 },
          { name: 'Ready', value: 8 },
          { name: 'Delivered', value: 128 }
        ]
      }
    };
  },
  
  getRecentOrders: async () => {
    await delay(400);
    return {
      data: [
        {
          id: 'order_1',
          orderId: 'ORD-001',
          customerName: 'ABC Corporation',
          date: '2024-01-15',
          amount: 15000,
          status: 'Printing'
        },
        {
          id: 'order_2',
          orderId: 'ORD-002',
          customerName: 'XYZ Enterprises',
          date: '2024-01-14',
          amount: 8500,
          status: 'Designing'
        },
        {
          id: 'order_3',
          orderId: 'ORD-003',
          customerName: 'Tech Solutions Ltd',
          date: '2024-01-13',
          amount: 22000,
          status: 'Delivered'
        }
      ]
    };
  }
};

let mockOrders = [
  {
    id: 'order_1',
    orderId: 'ORD-001',
    customerName: 'ABC Corporation',
    customerEmail: 'contact@abc.com',
    customerPhone: '+91-9876543210',
    customerAddress: '123 Business St, Karachi, Pakistan',
    assignedDesigner: 'designer_1',
    date: '2024-01-15',
    deliveryDate: '2024-01-20',
    remarks: 'Rush order',
    status: 'Printing',
    totalAmount: 15000,
    advancePayment: 5000,
    balanceAmount: 10000,
    products: [
      { name: 'Business Cards', quantity: 500, rate: 30, size: '3.5x2 inches', material: 'Premium Card Stock', notes: 'Glossy finish' }
    ]
  },
  {
    id: 'order_2',
    orderId: 'ORD-002',
    customerName: 'XYZ Enterprises',
    customerEmail: 'info@xyz.com',
    customerPhone: '+91-9876543211',
    customerAddress: '456 Trade Ave, Lahore',
    date: '2024-01-14',
    deliveryDate: '2024-01-19',
    status: 'Designing',
    totalAmount: 8500,
    advancePayment: 3000,
    balanceAmount: 5500,
    products: []
  }
];

export const mockOrdersAPI = {
  getAll: async () => {
    await delay(300);
    return { data: mockOrders };
  },

  getById: async (id) => {
    await delay(200);
    const found = mockOrders.find(o => o.id === id);
    return { data: found || mockOrders[0] };
  },

  create: async (data) => {
    await delay(400);
    const o = { id: 'order_' + Date.now(), orderId: 'ORD-' + String(Date.now()).slice(-6), ...data };
    mockOrders = [o, ...mockOrders];
    return { data: o };
  },

  update: async (id, data) => {
    await delay(300);
    mockOrders = mockOrders.map(o => o.id === id ? { ...o, ...data, id } : o);
    return { data: { id, ...data } };
  },

  delete: async (id) => {
    await delay(200);
    mockOrders = mockOrders.filter(o => o.id !== id);
    return { data: { success: true } };
  },

  duplicate: async (id) => {
    await delay(300);
    const src = mockOrders.find(o => o.id === id);
    const dup = { ...(src || {}), id: 'order_' + Date.now(), orderId: 'ORD-' + String(Date.now()).slice(-6) };
    mockOrders = [dup, ...mockOrders];
    return { data: dup };
  }
};

let mockCustomers = [
  { id: 'cust_1', name: 'ABC Corporation', phone: '+919876543210', email: 'contact@abc.com', address: '123 Business St, Karachi, Pakistan', city: 'Karachi', notes: 'Regular corporate client', createdAt: '2024-01-01' },
  { id: 'cust_2', name: 'XYZ Enterprises', phone: '+919876543211', email: 'info@xyz.com', address: '456 Trade Ave, Lahore', city: 'Lahore', notes: '', createdAt: '2024-01-05' }
];

export const mockCustomersAPI = {
  getAll: async () => { await delay(300); return { data: mockCustomers }; },
  getById: async (id) => { await delay(200); return { data: mockCustomers.find(c => c.id === id) }; },
  create: async (data) => {
    await delay(400);
    const c = { id: 'cust_' + Date.now(), createdAt: new Date().toISOString(), ...data };
    mockCustomers = [c, ...mockCustomers];
    return { data: c };
  },
  update: async (id, data) => {
    await delay(300);
    mockCustomers = mockCustomers.map(c => c.id === id ? { ...c, ...data, id } : c);
    return { data: { id, ...data } };
  },
  delete: async (id) => {
    await delay(200);
    mockCustomers = mockCustomers.filter(c => c.id !== id);
    return { data: { success: true } };
  },
  getLedger: async (id) => {
    await delay(300);
    const cust = mockCustomers.find(c => c.id === id);
    const orders = mockOrders.filter(o => o.customerId === id || o.customerName === cust?.name);
    const invoices = mockInvoices.filter(i => i.customerId === id || i.customerName === cust?.name);
    const payments = mockPayments.filter(p => p.party === cust?.name);
    const totalBilled = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
    const totalPaid = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
    const outstanding = totalBilled - totalPaid;
    return { data: { customer: cust, orders, invoices, payments, totalBilled, totalPaid, outstanding } };
  }
};

export const mockDesignersAPI = {
  getAll: async () => {
    await delay(400);
    return {
      data: [
        { id: 'designer_1', name: 'John Designer' },
        { id: 'designer_2', name: 'Sarah Creative' }
      ]
    };
  }
};

let mockProducts = [
  {
    id: 'prod_1',
    name: 'Premium Business Cards',
    category: 'Business Cards',
    description: 'High-quality business cards with premium finish',
    basePrice: 30,
    unit: 'per piece',
    material: 'Premium Card Stock',
    size: '3.5 x 2 inches',
    minQuantity: 100,
    stock: 5000,
    active: true
  },
  {
    id: 'prod_2',
    name: 'A4 Full Color Flyers',
    category: 'Flyers & Brochures',
    description: 'Full color flyers for marketing campaigns',
    basePrice: 15,
    unit: 'per piece',
    material: 'Glossy Paper',
    size: 'A4 (210 x 297 mm)',
    minQuantity: 500,
    stock: 10000,
    active: true
  },
  {
    id: 'prod_3',
    name: 'Vinyl Banner',
    category: 'Banners',
    description: 'Weather-resistant vinyl banners for outdoor use',
    basePrice: 250,
    unit: 'per sq ft',
    material: 'Vinyl',
    size: 'Custom',
    minQuantity: 1,
    stock: 500,
    active: true
  },
  {
    id: 'prod_4',
    name: 'Custom Stickers',
    category: 'Stickers & Labels',
    description: 'Die-cut custom stickers in any shape',
    basePrice: 8,
    unit: 'per piece',
    material: 'Vinyl',
    size: 'Custom',
    minQuantity: 50,
    stock: 20000,
    active: true
  }
];

export const mockProductsAPI = {
  getAll: async () => {
    await delay(400);
    return { data: mockProducts };
  },
  getById: async (id) => {
    await delay(300);
    const product = mockProducts.find(p => p.id === id);
    return { data: product };
  },
  create: async (data) => {
    await delay(500);
    const newProduct = { id: 'prod_' + Date.now(), ...data };
    mockProducts = [newProduct, ...mockProducts];
    return { data: newProduct };
  },
  update: async (id, data) => {
    await delay(500);
    mockProducts = mockProducts.map(p => p.id === id ? { ...p, ...data, id } : p);
    return { data: { id, ...data } };
  },
  delete: async (id) => {
    await delay(300);
    mockProducts = mockProducts.filter(p => p.id !== id);
    return { data: { success: true } };
  }
};

let mockInvoices = [
  {
    id: 'inv_1',
    invoiceNumber: 'INV-2024-001',
    orderId: 'ORD-001',
    shareToken: 'a7f3b8c2-9d4e-4a1b-8f6c-2e5d7b9a1c3f',
    customerName: 'ABC Corporation',
    customerEmail: 'contact@abc.com',
    customerPhone: '+919876543210',
    customerAddress: '123 Business St, Karachi, Pakistan',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    items: [
      { name: 'Premium Business Cards', quantity: 500, rate: 30, size: '3.5 x 2 inches', material: 'Premium Card Stock' }
    ],
    subtotal: 15000,
    tax: 0,
    taxRate: 0,
    discount: 0,
    previousBalance: 5000,
    totalAmount: 15000,
    paidAmount: 5000,
    status: 'Partial',
    notes: 'Thank you for your order!'
  },
  {
    id: 'inv_2',
    invoiceNumber: 'INV-2024-002',
    orderId: 'ORD-002',
    shareToken: 'b8e4c9d3-af5f-4b2c-9g7d-3f6e8ca2d4a5',
    customerName: 'XYZ Enterprises',
    customerEmail: 'info@xyz.com',
    customerPhone: '+919876543211',
    customerAddress: '456 Trade Ave, Lahore',
    date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
    items: [
      { name: 'A4 Full Color Flyers', quantity: 1000, rate: 15, size: 'A4', material: 'Glossy Paper' }
    ],
    subtotal: 15000,
    tax: 0,
    taxRate: 0,
    discount: 0,
    previousBalance: 0,
    totalAmount: 15000,
    paidAmount: 15000,
    status: 'Paid',
    notes: ''
  }
];

export const mockInvoicesAPI = {
  getAll: async () => {
    await delay(400);
    return { data: mockInvoices };
  },
  getById: async (id) => {
    await delay(300);
    return { data: mockInvoices.find(i => i.id === id) };
  },
  getByToken: async (token) => {
    await delay(300);
    return { data: mockInvoices.find(i => i.shareToken === token) };
  },
  create: async (data) => {
    await delay(500);
    // Auto-upsert customer on invoice creation (by phone or name)
    if (data.customerName && !data.customerId) {
      const existing = mockCustomers.find(c =>
        (data.customerPhone && c.phone === data.customerPhone) ||
        c.name === data.customerName
      );
      if (existing) {
        data.customerId = existing.id;
        // Optionally sync latest contact info
        mockCustomers = mockCustomers.map(c => c.id === existing.id
          ? { ...c, email: data.customerEmail || c.email, address: data.customerAddress || c.address }
          : c);
      } else {
        const newC = {
          id: 'cust_' + Date.now(),
          name: data.customerName,
          phone: data.customerPhone || '',
          email: data.customerEmail || '',
          address: data.customerAddress || '',
          createdAt: new Date().toISOString()
        };
        mockCustomers = [newC, ...mockCustomers];
        data.customerId = newC.id;
      }
    }
    const newInv = { id: 'inv_' + Date.now(), shareToken: crypto.randomUUID(), ...data };
    mockInvoices = [newInv, ...mockInvoices];
    return { data: newInv };
  },
  update: async (id, data) => {
    await delay(500);
    mockInvoices = mockInvoices.map(i => i.id === id ? { ...i, ...data, id } : i);
    return { data: { id, ...data } };
  },
  delete: async (id) => {
    await delay(300);
    mockInvoices = mockInvoices.filter(i => i.id !== id);
    return { data: { success: true } };
  }
};

let mockExpenses = [
  {
    id: 'exp_1',
    date: new Date().toISOString().split('T')[0],
    category: 'Office',
    description: 'Office rent - Current month',
    amount: 25000,
    paymentMethod: 'Bank Transfer',
    paidTo: 'Property Manager',
    notes: 'Monthly office rent payment'
  },
  {
    id: 'exp_2',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    category: 'Utilities',
    description: 'Electricity bill',
    amount: 3500,
    paymentMethod: 'UPI',
    paidTo: 'K-Electric',
    notes: ''
  },
  {
    id: 'exp_3',
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    category: 'Salaries',
    description: 'Staff salaries - January',
    amount: 45000,
    paymentMethod: 'Bank Transfer',
    paidTo: 'Payroll Account',
    notes: ''
  },
  {
    id: 'exp_4',
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    category: 'Supplies',
    description: 'Ink cartridges & paper stock',
    amount: 12500,
    paymentMethod: 'Cash',
    paidTo: 'PrintSupply Co.',
    notes: ''
  }
];

export const mockExpensesAPI = {
  getAll: async (params = {}) => {
    await delay(400);
    let list = [...mockExpenses];
    if (params.from) list = list.filter(e => e.date >= params.from);
    if (params.to) list = list.filter(e => e.date <= params.to);
    if (params.category) list = list.filter(e => e.category === params.category);
    return { data: list };
  },
  create: async (data) => {
    await delay(500);
    const newExp = { id: 'exp_' + Date.now(), ...data };
    mockExpenses = [newExp, ...mockExpenses];
    return { data: newExp };
  },
  update: async (id, data) => {
    await delay(500);
    mockExpenses = mockExpenses.map(e => e.id === id ? { ...e, ...data, id } : e);
    return { data: { id, ...data } };
  },
  delete: async (id) => {
    await delay(300);
    mockExpenses = mockExpenses.filter(e => e.id !== id);
    return { data: { success: true } };
  }
};

let mockSettings = {
  company: {
    name: 'AMZ Prints',
    tagline: 'Professional Printing & Advertising Services',
    address: '123 Business St, Karachi, Pakistan',
    phone: '+92 300 1234567',
    email: 'contact@amzprints.com',
    website: 'amzprints.com',
    taxId: 'GST-000000',
    authorizedSignatory: 'Amir Malik'
  },
  invoiceTerms: 'Payment due within 30 days from invoice date.\nAll disputes are subject to local jurisdiction.\nGoods once sold will not be taken back.\nInterest @ 18% p.a. applicable on overdue payments.',
  invoicePrefix: 'INV-',
  taxRate: 0,
  currency: 'PKR'
};

export const mockSettingsAPI = {
  get: async () => {
    await delay(200);
    return { data: mockSettings };
  },
  update: async (data) => {
    await delay(400);
    mockSettings = { ...mockSettings, ...data };
    return { data: mockSettings };
  }
};

let mockVendors = [];
export const mockVendorsAPI = {
  getAll: async () => { await delay(300); return { data: mockVendors }; },
  getById: async (id) => { await delay(200); return { data: mockVendors.find(v => v.id === id) }; },
  create: async (data) => {
    await delay(400);
    const v = { id: 'vendor_' + Date.now(), totalPurchases: 0, outstandingBalance: 0, ...data };
    mockVendors = [v, ...mockVendors];
    return { data: v };
  },
  update: async (id, data) => {
    await delay(400);
    mockVendors = mockVendors.map(v => v.id === id ? { ...v, ...data, id } : v);
    return { data: { id, ...data } };
  },
  delete: async (id) => {
    await delay(200);
    mockVendors = mockVendors.filter(v => v.id !== id);
    return { data: { success: true } };
  }
};

let mockPurchases = [];
let mockInventory = {};
export const mockPurchasesAPI = {
  getAll: async () => { await delay(300); return { data: mockPurchases }; },
  getById: async (id) => { await delay(200); return { data: mockPurchases.find(p => p.id === id) }; },
  create: async (data) => {
    await delay(400);
    const seq = String(mockPurchases.length + 1).padStart(4, '0');
    const p = { id: 'po_' + Date.now(), poNumber: `PO-${new Date().getFullYear()}-${seq}`, ...data };
    mockPurchases = [p, ...mockPurchases];
    return { data: p };
  },
  update: async (id, data) => {
    await delay(400);
    const before = mockPurchases.find(p => p.id === id);
    mockPurchases = mockPurchases.map(p => p.id === id ? { ...p, ...data, id } : p);
    // Auto-inventory update when a PO is received
    if (data.status === 'Received' && before?.status !== 'Received') {
      (data.items || before?.items || []).forEach(item => {
        mockInventory[item.name] = (mockInventory[item.name] || 0) + (item.quantity || 0);
      });
    }
    return { data: { id, ...data } };
  },
  delete: async (id) => {
    await delay(200);
    mockPurchases = mockPurchases.filter(p => p.id !== id);
    return { data: { success: true } };
  }
};

let mockPayments = [
  {
    id: 'pay_1',
    date: new Date().toISOString().split('T')[0],
    reference: 'INV-2024-001',
    type: 'inflow',
    category: 'Invoice Payment',
    method: 'Bank Transfer',
    party: 'ABC Corporation',
    amount: 5000,
    notes: 'Advance received against invoice'
  },
  {
    id: 'pay_2',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    reference: 'INV-2024-002',
    type: 'inflow',
    category: 'Invoice Payment',
    method: 'Cash',
    party: 'XYZ Enterprises',
    amount: 15000,
    notes: 'Full payment received'
  },
  {
    id: 'pay_3',
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    reference: 'EXP-Salaries',
    type: 'outflow',
    category: 'Expense Payment',
    method: 'Bank Transfer',
    party: 'Payroll Account',
    amount: 45000,
    notes: 'Staff salaries - January'
  }
];

export const mockPaymentsAPI = {
  getAll: async (params = {}) => {
    await delay(300);
    let list = [...mockPayments];
    if (params.from) list = list.filter(p => p.date >= params.from);
    if (params.to) list = list.filter(p => p.date <= params.to);
    if (params.category) list = list.filter(p => p.category === params.category);
    if (params.method) list = list.filter(p => p.method === params.method);
    return { data: list };
  },
  create: async (data) => {
    await delay(400);
    const p = { id: 'pay_' + Date.now(), ...data };
    mockPayments = [p, ...mockPayments];
    return { data: p };
  },
  update: async (id, data) => {
    await delay(400);
    mockPayments = mockPayments.map(p => p.id === id ? { ...p, ...data, id } : p);
    return { data: { id, ...data } };
  },
  delete: async (id) => {
    await delay(200);
    mockPayments = mockPayments.filter(p => p.id !== id);
    return { data: { success: true } };
  }
};

export const mockReportsAPI = {
  getAll: async () => {
    await delay(400);
    const totalRevenue = mockInvoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
    const totalExpenses = mockExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const totalPurchases = mockPurchases.reduce((s, p) => s + (p.totalAmount || 0), 0);
    return {
      data: {
        profitLoss: {
          income: totalRevenue,
          expenses: totalExpenses,
          purchases: totalPurchases,
          profit: totalRevenue - totalExpenses - totalPurchases
        },
        comparison: [
          { period: 'Jan', income: 45000, expenses: 25000, purchases: 12000, profit: 8000 },
          { period: 'Feb', income: 52000, expenses: 28000, purchases: 15000, profit: 9000 },
          { period: 'Mar', income: 48000, expenses: 22000, purchases: 11000, profit: 15000 },
          { period: 'Apr', income: 61000, expenses: 30000, purchases: 18000, profit: 13000 }
        ],
        sales: [
          { period: 'Jan', amount: 45000, orders: 12 },
          { period: 'Feb', amount: 52000, orders: 15 },
          { period: 'Mar', amount: 48000, orders: 13 },
          { period: 'Apr', amount: 61000, orders: 18 }
        ],
        purchases: [
          { period: 'Jan', amount: 12000 },
          { period: 'Feb', amount: 15000 },
          { period: 'Mar', amount: 11000 },
          { period: 'Apr', amount: 18000 }
        ],
        expenses: [
          { category: 'Office', amount: 25000 },
          { category: 'Salaries', amount: 45000 },
          { category: 'Utilities', amount: 3500 },
          { category: 'Supplies', amount: 12500 }
        ],
        topCustomers: [],
        topProducts: [],
        assets: []
      }
    };
  }
};