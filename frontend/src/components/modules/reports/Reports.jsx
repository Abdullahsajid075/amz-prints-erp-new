import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { reportsAPI, ordersAPI, expensesAPI, paymentsAPI, purchasesAPI } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { sortBy } from '@/utils/sortBy';
import SortBar from '@/components/shared/SortBar';
import { useBrand } from '@/context/BrandContext';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Calendar, Printer, FileSpreadsheet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { toast } from 'sonner';

const COLORS = ['#ff6d00', '#2E2E2E', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];

const REPORT_TYPES = [
  { value: 'pl', label: 'Profit & Loss' },
  { value: 'sales', label: 'Sales Report' },
  { value: 'pos', label: 'POS Statement' },
  { value: 'purchases', label: 'Purchase Report' },
  { value: 'expenses', label: 'Expense Report' },
  { value: 'payments', label: 'Payments Report' },
  { value: 'orders', label: 'Orders Detail' },
  { value: 'customers', label: 'Top Customers / Products' },
  { value: 'assets', label: 'Assets' },
];

function isPosOrder(o) {
  const dt = String(o.docType || o.doctype || '').toLowerCase();
  if (dt === 'pos') return true;
  return /pos\s*sale/i.test(String(o.remarks || o.notes || ''));
}

function inRange(dateStr, from, to) {
  if (!dateStr) return true;
  const d = String(dateStr).slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

function toCsv(rows, columns) {
  const escape = (v) => {
    const s = v == null ? '' : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = columns.map((c) => escape(c.label)).join(',');
  const body = rows.map((row) => columns.map((c) => escape(typeof c.get === 'function' ? c.get(row) : row[c.key])).join(',')).join('\n');
  return `${header}\n${body}`;
}

function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const Reports = () => {
  const { primary, company } = useBrand();
  const [period, setPeriod] = useState('monthly');
  const [reportType, setReportType] = useState('pl');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [data, setData] = useState({ sales: [], purchases: [], expenses: [], profitLoss: null, topCustomers: [], topProducts: [], assets: [], comparison: [] });
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenseRows, setExpenseRows] = useState([]);
  const [purchaseRows, setPurchaseRows] = useState([]);
  const [sort, setSort] = useState({ field: 'date', dir: 'desc' });
  const [loading, setLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const [rep, ord, exp, pay, pur] = await Promise.allSettled([
        reportsAPI.getAll({ period, from: dateRange.from, to: dateRange.to, type: reportType }),
        ordersAPI.getAll(),
        expensesAPI.getAll(),
        paymentsAPI.getAll(),
        purchasesAPI.getAll(),
      ]);

      if (rep.status === 'fulfilled' && rep.value.data) {
        setData((prev) => ({ ...prev, ...rep.value.data }));
      }

      const orderList = ord.status === 'fulfilled' ? (ord.value.data || []) : [];
      const expenseList = exp.status === 'fulfilled' ? (exp.value.data || []) : [];
      const paymentList = pay.status === 'fulfilled' ? (pay.value.data || []) : [];
      const purchaseList = pur.status === 'fulfilled' ? (pur.value.data || []) : [];

      setOrders(orderList);
      setPayments(paymentList);
      setExpenseRows(expenseList);
      setPurchaseRows(purchaseList);

      // Build client-side summary when GAS reports are thin
      const filteredOrders = orderList.filter((o) => inRange(o.date, dateRange.from, dateRange.to) && String(o.docType || 'Order').toLowerCase() !== 'quotation');
      const filteredExpenses = expenseList.filter((e) => inRange(e.date, dateRange.from, dateRange.to));
      const filteredPurchases = purchaseList.filter((p) => inRange(p.purchaseDate || p.date, dateRange.from, dateRange.to));
      const orderAmt = (o) => {
        const direct = Number(o.totalAmount || 0);
        if (direct > 0) return direct;
        return (o.products || []).reduce((s, p) => s + (Number(p.quantity) || 0) * (Number(p.rate) || 0), 0);
      };
      const income = filteredOrders.reduce((s, o) => s + orderAmt(o), 0);
      const expenseSum = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
      const paymentOutSum = paymentList
        .filter((p) => String(p.type || '').toLowerCase() === 'outflow' && inRange(p.date, dateRange.from, dateRange.to))
        .reduce((s, p) => s + Number(p.amount || 0), 0);
      // Prefer expenses sheet; if empty, fall back to payment outflows for daily audit
      const auditExpenses = expenseSum > 0 ? expenseSum : paymentOutSum;
      const purchaseSum = filteredPurchases.reduce((s, p) => s + Number(p.total || p.totalAmount || 0), 0);

      const expenseByCat = {};
      filteredExpenses.forEach((e) => {
        const cat = e.category || 'Other';
        expenseByCat[cat] = (expenseByCat[cat] || 0) + Number(e.amount || 0);
      });
      if (!Object.keys(expenseByCat).length) {
        paymentList
          .filter((p) => String(p.type || '').toLowerCase() === 'outflow' && inRange(p.date, dateRange.from, dateRange.to))
          .forEach((p) => {
            const cat = p.category || p.party || 'Payment Out';
            expenseByCat[cat] = (expenseByCat[cat] || 0) + Number(p.amount || 0);
          });
      }

      const customerMap = {};
      const productMap = {};
      filteredOrders.forEach((o) => {
        const name = o.customerName || 'Unknown';
        customerMap[name] = (customerMap[name] || 0) + orderAmt(o);
        (o.products || []).forEach((p) => {
          const pn = p.name || 'Item';
          if (!productMap[pn]) productMap[pn] = { name: pn, quantity: 0, revenue: 0 };
          productMap[pn].quantity += Number(p.quantity || 0);
          productMap[pn].revenue += Number(p.quantity || 0) * Number(p.rate || 0);
        });
      });

      setData((prev) => ({
        ...prev,
        profitLoss: prev.profitLoss?.income != null
          ? prev.profitLoss
          : { income, expenses: auditExpenses, purchases: purchaseSum, profit: income - auditExpenses - purchaseSum },
        expenses: (prev.expenses || []).length ? prev.expenses : Object.entries(expenseByCat).map(([category, amount]) => ({ category, amount })),
        topCustomers: (prev.topCustomers || []).length
          ? prev.topCustomers
          : Object.entries(customerMap).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 10),
        topProducts: (prev.topProducts || []).length
          ? prev.topProducts
          : Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
        sales: (prev.sales || []).length ? prev.sales : [{ period: 'Selected', amount: income, orders: filteredOrders.length }],
        purchases: (prev.purchases || []).length ? prev.purchases : [{ period: 'Selected', amount: purchaseSum }],
        comparison: (prev.comparison || []).length
          ? prev.comparison
          : [{ period: 'Selected', income, expenses: auditExpenses, purchases: purchaseSum, profit: income - auditExpenses - purchaseSum }],
      }));
    } catch (err) {
      console.error('Failed to fetch reports', err);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [period, dateRange.from, dateRange.to, reportType]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const pl = data.profitLoss || { income: 0, expenses: 0, purchases: 0, profit: 0 };
  const plBreakdown = useMemo(
    () => [{ name: 'Income', value: pl.income }, { name: 'Expenses', value: pl.expenses }, { name: 'Purchases', value: pl.purchases }],
    [pl.income, pl.expenses, pl.purchases]
  );

  const filteredOrders = useMemo(
    () => orders.filter((o) => inRange(o.date, dateRange.from, dateRange.to) && String(o.docType || 'Order').toLowerCase() !== 'quotation'),
    [orders, dateRange.from, dateRange.to]
  );
  const filteredPosOrders = useMemo(
    () => filteredOrders.filter(isPosOrder),
    [filteredOrders]
  );
  const filteredBookingOrders = useMemo(
    () => filteredOrders.filter((o) => !isPosOrder(o)),
    [filteredOrders]
  );
  const filteredPayments = useMemo(
    () => payments.filter((p) => inRange(p.date, dateRange.from, dateRange.to)),
    [payments, dateRange.from, dateRange.to]
  );
  const filteredExpenseDetails = useMemo(
    () => expenseRows.filter((e) => inRange(e.date, dateRange.from, dateRange.to)),
    [expenseRows, dateRange.from, dateRange.to]
  );
  const filteredPurchaseDetails = useMemo(
    () => purchaseRows.filter((p) => inRange(p.purchaseDate || p.date, dateRange.from, dateRange.to)),
    [purchaseRows, dateRange.from, dateRange.to]
  );

  const detailGetters = useMemo(() => ({
    date: (r) => r.date || r.purchaseDate || '',
    name: (r) => r.customerName || r.party || r.vendorName || r.name || r.description || '',
    amount: (r) => Number(r.totalAmount ?? r.total ?? r.amount ?? 0) || 0,
    status: (r) => r.status || r.type || '',
    orderId: (r) => r.orderId || r.poNumber || r.purchaseNo || r.id || '',
  }), []);

  const sortedBookingOrders = useMemo(
    () => sortBy(filteredBookingOrders, sort, detailGetters),
    [filteredBookingOrders, sort, detailGetters]
  );
  const sortedPosOrders = useMemo(
    () => sortBy(filteredPosOrders, sort, detailGetters),
    [filteredPosOrders, sort, detailGetters]
  );
  const sortedPayments = useMemo(
    () => sortBy(filteredPayments, sort, detailGetters),
    [filteredPayments, sort, detailGetters]
  );
  const sortedExpenses = useMemo(
    () => sortBy(filteredExpenseDetails, sort, {
      ...detailGetters,
      name: (r) => r.description || r.category || '',
      amount: (r) => Number(r.amount || 0),
    }),
    [filteredExpenseDetails, sort, detailGetters]
  );
  const sortedPurchases = useMemo(
    () => sortBy(filteredPurchaseDetails, sort, {
      ...detailGetters,
      date: (r) => r.purchaseDate || r.date || '',
      name: (r) => r.vendorName || '',
      amount: (r) => Number(r.totalAmount ?? r.total ?? 0),
      orderId: (r) => r.poNumber || r.purchaseNo || r.id || '',
    }),
    [filteredPurchaseDetails, sort, detailGetters]
  );
  const sortedSalesOrders = useMemo(
    () => sortBy(filteredOrders, sort, detailGetters),
    [filteredOrders, sort, detailGetters]
  );

  const DETAIL_SORT_OPTS = [
    { value: 'date', label: 'Date' },
    { value: 'name', label: 'Name / Party' },
    { value: 'amount', label: 'Amount' },
    { value: 'status', label: 'Status / Type' },
    { value: 'orderId', label: 'Ref / ID' },
  ];

  const exportCsv = () => {
    let csv = '';
    let name = `report-${reportType}`;
    if (reportType === 'orders') {
      csv = toCsv(sortedBookingOrders, [
        { label: 'Order', key: 'orderId' },
        { label: 'Date', key: 'date' },
        { label: 'Customer', key: 'customerName' },
        { label: 'Status', key: 'status' },
        { label: 'Total', key: 'totalAmount' },
        { label: 'Advance', key: 'advancePayment' },
      ]);
    } else if (reportType === 'pos' || reportType === 'sales') {
      const rows = reportType === 'pos' ? sortedPosOrders : sortedSalesOrders;
      csv = toCsv(rows, [
        { label: 'Ref #', key: 'orderId' },
        { label: 'Date', key: 'date' },
        { label: 'Customer', key: 'customerName' },
        { label: 'Phone', key: 'customerPhone' },
        { label: 'Type', get: (r) => (isPosOrder(r) ? 'POS' : 'Order') },
        { label: 'Total', key: 'totalAmount' },
        { label: 'Paid', key: 'advancePayment' },
        { label: 'Status', key: 'status' },
      ]);
    } else if (reportType === 'payments') {
      csv = toCsv(sortedPayments, [
        { label: 'Date', key: 'date' },
        { label: 'Type', key: 'type' },
        { label: 'Party', get: (r) => r.party || r.customerName || '' },
        { label: 'Amount', key: 'amount' },
        { label: 'Method', get: (r) => r.method || r.Method || '' },
        { label: 'Ref', get: (r) => r.reference || r.refId || '' },
      ]);
    } else if (reportType === 'expenses') {
      csv = toCsv(sortedExpenses, [
        { label: 'Date', key: 'date' },
        { label: 'Category', key: 'category' },
        { label: 'Description', key: 'description' },
        { label: 'Amount', key: 'amount' },
        { label: 'Method', get: (r) => r.paymentMethod || r.method || '' },
      ]);
    } else if (reportType === 'purchases') {
      csv = toCsv(sortedPurchases, [
        { label: 'PO #', get: (r) => r.poNumber || r.purchaseNo || r.id },
        { label: 'Date', get: (r) => r.purchaseDate || r.date },
        { label: 'Vendor', key: 'vendorName' },
        { label: 'Status', key: 'status' },
        { label: 'Total', get: (r) => r.totalAmount ?? r.total },
        { label: 'Paid', get: (r) => r.paidAmount ?? r.paid },
      ]);
    } else if (reportType === 'customers') {
      csv = toCsv(data.topCustomers || [], [
        { label: 'Customer', key: 'name' },
        { label: 'Amount', key: 'amount' },
      ]);
    } else {
      csv = toCsv(
        [
          { metric: 'Income', value: pl.income },
          { metric: 'Expenses', value: pl.expenses },
          { metric: 'Purchases', value: pl.purchases },
          { metric: 'Profit', value: pl.profit },
        ],
        [
          { label: 'Metric', key: 'metric' },
          { label: 'Value', key: 'value' },
        ]
      );
      name = 'report-pl';
    }
    downloadCsv(`${name}-${dateRange.from || 'all'}-${dateRange.to || 'all'}.csv`, csv);
    toast.success('CSV exported');
  };

  const printReport = () => window.print();

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Filter by date · export CSV · print PDF</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCsv} data-testid="export-csv">
            <FileSpreadsheet className="h-4 w-4 mr-2" />CSV / Excel
          </Button>
          <Button variant="outline" onClick={printReport} data-testid="print-report">
            <Printer className="h-4 w-4 mr-2" />Print / PDF
          </Button>
        </div>
      </div>

      <Card className="no-print"><CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-xs text-gray-500 font-medium uppercase">Report Type</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger data-testid="report-type-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium uppercase">Period</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger data-testid="period-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium uppercase">From</label>
            <Input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} data-testid="report-from" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium uppercase">To</label>
            <Input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} data-testid="report-to" />
          </div>
          <div className="flex items-end lg:col-span-2">
            <Button onClick={fetchReports} style={{ backgroundColor: primary || '#ff6d00' }} className="text-white w-full" disabled={loading}>
              <Calendar className="h-4 w-4 mr-2" />{loading ? 'Loading…' : 'Apply'}
            </Button>
          </div>
        </div>
      </CardContent></Card>

      <div className="print-only hidden print:block text-center mb-4">
        <h1 className="text-2xl font-bold">{company.name || 'AMZ Prints'} — {REPORT_TYPES.find((t) => t.value === reportType)?.label}</h1>
        <p className="text-sm text-gray-600">{dateRange.from || 'Start'} → {dateRange.to || 'Today'}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#10B981' }}><TrendingUp className="h-6 w-6 text-white" /></div>
          <div><p className="text-xs text-gray-500 uppercase font-medium">Total Income</p><p className="text-xl font-bold text-green-700">{formatCurrency(pl.income)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EF4444' }}><TrendingDown className="h-6 w-6 text-white" /></div>
          <div><p className="text-xs text-gray-500 uppercase font-medium">Expenses</p><p className="text-xl font-bold text-red-600">{formatCurrency(pl.expenses)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#8B5CF6' }}><ShoppingBag className="h-6 w-6 text-white" /></div>
          <div><p className="text-xs text-gray-500 uppercase font-medium">Purchases</p><p className="text-xl font-bold">{formatCurrency(pl.purchases)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: pl.profit >= 0 ? (primary || '#ff6d00') : '#EF4444' }}><DollarSign className="h-6 w-6 text-white" /></div>
          <div><p className="text-xs text-gray-500 uppercase font-medium">{pl.profit >= 0 ? 'Net Profit' : 'Net Loss'}</p><p className="text-xl font-bold" style={{ color: pl.profit >= 0 ? (primary || '#ff6d00') : '#EF4444' }}>{formatCurrency(Math.abs(pl.profit))}</p></div>
        </CardContent></Card>
      </div>

      <Tabs value={reportType} onValueChange={setReportType}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 no-print h-auto flex-wrap gap-1">
          <TabsTrigger value="pl">P&L</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="pos">POS</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="customers">Top</TabsTrigger>
        </TabsList>

        <div className="no-print mt-3 max-w-md">
          <SortBar value={sort} onChange={setSort} options={DETAIL_SORT_OPTS} />
        </div>

        <TabsContent value="pl" className="space-y-4">
          <Card><CardHeader><CardTitle>Profit & Loss Comparison</CardTitle></CardHeader><CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.comparison}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" /><YAxis /><Tooltip /><Legend />
                <Bar dataKey="income" fill="#10B981" name="Income" />
                <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                <Bar dataKey="purchases" fill="#8B5CF6" name="Purchases" />
                <Bar dataKey="profit" fill={primary || '#ff6d00'} name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent></Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card><CardHeader><CardTitle>Profit Trend</CardTitle></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data.comparison}>
                  <defs><linearGradient id="cP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={primary || '#ff6d00'} stopOpacity={0.8} /><stop offset="95%" stopColor={primary || '#ff6d00'} stopOpacity={0.1} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" /><YAxis /><Tooltip />
                  <Area type="monotone" dataKey="profit" stroke={primary || '#ff6d00'} fill="url(#cP)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent></Card>
            <Card><CardHeader><CardTitle>P&L Breakdown</CardTitle></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={plBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {plBreakdown.map((entry) => <Cell key={entry.name} fill={COLORS[plBreakdown.indexOf(entry)]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card><CardHeader><CardTitle>Sales chart</CardTitle></CardHeader><CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.sales}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" /><YAxis /><Tooltip /><Legend />
                <Line type="monotone" dataKey="amount" stroke={primary || '#ff6d00'} strokeWidth={2} name="Sales" />
                <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Sales detail ({sortedSalesOrders.length})</CardTitle></CardHeader><CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-gray-50">
                  <th className="text-left p-2">Ref</th><th className="text-left p-2">Date</th><th className="text-left p-2">Customer</th><th className="text-left p-2">Type</th><th className="text-left p-2">Status</th><th className="text-right p-2">Total</th>
                </tr></thead>
                <tbody>
                  {sortedSalesOrders.map((o) => (
                    <tr key={o.id} className="border-b">
                      <td className="p-2 font-medium">{o.orderId}</td>
                      <td className="p-2">{formatDate(o.date)}</td>
                      <td className="p-2">{o.customerName || '—'}</td>
                      <td className="p-2"><Badge variant="outline">{isPosOrder(o) ? 'POS' : 'Order'}</Badge></td>
                      <td className="p-2">{o.status}</td>
                      <td className="p-2 text-right font-semibold" style={{ color: primary || '#ff6d00' }}>{formatCurrency(o.totalAmount)}</td>
                    </tr>
                  ))}
                  {!sortedSalesOrders.length && <tr><td colSpan={6} className="p-6 text-center text-gray-500">No sales in range</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4">
          <Card><CardHeader><CardTitle>Purchase chart</CardTitle></CardHeader><CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.purchases}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" /><YAxis /><Tooltip /><Legend />
                <Bar dataKey="amount" fill="#8B5CF6" name="Purchase Value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Purchase detail ({sortedPurchases.length})</CardTitle></CardHeader><CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-gray-50">
                  <th className="text-left p-2">PO #</th><th className="text-left p-2">Date</th><th className="text-left p-2">Vendor</th><th className="text-left p-2">Status</th><th className="text-right p-2">Total</th><th className="text-right p-2">Paid</th>
                </tr></thead>
                <tbody>
                  {sortedPurchases.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-2 font-medium">{p.poNumber || p.purchaseNo || p.id}</td>
                      <td className="p-2">{formatDate(p.purchaseDate || p.date)}</td>
                      <td className="p-2">{p.vendorName || '—'}</td>
                      <td className="p-2"><Badge variant="outline">{p.status || '—'}</Badge></td>
                      <td className="p-2 text-right font-semibold">{formatCurrency(p.totalAmount ?? p.total)}</td>
                      <td className="p-2 text-right">{formatCurrency(p.paidAmount ?? p.paid)}</td>
                    </tr>
                  ))}
                  {!sortedPurchases.length && <tr><td colSpan={6} className="p-6 text-center text-gray-500">No purchases in range</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card><CardHeader><CardTitle>Expense by category</CardTitle></CardHeader><CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.expenses} cx="50%" cy="50%" outerRadius={110} dataKey="amount" nameKey="category" label={(e) => e.category}>
                  {(data.expenses || []).map((cat) => <Cell key={cat.category} fill={COLORS[(data.expenses || []).indexOf(cat) % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Expense detail ({sortedExpenses.length})</CardTitle></CardHeader><CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-gray-50">
                  <th className="text-left p-2">Date</th><th className="text-left p-2">Category</th><th className="text-left p-2">Description</th><th className="text-left p-2">Method</th><th className="text-right p-2">Amount</th>
                </tr></thead>
                <tbody>
                  {sortedExpenses.map((e) => (
                    <tr key={e.id} className="border-b">
                      <td className="p-2">{formatDate(e.date)}</td>
                      <td className="p-2">{e.category || '—'}</td>
                      <td className="p-2">{e.description || e.paidTo || '—'}</td>
                      <td className="p-2">{e.paymentMethod || e.method || '—'}</td>
                      <td className="p-2 text-right font-semibold text-red-600">{formatCurrency(e.amount)}</td>
                    </tr>
                  ))}
                  {!sortedExpenses.length && <tr><td colSpan={5} className="p-6 text-center text-gray-500">No expenses in range</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card><CardHeader><CardTitle>Payments detail ({sortedPayments.length})</CardTitle></CardHeader><CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-gray-50">
                  <th className="text-left p-2">Date</th><th className="text-left p-2">Party</th><th className="text-left p-2">Type</th><th className="text-left p-2">Method</th><th className="text-left p-2">Ref</th><th className="text-right p-2">Amount</th>
                </tr></thead>
                <tbody>
                  {sortedPayments.map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-2">{formatDate(p.date)}</td>
                      <td className="p-2">{p.party || p.customerName || '—'}</td>
                      <td className="p-2"><Badge variant="outline">{p.type}</Badge></td>
                      <td className="p-2">{p.method || '—'}</td>
                      <td className="p-2">{p.reference || p.refId || '—'}</td>
                      <td className="p-2 text-right font-semibold">{formatCurrency(p.amount)}</td>
                    </tr>
                  ))}
                  {!sortedPayments.length && <tr><td colSpan={6} className="p-6 text-center text-gray-500">No payments in range</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card><CardHeader><CardTitle>Orders detail ({sortedBookingOrders.length})</CardTitle></CardHeader><CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-gray-50">
                  <th className="text-left p-2">Order</th><th className="text-left p-2">Date</th><th className="text-left p-2">Customer</th><th className="text-left p-2">Status</th><th className="text-right p-2">Total</th><th className="text-right p-2">Balance</th>
                </tr></thead>
                <tbody>
                  {sortedBookingOrders.map((o) => (
                    <tr key={o.id} className="border-b">
                      <td className="p-2 font-medium">{o.orderId}</td>
                      <td className="p-2">{formatDate(o.date)}</td>
                      <td className="p-2">{o.customerName}</td>
                      <td className="p-2"><Badge variant="outline">{o.status}</Badge></td>
                      <td className="p-2 text-right font-semibold" style={{ color: primary || '#ff6d00' }}>{formatCurrency(o.totalAmount)}</td>
                      <td className="p-2 text-right">{formatCurrency(o.balanceAmount)}</td>
                    </tr>
                  ))}
                  {!sortedBookingOrders.length && <tr><td colSpan={6} className="p-6 text-center text-gray-500">No orders in range</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="pos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>POS detail ({sortedPosOrders.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={() => window.location.assign('/pos/statement')}>Open full statement</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-gray-50">
                    <th className="text-left p-2">POS #</th><th className="text-left p-2">Date</th><th className="text-left p-2">Customer</th><th className="text-left p-2">Phone</th><th className="text-left p-2">Status</th><th className="text-right p-2">Total</th>
                  </tr></thead>
                  <tbody>
                    {sortedPosOrders.map((o) => (
                      <tr key={o.id} className="border-b">
                        <td className="p-2 font-medium">{o.orderId}</td>
                        <td className="p-2">{formatDate(o.date)}</td>
                        <td className="p-2">{o.customerName || 'Walk-in'}</td>
                        <td className="p-2">{o.customerPhone || '—'}</td>
                        <td className="p-2"><Badge variant="outline">{o.status}</Badge></td>
                        <td className="p-2 text-right font-semibold" style={{ color: primary || '#ff6d00' }}>{formatCurrency(o.totalAmount)}</td>
                      </tr>
                    ))}
                    {!sortedPosOrders.length && <tr><td colSpan={6} className="p-6 text-center text-gray-500">No POS sales in range</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets"><Card><CardHeader><CardTitle>Assets Management</CardTitle></CardHeader><CardContent>
          {(data.assets || []).length === 0 ? (<p className="text-center py-8 text-gray-500">No assets recorded.</p>) : (
            <table className="w-full">
              <thead><tr className="border-b bg-gray-50">
                <th className="text-left py-2 px-3 text-xs uppercase font-semibold text-gray-600">Asset</th>
                <th className="text-left py-2 px-3 text-xs uppercase font-semibold text-gray-600">Category</th>
                <th className="text-right py-2 px-3 text-xs uppercase font-semibold text-gray-600">Purchase Value</th>
                <th className="text-right py-2 px-3 text-xs uppercase font-semibold text-gray-600">Current Value</th>
                <th className="text-right py-2 px-3 text-xs uppercase font-semibold text-gray-600">Depreciation</th>
              </tr></thead>
              <tbody>
                {data.assets.map((a) => (
                  <tr key={a.id || a.name} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{a.name}</td>
                    <td className="py-2 px-3"><Badge variant="outline">{a.category}</Badge></td>
                    <td className="py-2 px-3 text-right">{formatCurrency(a.purchaseValue)}</td>
                    <td className="py-2 px-3 text-right font-semibold">{formatCurrency(a.currentValue)}</td>
                    <td className="py-2 px-3 text-right text-red-600">-{formatCurrency(a.purchaseValue - a.currentValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent></Card></TabsContent>

        <TabsContent value="customers"><div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card><CardHeader><CardTitle>Top Customers</CardTitle></CardHeader><CardContent>
            {(data.topCustomers || []).map((c, i) => (
              <div key={c.id || c.name} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: COLORS[i % COLORS.length] }}>{i + 1}</div>
                  <span className="font-medium">{c.name}</span>
                </div>
                <span className="font-bold" style={{ color: primary || '#ff6d00' }}>{formatCurrency(c.amount)}</span>
              </div>
            ))}
            {!(data.topCustomers || []).length && <p className="text-sm text-gray-500 text-center py-6">No data</p>}
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Top Products</CardTitle></CardHeader><CardContent>
            {(data.topProducts || []).map((p, i) => (
              <div key={p.id || p.name} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: COLORS[i % COLORS.length] }}>{i + 1}</div>
                  <span className="font-medium">{p.name}</span>
                </div>
                <div className="text-right"><p className="font-bold" style={{ color: primary || '#ff6d00' }}>{formatCurrency(p.revenue)}</p><p className="text-xs text-gray-500">{p.quantity} sold</p></div>
              </div>
            ))}
            {!(data.topProducts || []).length && <p className="text-sm text-gray-500 text-center py-6">No data</p>}
          </CardContent></Card>
        </div></TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
