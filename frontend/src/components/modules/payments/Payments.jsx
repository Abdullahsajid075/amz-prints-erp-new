import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { paymentsAPI, settingsAPI, customersAPI, expensesAPI, ordersAPI, invoicesAPI } from '@/services/api';
import { clearGasCache } from '@/services/gasClient';
import { notifyPaymentEvent, printPaymentSlip } from '@/services/notifications';
import CustomerPicker, { requireCustomer } from '@/components/shared/CustomerPicker';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { sortBy } from '@/utils/sortBy';
import SortBar from '@/components/shared/SortBar';
import PageHeader from '@/components/shared/PageHeader';
import { useBrand } from '@/context/BrandContext';
import { Plus, Search, Edit, Trash2, CreditCard, TrendingUp, TrendingDown, Wallet, Building, Save, X, ArrowDownLeft, ArrowUpRight, Printer } from 'lucide-react';
import { WhatsAppIcon } from '@/components/shared/WhatsAppIcon';
import { toast } from 'sonner';

const PAYMENT_SORT_OPTS = [
  { value: 'date', label: 'Date' },
  { value: 'party', label: 'Party' },
  { value: 'amount', label: 'Amount' },
  { value: 'type', label: 'Type' },
];

const CATEGORIES = ['Invoice Payment', 'Purchase Payment', 'Expense Payment', 'Refund', 'Other Income', 'Owner Deposit', 'Owner Withdrawal'];
const TYPES = [
  { key: 'inflow', label: 'Money In', color: '#10B981', icon: ArrowDownLeft },
  { key: 'outflow', label: 'Money Out', color: '#EF4444', icon: ArrowUpRight }
];

const empty = {
  date: new Date().toISOString().split('T')[0],
  type: 'inflow',
  category: 'Invoice Payment',
  method: 'Cash',
  customerId: '',
  party: '',
  partyPhone: '',
  partyEmail: '',
  partyAddress: '',
  reference: '',
  amount: 0,
  notes: '',
  balanceDue: 0,
  totalAmount: 0,
  linkedOrderId: '',
  linkedInvoiceId: '',
  linkedLabel: '',
};

function normalizePayment(p = {}) {
  return {
    id: p.id,
    date: p.date || '',
    type: p.type || 'inflow',
    category: p.category || '',
    customerId: p.customerId || p.customerid || '',
    party: p.party || p.customerName || p.customername || '',
    partyPhone: p.partyPhone || p.partyphone || p.phone || '',
    partyEmail: p.partyEmail || p.partyemail || p.email || p.customerEmail || '',
    partyAddress: p.partyAddress || p.address || '',
    reference: p.reference || p.refId || p.refid || '',
    amount: Number(p.amount) || 0,
    method: p.method || 'Cash',
    notes: p.notes || '',
    balanceDue: Number(p.balanceDue ?? p.balancedue ?? 0) || 0,
    totalAmount: Number(p.totalAmount ?? p.totalamount ?? 0) || 0,
    linkedOrderId: p.linkedOrderId || p.linkedorderid || '',
    linkedInvoiceId: p.linkedInvoiceId || p.linkedinvoiceid || '',
    linkedLabel: p.linkedLabel || '',
  };
}

function matchRef(row, needle) {
  const n = String(needle || '').trim().toLowerCase();
  if (!n) return false;
  const keys = [
    row.orderId, row.orderid, row.id, row.trackingNumber, row.trackingnumber,
    row.invoiceNumber, row.invoiceno, row.invoiceNo, row.shareToken,
  ].map((v) => String(v || '').trim().toLowerCase()).filter(Boolean);
  return keys.includes(n) || keys.some((k) => k.endsWith(n) || n.endsWith(k));
}

const Payments = () => {
  const { company } = useBrand();
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [methods, setMethods] = useState(['Cash', 'Bank Transfer', 'UPI', 'Card', 'Cheque']);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', category: undefined, method: undefined, from: '', to: '' });
  const [sort, setSort] = useState({ field: 'date', dir: 'desc' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      const res = await customersAPI.getAll();
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.category) params.category = filters.category;
      if (filters.method) params.method = filters.method;
      const res = await paymentsAPI.getAll(params);
      const list = Array.isArray(res.data) ? res.data : [];
      setPayments(list.map(normalizePayment));
    } catch (err) {
      console.error('Failed to fetch payments', err);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [filters.from, filters.to, filters.category, filters.method]);

  useEffect(() => {
    loadCustomers();
    settingsAPI.get().then(res => {
      const enabled = (res.data?.payments?.methods || []).filter(m => m.enabled).map(m => m.name);
      if (enabled.length) setMethods(enabled);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadPayments(); }, []);

  const filtered = payments.filter(p =>
    !filters.search ||
    p.party?.toLowerCase().includes(filters.search.toLowerCase()) ||
    p.reference?.toLowerCase().includes(filters.search.toLowerCase())
  );

  const sorted = useMemo(() => sortBy(filtered, sort, {
    date: (p) => p.date || '',
    party: (p) => p.party || '',
    amount: (p) => Number(p.amount || 0),
    type: (p) => p.type || '',
  }), [filtered, sort]);

  const stats = {
    inflow: filtered.filter(p => p.type === 'inflow').reduce((s, p) => s + (p.amount || 0), 0),
    outflow: filtered.filter(p => p.type === 'outflow').reduce((s, p) => s + (p.amount || 0), 0),
    count: filtered.length
  };
  stats.net = stats.inflow - stats.outflow;

  const openCreate = () => { setEditing(null); setFormData(empty); setDialogOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setFormData({
      ...empty,
      ...p,
      customerId: p.customerId || '',
      partyPhone: p.partyPhone || p.phone || '',
      balanceDue: Number(p.balanceDue) || 0,
      totalAmount: Number(p.totalAmount) || 0,
      linkedOrderId: p.linkedOrderId || '',
      linkedInvoiceId: p.linkedInvoiceId || '',
    });
    setDialogOpen(true);
  };

  /** Auto-fill amount / customer from Order or Invoice number (optional link). */
  const lookupReference = async () => {
    const ref = String(formData.reference || '').trim();
    if (!ref) {
      toast.error('Enter Order / Invoice number first');
      return;
    }
    setLookingUp(true);
    try {
      const [ordRes, invRes] = await Promise.all([
        ordersAPI.getAll().catch(() => ({ data: [] })),
        invoicesAPI.getAll().catch(() => ({ data: [] })),
      ]);
      const orders = Array.isArray(ordRes.data) ? ordRes.data : [];
      const invoices = Array.isArray(invRes.data) ? invRes.data : [];

      const order = orders.find((o) => matchRef(o, ref) && String(o.docType || 'Order').toLowerCase() !== 'quotation');
      if (order) {
        const total = Number(order.totalAmount || 0) || 0;
        const bal = Number(order.balanceAmount != null ? order.balanceAmount : Math.max(0, total - Number(order.advancePayment || 0)));
        setFormData((prev) => ({
          ...prev,
          reference: order.orderId || ref,
          linkedOrderId: order.id || '',
          linkedInvoiceId: '',
          linkedLabel: `Order ${order.orderId || order.id}`,
          customerId: order.customerId || prev.customerId,
          party: order.customerName || prev.party,
          partyPhone: order.customerPhone || prev.partyPhone,
          partyEmail: order.customerEmail || prev.partyEmail,
          partyAddress: order.customerAddress || prev.partyAddress,
          totalAmount: total,
          balanceDue: bal,
          amount: bal > 0 ? bal : total,
          category: prev.category || 'Invoice Payment',
          type: 'inflow',
        }));
        toast.success(`Linked to order ${order.orderId} — amount set to balance`);
        return;
      }

      const invoice = invoices.find((inv) => matchRef(inv, ref));
      if (invoice) {
        const total = Number(invoice.total ?? invoice.totalAmount ?? 0) || 0;
        const paid = Number(invoice.paidAmount ?? invoice.paid ?? 0) || 0;
        const bal = Number(invoice.balanceAmount != null ? invoice.balanceAmount : Math.max(0, total - paid));
        setFormData((prev) => ({
          ...prev,
          reference: invoice.invoiceNumber || invoice.invoiceNo || ref,
          linkedInvoiceId: invoice.id || '',
          linkedOrderId: invoice.orderId || '',
          linkedLabel: `Invoice ${invoice.invoiceNumber || invoice.invoiceNo || invoice.id}`,
          customerId: invoice.customerId || prev.customerId,
          party: invoice.customerName || prev.party,
          partyPhone: invoice.customerPhone || prev.partyPhone,
          partyEmail: invoice.customerEmail || prev.partyEmail,
          partyAddress: invoice.customerAddress || prev.partyAddress,
          totalAmount: total,
          balanceDue: bal,
          amount: bal > 0 ? bal : total,
          category: 'Invoice Payment',
          type: 'inflow',
        }));
        toast.success(`Linked to invoice — amount set to balance due`);
        return;
      }

      toast.error('No matching order or invoice — payment can still be saved as general Cash In');
      setFormData((prev) => ({ ...prev, linkedOrderId: '', linkedInvoiceId: '', linkedLabel: '' }));
    } catch (err) {
      console.error(err);
      toast.error('Lookup failed');
    } finally {
      setLookingUp(false);
    }
  };

  const applyPaymentToDocument = async (payment) => {
    const amt = Number(payment.amount) || 0;
    if (amt <= 0) return;
    if (payment.linkedInvoiceId) {
      try {
        const res = await invoicesAPI.getById(payment.linkedInvoiceId);
        const inv = res.data || {};
        const total = Number(inv.total ?? inv.totalAmount ?? payment.totalAmount ?? 0) || 0;
        const prevPaid = Number(inv.paidAmount ?? inv.paid ?? 0) || 0;
        const paidAmount = prevPaid + amt;
        const balance = Math.max(0, total - paidAmount);
        const status = balance <= 0 ? 'Paid' : (paidAmount > 0 ? 'Partial' : 'Unpaid');
        await invoicesAPI.update(payment.linkedInvoiceId, {
          ...inv,
          paidAmount,
          status,
        });
        toast.message(`Invoice updated — paid ${formatCurrency(paidAmount)}`);
      } catch (err) {
        console.warn('Invoice apply failed', err);
        toast.error('Payment saved, but invoice balance not updated');
      }
      return;
    }
    if (payment.linkedOrderId) {
      try {
        const res = await ordersAPI.getById(payment.linkedOrderId);
        const order = res.data || {};
        const total = Number(order.totalAmount || payment.totalAmount || 0) || 0;
        const prevAdv = Number(order.advancePayment || 0) || 0;
        const advancePayment = prevAdv + amt;
        const balanceAmount = Math.max(0, total - advancePayment);
        await ordersAPI.update(payment.linkedOrderId, {
          ...order,
          advancePayment,
          balanceAmount,
        });
        toast.message(`Order updated — advance ${formatCurrency(advancePayment)}`);
      } catch (err) {
        console.warn('Order apply failed', err);
        toast.error('Payment saved, but order advance not updated');
      }
    }
  };

  const afterSaveActions = async (payment, { pendingWindow = null } = {}) => {
    // Slip via hidden iframe (no popup permission)
    const slip = printPaymentSlip(payment, company || {});
    if (!slip.ok) toast.error('Could not open print dialog for payment slip');
    else toast.message('Payment slip ready — use Print / Save as PDF');

    // Cash Out must also land in Expenses for daily audit / reports
    const isOut = String(payment.type || '').toLowerCase() === 'outflow';
    if (isOut) {
      try {
        await expensesAPI.create({
          date: payment.date || new Date().toISOString().slice(0, 10),
          category: payment.category || 'Payment Out',
          amount: Number(payment.amount) || 0,
          description: `Payment Out · ${payment.party || ''} · Ref ${payment.reference || ''}`.trim(),
          paymentMethod: payment.method || 'Cash',
        });
        toast.message('Payment Out also recorded in Expenses (reports/audit)');
      } catch (err) {
        console.warn('Expense mirror failed', err);
        toast.error('Payment saved, but expense audit record failed');
      }
    }

    const phone = payment.partyPhone || payment.phone;
    const notify = await notifyPaymentEvent({
      ...payment,
      amount: payment.amount,
      balanceDue: payment.balanceDue,
      partyEmail: payment.partyEmail || payment.email || '',
    }, {
      openWhatsApp: !!phone,
      pendingWindow,
      sendEmail: true,
    });
    if (notify?.emailSent) toast.success(`Email sent to ${payment.partyEmail || payment.email}`);
    else if (notify?.emailError) toast.error(notify.emailError);
    if (phone) {
      if (notify?.whatsappOpened) toast.message('WhatsApp opened — tap Send');
      else toast.error('WhatsApp did not open — check phone / Settings → Notifications');
    } else if (pendingWindow && !pendingWindow.closed) {
      try { pendingWindow.close(); } catch { /* ignore */ }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.type === 'inflow') {
      if (!requireCustomer({
        customerId: formData.customerId,
        customerName: formData.party,
        customerPhone: formData.partyPhone,
        customerEmail: formData.partyEmail,
      })) return;
    } else if (!formData.party?.trim()) {
      toast.error('Party / person is required');
      return;
    }
    if (!(Number(formData.amount) > 0)) {
      toast.error('Enter a valid amount');
      return;
    }
    if (editing && !editing.id) {
      toast.error('Missing payment id — will not create duplicate');
      return;
    }

    // Pre-open WhatsApp tab during click (survives popup blocker after await)
    let waWindow = null;
    if (!editing && formData.type === 'inflow' && String(formData.partyPhone || '').trim()) {
      try {
        waWindow = window.open('about:blank', '_blank');
      } catch {
        waWindow = null;
      }
    }

    setSaving(true);
    try {
      const ref = formData.reference || `TXN-${Date.now().toString().slice(-8)}`;
      const payload = {
        id: editing?.id,
        date: formData.date,
        type: formData.type,
        category: formData.category,
        method: formData.method,
        customerId: formData.customerId || '',
        party: formData.party,
        customerName: formData.party,
        partyPhone: formData.partyPhone || '',
        phone: formData.partyPhone || '',
        partyEmail: formData.partyEmail || '',
        email: formData.partyEmail || '',
        reference: ref,
        refId: ref,
        amount: Number(formData.amount) || 0,
        notes: formData.notes || '',
        balanceDue: Number(formData.balanceDue) || 0,
        totalAmount: Number(formData.totalAmount) || 0,
        linkedOrderId: formData.linkedOrderId || '',
        linkedInvoiceId: formData.linkedInvoiceId || '',
      };
      let saved;
      if (editing) {
        const res = await paymentsAPI.update(editing.id, payload);
        saved = normalizePayment(res.data || { ...editing, ...payload });
        toast.success('Payment updated');
      } else {
        const res = await paymentsAPI.create(payload);
        saved = normalizePayment({ ...payload, ...(res.data || {}) });
        toast.success(payload.type === 'outflow' ? 'Cash Out recorded' : 'Cash In recorded');
        // Apply to linked order/invoice balances (optional link)
        if (payload.type === 'inflow' && (payload.linkedOrderId || payload.linkedInvoiceId)) {
          await applyPaymentToDocument({ ...saved, ...payload });
        }
      }
      clearGasCache();
      setDialogOpen(false);
      loadPayments();
      if (!editing) {
        await afterSaveActions({
          ...saved,
          totalAmount: saved.totalAmount || payload.totalAmount,
          balanceDue: saved.balanceDue ?? payload.balanceDue,
        }, { pendingWindow: waWindow });
      } else if (waWindow && !waWindow.closed) {
        try { waWindow.close(); } catch { /* ignore */ }
      }
    } catch (err) {
      console.error(err);
      if (waWindow && !waWindow.closed) {
        try { waWindow.close(); } catch { /* ignore */ }
      }
      toast.error(err.response?.data?.message || 'Failed to save payment');
    } finally {
      setSaving(false);
    }
  };

  const reprint = (p) => {
    const slip = printPaymentSlip(p, company || {});
    if (!slip.ok) toast.error('Could not print slip');
  };

  const resendWhatsApp = async (p) => {
    if (!(p.partyPhone || p.phone)) {
      toast.error('No phone on this payment — edit and add party phone');
      return;
    }
    let waWindow = null;
    try { waWindow = window.open('about:blank', '_blank'); } catch { waWindow = null; }
    const notify = await notifyPaymentEvent(p, { pendingWindow: waWindow });
    if (notify?.whatsappOpened) toast.message('WhatsApp opened — tap Send');
    else toast.error('Could not open WhatsApp');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this payment record?')) {
      try { await paymentsAPI.delete(id); toast.success('Payment deleted'); loadPayments(); }
      catch (err) { console.error(err); toast.error('Failed to delete'); }
    }
  };

  return (
    <div className="erp-page space-y-5" data-testid="payments-page">
      <PageHeader
        eyebrow="Finance"
        title="Payments"
        subtitle="Complete transaction history — money in & out"
        actions={(
          <Button onClick={openCreate} style={{ backgroundColor: '#F26522' }} className="text-white rounded-xl" data-testid="add-payment-button">
            <Plus className="h-4 w-4 mr-2" />Record Transaction
          </Button>
        )}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="erp-kpi flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#10B981' }}>
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div><p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 font-bold">Money In</p><p className="font-display text-lg font-bold text-emerald-700">{formatCurrency(stats.inflow)}</p></div>
        </div>
        <div className="erp-kpi flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EF4444' }}>
            <TrendingDown className="h-5 w-5 text-white" />
          </div>
          <div><p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 font-bold">Money Out</p><p className="font-display text-lg font-bold text-rose-600">{formatCurrency(stats.outflow)}</p></div>
        </div>
        <div className="erp-kpi flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F26522' }}>
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div><p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 font-bold">Net Balance</p><p className={`font-display text-lg font-bold ${stats.net >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{formatCurrency(stats.net)}</p></div>
        </div>
        <div className="erp-kpi flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#1C2430' }}>
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div><p className="text-[10px] uppercase tracking-[0.12em] text-slate-500 font-bold">Transactions</p><p className="font-display text-lg font-bold text-ink">{stats.count}</p></div>
        </div>
      </div>

      <div className="erp-panel p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input placeholder="Search by party or reference..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="pl-10 rounded-xl" data-testid="payment-search" />
          </div>
          <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v === 'all' ? undefined : v })}>
            <SelectTrigger data-testid="category-filter"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Categories</SelectItem>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filters.method} onValueChange={(v) => setFilters({ ...filters, method: v === 'all' ? undefined : v })}>
            <SelectTrigger data-testid="method-filter"><SelectValue placeholder="All Methods" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Methods</SelectItem>{methods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={loadPayments} style={{ backgroundColor: '#F26522' }} className="text-white rounded-xl">Apply</Button>
        </div>
        <div className="mt-3 max-w-md">
          <SortBar value={sort} onChange={setSort} options={PAYMENT_SORT_OPTS} />
        </div>
      </div>

      <div className="erp-table-wrap">
        <div className="px-4 py-3 border-b border-black/[0.05]">
          <h3 className="font-display text-sm font-bold text-ink">Transaction History</h3>
        </div>
        <div className="p-2 sm:p-3">
          {loading ? <div className="text-center py-8 text-slate-500">Loading...</div>
            : sorted.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 mb-4">No transactions yet.</p>
                <Button onClick={openCreate} style={{ backgroundColor: '#F26522' }} className="text-white rounded-xl"><Plus className="h-4 w-4 mr-2" />Record First Transaction</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table>
                  <thead><tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Party</th>
                    <th>Reference</th>
                    <th>Method</th>
                    <th className="!text-right">Amount</th>
                    <th className="!text-right">Actions</th>
                  </tr></thead>
                  <tbody>
                    {sorted.map(p => {
                      const isIn = p.type === 'inflow';
                      const T = isIn ? ArrowDownLeft : ArrowUpRight;
                      return (
                        <tr key={p.id} className="border-b hover:bg-orange-50/50" data-testid={`payment-row-${p.id}`}>
                          <td className="py-3 px-3 text-sm text-gray-600">{formatDate(p.date)}</td>
                          <td className="py-3 px-3">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold ${isIn ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                              <T className="h-3 w-3" />{isIn ? 'In' : 'Out'}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-sm">{p.category}</td>
                          <td className="py-3 px-3 text-sm font-medium">{p.party}</td>
                          <td className="py-3 px-3 text-xs" style={{ color: '#F26522' }}>{p.reference || '-'}</td>
                          <td className="py-3 px-3"><Badge variant="outline" className="text-xs gap-1"><Building className="h-3 w-3" />{p.method}</Badge></td>
                          <td className={`py-3 px-3 text-right font-bold ${isIn ? 'text-emerald-700' : 'text-rose-600'}`}>{isIn ? '+' : '-'}{formatCurrency(p.amount)}</td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center gap-1 justify-end">
                              <Button size="icon" variant="ghost" title="Print slip" onClick={() => reprint(p)}>
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="text-green-600" title="WhatsApp" onClick={() => resendWhatsApp(p)}>
                                <WhatsAppIcon className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => openEdit(p)} data-testid={`edit-payment-${p.id}`}><Edit className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)} data-testid={`delete-payment-${p.id}`}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" data-testid="payment-dialog">
          <DialogHeader><DialogTitle className="text-2xl font-bold" style={{ color: '#1F2937' }}>{editing ? 'Edit Payment' : 'Record Transaction'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              {TYPES.map(t => {
                const Icon = t.icon;
                const active = formData.type === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: t.key })}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${active ? 'shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                    style={active ? { borderColor: t.color, backgroundColor: t.color + '15' } : {}}
                    data-testid={`payment-type-${t.key}`}
                  >
                    <Icon className="h-5 w-5" style={{ color: t.color }} />
                    <span className="font-semibold text-sm" style={{ color: active ? t.color : '#374151' }}>{t.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Date *</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required data-testid="payment-date-input" /></div>
              <div><Label>Received Amount (Rs) *</Label><Input type="number" min="0" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} required data-testid="payment-amount-input" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger data-testid="payment-category-select"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Payment Method *</Label>
                <Select value={formData.method} onValueChange={(v) => setFormData({ ...formData, method: v })}>
                  <SelectTrigger data-testid="payment-method-select"><SelectValue /></SelectTrigger>
                  <SelectContent>{methods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {formData.type === 'inflow' ? (
              <CustomerPicker
                customers={customers}
                customerId={formData.customerId}
                customerName={formData.party}
                customerPhone={formData.partyPhone}
                customerEmail={formData.partyEmail}
                customerAddress={formData.partyAddress}
                onCustomersChange={(c) => setCustomers((prev) => [c, ...prev.filter((x) => x.id !== c.id)])}
                onChange={(next) => setFormData((prev) => ({
                  ...prev,
                  customerId: next.customerId,
                  party: next.customerName,
                  partyPhone: next.customerPhone,
                  partyEmail: next.customerEmail,
                  partyAddress: next.customerAddress,
                }))}
              />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Party / Person *</Label><Input value={formData.party} onChange={(e) => setFormData({ ...formData, party: e.target.value })} required placeholder="Vendor / recipient" /></div>
                <div><Label>Phone (WhatsApp)</Label><Input value={formData.partyPhone || ''} onChange={(e) => setFormData({ ...formData, partyPhone: e.target.value })} placeholder="03XXXXXXXXX" /></div>
              </div>
            )}

            <div>
              <Label>Order / Invoice # (optional)</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.reference}
                  onChange={(e) => setFormData({
                    ...formData,
                    reference: e.target.value,
                    linkedOrderId: '',
                    linkedInvoiceId: '',
                    linkedLabel: '',
                  })}
                  onBlur={() => {
                    if (formData.reference?.trim() && !formData.linkedOrderId && !formData.linkedInvoiceId) {
                      lookupReference();
                    }
                  }}
                  placeholder="ORD-0001 / INV-… / leave blank for general Cash In"
                  data-testid="payment-reference-input"
                />
                <Button type="button" variant="outline" className="shrink-0" disabled={lookingUp} onClick={lookupReference}>
                  {lookingUp ? '…' : 'Lookup'}
                </Button>
              </div>
              {formData.linkedLabel ? (
                <p className="text-[11px] text-emerald-700 mt-1">Linked: {formData.linkedLabel} — amount auto-filled from balance</p>
              ) : (
                <p className="text-[11px] text-gray-500 mt-1">Optional. Lookup fills customer + amount. Blank = general cash (still in Payments + Net position).</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Bill / Order Total</Label><Input type="number" min="0" step="0.01" value={formData.totalAmount || 0} onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })} placeholder="Auto from lookup" /></div>
              <div><Label>Balance Due</Label><Input type="number" min="0" step="0.01" value={formData.balanceDue || 0} onChange={(e) => setFormData({ ...formData, balanceDue: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div><Label>Notes</Label><Textarea rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
            <p className="text-xs text-gray-500">Save → updates order/invoice balance (if linked) · mini slip · WhatsApp · Dashboard / Reports / Ledger refresh.</p>
            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}><X className="h-4 w-4 mr-1" />Cancel</Button>
              <Button type="submit" style={{ backgroundColor: '#F26522' }} className="text-white" disabled={saving} data-testid="save-payment-button"><Save className="h-4 w-4 mr-1" />{saving ? 'Saving...' : editing ? 'Update' : 'Record'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payments;
