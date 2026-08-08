import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { paymentsAPI, settingsAPI, customersAPI, expensesAPI } from '@/services/api';
import { notifyPaymentEvent, printPaymentSlip } from '@/services/notifications';
import CustomerPicker, { requireCustomer } from '@/components/shared/CustomerPicker';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { useBrand } from '@/context/BrandContext';
import { Plus, Search, Edit, Trash2, CreditCard, TrendingUp, TrendingDown, Wallet, Building, Save, X, ArrowDownLeft, ArrowUpRight, Printer, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

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
    partyEmail: p.partyEmail || p.email || '',
    partyAddress: p.partyAddress || p.address || '',
    reference: p.reference || p.refId || p.refid || '',
    amount: Number(p.amount) || 0,
    method: p.method || 'Cash',
    notes: p.notes || '',
    balanceDue: Number(p.balanceDue ?? p.balancedue ?? 0) || 0,
    totalAmount: Number(p.totalAmount ?? p.totalamount ?? 0) || 0,
  };
}

const Payments = () => {
  const { company } = useBrand();
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [methods, setMethods] = useState(['Cash', 'Bank Transfer', 'UPI', 'Card', 'Cheque']);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', category: undefined, method: undefined, from: '', to: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(empty);
  const [saving, setSaving] = useState(false);

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
    });
    setDialogOpen(true);
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
    if (phone) {
      const notify = await notifyPaymentEvent({
        ...payment,
        amount: payment.amount,
        balanceDue: payment.balanceDue,
      }, {
        openWhatsApp: true,
        pendingWindow,
      });
      if (notify?.whatsappOpened) toast.message('WhatsApp opened — tap Send');
      else toast.error('WhatsApp did not open — check phone / Settings → Notifications');
    } else {
      if (pendingWindow && !pendingWindow.closed) {
        try { pendingWindow.close(); } catch { /* ignore */ }
      }
      toast.error('Party phone missing — WhatsApp not sent');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.type === 'inflow') {
      if (!requireCustomer({
        customerId: formData.customerId,
        customerName: formData.party,
        customerPhone: formData.partyPhone,
      })) return;
    } else if (!formData.party?.trim()) {
      toast.error('Party / person is required');
      return;
    } else if (!String(formData.partyPhone || '').trim()) {
      toast.error('Party phone required for WhatsApp receipt');
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
    if (!editing && String(formData.partyPhone || '').trim()) {
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
        reference: ref,
        refId: ref,
        amount: Number(formData.amount) || 0,
        notes: formData.notes || '',
        balanceDue: Number(formData.balanceDue) || 0,
        totalAmount: Number(formData.totalAmount) || 0,
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
      }
      setDialogOpen(false);
      loadPayments();
      if (!editing) {
        await afterSaveActions({
          ...saved,
          totalAmount: saved.totalAmount || payload.totalAmount,
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
    <div className="space-y-6" data-testid="payments-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#1F2937' }}>Payments</h1>
          <p className="text-gray-600 mt-1">Complete transaction history — money in & out</p>
        </div>
        <Button onClick={openCreate} style={{ backgroundColor: '#F26522' }} className="text-white" data-testid="add-payment-button">
          <Plus className="h-4 w-4 mr-2" />Record Transaction
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#10B981' }}>
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div><p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Money In</p><p className="text-lg font-bold text-emerald-700">{formatCurrency(stats.inflow)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EF4444' }}>
            <TrendingDown className="h-5 w-5 text-white" />
          </div>
          <div><p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Money Out</p><p className="text-lg font-bold text-rose-600">{formatCurrency(stats.outflow)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F26522' }}>
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div><p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Net Balance</p><p className={`text-lg font-bold ${stats.net >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{formatCurrency(stats.net)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#8B5CF6' }}>
            <CreditCard className="h-5 w-5 text-white" />
          </div>
          <div><p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Transactions</p><p className="text-lg font-bold" style={{ color: '#1F2937' }}>{stats.count}</p></div>
        </CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input placeholder="Search by party or reference..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="pl-10" data-testid="payment-search" />
          </div>
          <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v === 'all' ? undefined : v })}>
            <SelectTrigger data-testid="category-filter"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Categories</SelectItem>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filters.method} onValueChange={(v) => setFilters({ ...filters, method: v === 'all' ? undefined : v })}>
            <SelectTrigger data-testid="method-filter"><SelectValue placeholder="All Methods" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Methods</SelectItem>{methods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={loadPayments} style={{ backgroundColor: '#F26522' }} className="text-white">Apply</Button>
        </div>
      </CardContent></Card>

      <Card>
        <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-gray-500">Loading...</div>
            : filtered.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">No transactions yet.</p>
                <Button onClick={openCreate} style={{ backgroundColor: '#F26522' }} className="text-white"><Plus className="h-4 w-4 mr-2" />Record First Transaction</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-3 text-xs uppercase font-semibold text-gray-600">Date</th>
                    <th className="text-left py-3 px-3 text-xs uppercase font-semibold text-gray-600">Type</th>
                    <th className="text-left py-3 px-3 text-xs uppercase font-semibold text-gray-600">Category</th>
                    <th className="text-left py-3 px-3 text-xs uppercase font-semibold text-gray-600">Party</th>
                    <th className="text-left py-3 px-3 text-xs uppercase font-semibold text-gray-600">Reference</th>
                    <th className="text-left py-3 px-3 text-xs uppercase font-semibold text-gray-600">Method</th>
                    <th className="text-right py-3 px-3 text-xs uppercase font-semibold text-gray-600">Amount</th>
                    <th className="text-right py-3 px-3 text-xs uppercase font-semibold text-gray-600">Actions</th>
                  </tr></thead>
                  <tbody>
                    {filtered.map(p => {
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
                                <MessageCircle className="h-4 w-4" />
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
        </CardContent>
      </Card>

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

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Bill / Order Total (optional)</Label><Input type="number" min="0" step="0.01" value={formData.totalAmount || 0} onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })} placeholder="For WhatsApp Total" /></div>
              <div><Label>Balance Due (optional)</Label><Input type="number" min="0" step="0.01" value={formData.balanceDue || 0} onChange={(e) => setFormData({ ...formData, balanceDue: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div><Label>Reference / Txn #</Label><Input value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} placeholder="Invoice, Order or Txn ID" /></div>
            <div><Label>Notes</Label><Textarea rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
            <p className="text-xs text-gray-500">Save → pocket slip + WhatsApp (Total / Received / Balance). Edit never creates a duplicate payment.</p>
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
