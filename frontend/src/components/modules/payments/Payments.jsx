import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { paymentsAPI, settingsAPI } from '@/services/api';
import { notifyPaymentEvent, printPaymentSlip } from '@/services/notifications';
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
  party: '',
  partyPhone: '',
  reference: '',
  amount: 0,
  notes: '',
  balanceDue: 0,
};

function normalizePayment(p = {}) {
  return {
    id: p.id,
    date: p.date || '',
    type: p.type || 'inflow',
    category: p.category || '',
    party: p.party || p.customerName || p.customername || '',
    partyPhone: p.partyPhone || p.partyphone || p.phone || '',
    reference: p.reference || p.refId || p.refid || '',
    amount: Number(p.amount) || 0,
    method: p.method || 'Cash',
    notes: p.notes || '',
    balanceDue: Number(p.balanceDue ?? p.balancedue ?? 0) || 0,
  };
}

const Payments = () => {
  const { company } = useBrand();
  const [payments, setPayments] = useState([]);
  const [methods, setMethods] = useState(['Cash', 'Bank Transfer', 'UPI', 'Card', 'Cheque']);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', category: undefined, method: undefined, from: '', to: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(empty);
  const [saving, setSaving] = useState(false);

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
      partyPhone: p.partyPhone || p.phone || '',
      balanceDue: Number(p.balanceDue) || 0,
    });
    setDialogOpen(true);
  };

  const afterSaveActions = async (payment) => {
    const slip = printPaymentSlip(payment, company || {});
    if (!slip.ok) toast.error('Allow popups to print pocket slip');
    else toast.message('Pocket slip sent to printer');

    if (payment.partyPhone || payment.phone) {
      const notify = await notifyPaymentEvent(payment);
      if (notify?.whatsappOpened) toast.message('WhatsApp opened — tap Send');
      else if (!notify?.results?.whatsapp?.ok) toast.message('Payment saved (add phone for WhatsApp)');
    } else {
      toast.message('Payment saved — add party phone next time for WhatsApp');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.party?.trim()) {
      toast.error('Party / person is required');
      return;
    }
    if (!(Number(formData.amount) > 0)) {
      toast.error('Enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        date: formData.date,
        type: formData.type,
        category: formData.category,
        method: formData.method,
        party: formData.party,
        customerName: formData.party,
        partyPhone: formData.partyPhone || '',
        phone: formData.partyPhone || '',
        reference: formData.reference || `TXN-${Date.now().toString().slice(-8)}`,
        refId: formData.reference || `TXN-${Date.now().toString().slice(-8)}`,
        amount: Number(formData.amount) || 0,
        notes: formData.notes || '',
        balanceDue: Number(formData.balanceDue) || 0,
      };
      let saved;
      if (editing) {
        const res = await paymentsAPI.update(editing.id, payload);
        saved = normalizePayment(res.data || { ...editing, ...payload });
        toast.success('Payment updated');
      } else {
        const res = await paymentsAPI.create(payload);
        saved = normalizePayment(res.data || payload);
        toast.success(payload.type === 'outflow' ? 'Cash Out recorded' : 'Cash In recorded');
      }
      setDialogOpen(false);
      loadPayments();
      if (!editing) await afterSaveActions(saved);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save payment');
    } finally {
      setSaving(false);
    }
  };

  const reprint = (p) => {
    const slip = printPaymentSlip(p, company || {});
    if (!slip.ok) toast.error('Allow popups to print');
  };

  const resendWhatsApp = async (p) => {
    if (!(p.partyPhone || p.phone)) {
      toast.error('No phone on this payment — edit and add party phone');
      return;
    }
    const notify = await notifyPaymentEvent(p);
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
              <div><Label>Amount (Rs) *</Label><Input type="number" min="0" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} required data-testid="payment-amount-input" /></div>
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
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Party / Person *</Label><Input value={formData.party} onChange={(e) => setFormData({ ...formData, party: e.target.value })} required placeholder="Customer or vendor name" data-testid="payment-party-input" /></div>
              <div><Label>Party Phone (WhatsApp)</Label><Input value={formData.partyPhone || ''} onChange={(e) => setFormData({ ...formData, partyPhone: e.target.value })} placeholder="03XXXXXXXXX" data-testid="payment-phone-input" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Reference / Txn #</Label><Input value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} placeholder="Invoice, PO or Txn ID" /></div>
              <div><Label>Balance Due (optional)</Label><Input type="number" min="0" step="0.01" value={formData.balanceDue || 0} onChange={(e) => setFormData({ ...formData, balanceDue: parseFloat(e.target.value) || 0 })} /></div>
            </div>
            <div><Label>Notes</Label><Textarea rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
            <p className="text-xs text-gray-500">On save: pocket slip prints automatically + WhatsApp message opens (if phone given).</p>
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
