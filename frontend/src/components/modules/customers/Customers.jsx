import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { customersAPI } from '@/services/api';
import { finishPaymentRecording } from '@/utils/paymentActions';
import { useBrand } from '@/context/BrandContext';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { customerMatchesQuery } from '@/utils/customerSearch';
import {
  isCustomerBlocked, canUnblockCustomer, customerDisplayCode,
  openUrduBalanceWhatsApp, openCustomerWelcomeWhatsApp,
} from '@/utils/customerHelpers';
import { useAuth } from '@/context/AuthContext';
import { sortBy } from '@/utils/sortBy';
import SortBar from '@/components/shared/SortBar';
import { Plus, Search, Edit, Trash2, User, Phone, Mail, MapPin, TrendingUp, X, Save, BookOpen, Bell, Kanban, ShieldBan, ShieldCheck, Wallet } from 'lucide-react';
import { WhatsAppIcon } from '@/components/shared/WhatsAppIcon';
import { toast } from 'sonner';

const CUSTOMER_SORT_OPTS = [
  { value: 'name', label: 'Name' },
  { value: 'phone', label: 'Phone' },
  { value: 'city', label: 'City' },
];

const empty = {
  name: '', phone: '', email: '', address: '', city: '', notes: '',
  notifyWhatsApp: true, notifyEmail: true,
};

const Customers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { company } = useBrand();
  const canUnblock = canUnblockCustomer(user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ field: 'name', dir: 'asc' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [ledger, setLedger] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [balanceSending, setBalanceSending] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockTarget, setBlockTarget] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockSaving, setBlockSaving] = useState(false);
  const [payCustomer, setPayCustomer] = useState(null);
  const [payData, setPayData] = useState({ amount: '', method: 'Cash', notes: '', date: new Date().toISOString().slice(0, 10), reference: '' });
  const [paySaving, setPaySaving] = useState(false);

  const withBalanceCount = useMemo(
    () => customers.filter((c) => Number(c.outstanding) > 0).length,
    [customers],
  );
  const blockedCount = useMemo(
    () => customers.filter((c) => isCustomerBlocked(c)).length,
    [customers],
  );

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customersAPI.getAll();
      setCustomers(res.data || []);
    } catch (err) { console.error(err); toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const filtered = customers.filter((c) => customerMatchesQuery(c, search));
  const sorted = useMemo(() => sortBy(filtered, sort, {
    name: (c) => c.name || '',
    phone: (c) => c.phone || '',
    city: (c) => c.city || '',
  }), [filtered, sort]);

  const openCreate = useCallback(() => { setEditing(null); setFormData(empty); setDialogOpen(true); }, []);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreate();
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, openCreate]);
  const openEdit = (c) => {
    setEditing(c);
    setFormData({
      ...empty,
      ...c,
      notifyWhatsApp: c.notifyWhatsApp !== false,
      notifyEmail: c.notifyEmail !== false,
    });
    setDialogOpen(true);
  };

  const openLedger = async (c) => {
    setLedger(null); setLedgerOpen(true); setLedgerLoading(true);
    try {
      const res = await customersAPI.getLedger(c.id);
      setLedger(res.data);
    } catch (err) { console.error(err); toast.error('Failed to load ledger'); }
    finally { setLedgerLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await customersAPI.update(editing.id, formData); toast.success('Customer updated'); }
      else {
        const res = await customersAPI.create(formData);
        toast.success('Customer added');
        const created = res.data || {};
        const welcome = openCustomerWelcomeWhatsApp(created);
        if (welcome.ok) toast.message('Welcome WhatsApp opened — tap Send with Customer ID');
      }
      setDialogOpen(false); fetchCustomers();
    } catch (err) { console.error(err); toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try { await customersAPI.delete(id); toast.success('Deleted'); fetchCustomers(); }
    catch (err) { console.error(err); toast.error('Failed to delete'); }
  };

  const sendBalanceRequest = (customer, outstanding) => {
    const amount = Number(outstanding ?? customer?.outstanding ?? 0);
    if (!(amount > 0)) {
      toast.error('No outstanding balance to request');
      return;
    }
    if (!customer?.phone) {
      toast.error('Customer phone required for WhatsApp');
      return;
    }
    setBalanceSending(true);
    try {
      const result = openUrduBalanceWhatsApp(customer, { outstanding: amount });
      if (result?.ok) toast.message('WhatsApp opened — tap Send (Urdu balance reminder)');
      else toast.error('Could not open WhatsApp — check customer phone');
    } finally {
      setBalanceSending(false);
    }
  };

  const openBlockDialog = (c) => {
    setBlockTarget(c);
    setBlockReason('');
    setBlockDialogOpen(true);
  };

  const handleBlock = async () => {
    if (!blockTarget?.id) return;
    const reason = blockReason.trim();
    if (!reason) {
      toast.error('Block reason is required');
      return;
    }
    setBlockSaving(true);
    try {
      await customersAPI.block(blockTarget.id, { blockReason: reason });
      toast.success('Customer blocked');
      setBlockDialogOpen(false);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to block customer');
    } finally {
      setBlockSaving(false);
    }
  };

  const handleUnblock = async (c) => {
    if (!canUnblock) {
      toast.error('Only Admin (Settings access) can unblock — contact Admin');
      return;
    }
    if (!window.confirm(`Unblock ${c.name}?`)) return;
    try {
      await customersAPI.unblock(c.id);
      toast.success('Customer unblocked');
      fetchCustomers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to unblock');
    }
  };

  const openCustomerPayment = (c) => {
    setPayCustomer(c);
    setPayData({
      amount: Number(c.outstanding) > 0 ? c.outstanding : '',
      method: 'Cash',
      notes: '',
      date: new Date().toISOString().slice(0, 10),
      reference: '',
    });
  };

  const saveCustomerPayment = async (e) => {
    e.preventDefault();
    if (!payCustomer?.id) return;
    const amount = Number(payData.amount) || 0;
    if (!(amount > 0)) {
      toast.error('Enter a valid amount');
      return;
    }
    setPaySaving(true);
    try {
      const payload = {
        amount,
        method: payData.method,
        notes: payData.notes,
        date: payData.date,
        reference: payData.reference,
      };
      if (payData.reference?.trim()) {
        if (/^inv/i.test(payData.reference.trim())) payload.linkedInvoiceId = payData.reference.trim();
        else payload.linkedOrderId = payData.reference.trim();
      }
      const res = await customersAPI.recordPayment(payCustomer.id, payload);
      const data = res.data || {};
      await finishPaymentRecording(data.payment || data, {
        company,
        extras: {
          customerName: payCustomer.name,
          customerPhone: payCustomer.phone,
          customerEmail: payCustomer.email,
          reference: payData.reference,
        },
        notify: true,
        sendEmail: false,
      });
      if (Number(data.extra) > 0 || Number(data.creditBalance) > 0) {
        toast.message(`Credit balance: ${formatCurrency(data.creditBalance || data.extra)}`);
      }
      toast.success('Payment recorded');
      setPayCustomer(null);
      fetchCustomers();
      if (ledgerOpen && ledger?.customer?.id === payCustomer.id) {
        const lr = await customersAPI.getLedger(payCustomer.id);
        setLedger(lr.data);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Payment failed');
    } finally {
      setPaySaving(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="customers-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#1F2937' }}>Customer Portal</h1>
          <p className="text-gray-600 mt-1">Complete customer directory with order history, ledger & running balance</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/crm')} data-testid="open-crm-button">
            <Kanban className="h-4 w-4 mr-2" />Open CRM
          </Button>
          <Button onClick={openCreate} style={{ backgroundColor: '#ff6d00' }} className="text-white" data-testid="add-customer-button">
            <Plus className="h-4 w-4 mr-2" />Add Customer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#ff6d00' }}><User className="h-5 w-5 text-white" /></div>
          <div><p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Total Customers</p><p className="text-lg font-bold">{customers.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#10B981' }}><TrendingUp className="h-5 w-5 text-white" /></div>
          <div><p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Active</p><p className="text-lg font-bold text-emerald-700">{customers.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#8B5CF6' }}><BookOpen className="h-5 w-5 text-white" /></div>
          <div><p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">With Balance</p><p className="text-lg font-bold">{withBalanceCount}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-100"><ShieldBan className="h-5 w-5 text-red-700" /></div>
          <div><p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Blocked</p><p className="text-lg font-bold text-red-700">{blockedCount}</p></div>
        </CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input placeholder="Search by name, phone, or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" data-testid="customer-search" />
          </div>
          <SortBar value={sort} onChange={setSort} options={CUSTOMER_SORT_OPTS} className="w-full sm:w-auto sm:min-w-[280px]" />
        </div>
      </CardContent></Card>

      <Card>
        <CardHeader><CardTitle>Customer Directory</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-gray-500">Loading...</div>
            : sorted.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">No customers yet.</p>
                <Button onClick={openCreate} style={{ backgroundColor: '#ff6d00' }} className="text-white"><Plus className="h-4 w-4 mr-2" />Add First Customer</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sorted.map(c => (
                  <div key={c.id} className={`bg-white border rounded-xl p-4 hover:shadow-md transition-all ${isCustomerBlocked(c) ? 'border-red-200 bg-red-50/30' : 'border-gray-100 hover:border-orange-200'}`} data-testid={`customer-card-${c.id}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: isCustomerBlocked(c) ? '#FEE2E2' : '#FFF4EB' }}>
                        <User className="h-5 w-5" style={{ color: isCustomerBlocked(c) ? '#DC2626' : '#ff6d00' }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold truncate" style={{ color: '#1F2937' }}>{c.name}</h3>
                          {isCustomerBlocked(c) && <Badge className="bg-red-100 text-red-800 text-[10px]">Blocked</Badge>}
                        </div>
                        <p className="text-[10px] font-mono text-orange-700">ID: {customerDisplayCode(c)}</p>
                        {c.city && <p className="text-xs text-gray-500">{c.city}</p>}
                        {Number(c.outstanding) > 0 && (
                          <p className="text-xs font-semibold text-rose-600 mt-0.5">Balance: {formatCurrency(c.outstanding)}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600 mb-3">
                      {c.phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{c.phone}</p>}
                      {c.email && <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{c.email}</p>}
                      {c.address && <p className="flex items-start gap-1.5"><MapPin className="h-3 w-3 mt-0.5 shrink-0" /><span className="truncate">{c.address}</span></p>}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <Button size="sm" className="flex-1 text-white h-8 text-xs min-w-[40%]" style={{ backgroundColor: '#ff6d00' }} onClick={() => openLedger(c)} data-testid={`ledger-${c.id}`}>
                        <BookOpen className="h-3 w-3 mr-1" />Ledger
                      </Button>
                      {Number(c.outstanding) > 0 && c.phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 text-xs text-green-700 border-green-200 min-w-[40%]"
                          disabled={balanceSending}
                          onClick={() => sendBalanceRequest(c, c.outstanding)}
                          data-testid={`balance-wa-${c.id}`}
                        >
                          <WhatsAppIcon className="h-3 w-3 mr-1" />باقی رقم (WhatsApp)
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-emerald-700 border-emerald-200"
                        onClick={() => openCustomerPayment(c)}
                        data-testid={`pay-customer-${c.id}`}
                      >
                        <Wallet className="h-3 w-3 mr-1" />Record payment
                      </Button>
                      {isCustomerBlocked(c) ? (
                        canUnblock && (
                          <Button size="sm" variant="outline" className="h-8 text-xs text-emerald-700" onClick={() => handleUnblock(c)} data-testid={`unblock-${c.id}`}>
                            <ShieldCheck className="h-3 w-3 mr-1" />Unblock
                          </Button>
                        )
                      ) : (
                        <Button size="sm" variant="outline" className="h-8 text-xs text-red-700 border-red-200" onClick={() => openBlockDialog(c)} data-testid={`block-${c.id}`}>
                          <ShieldBan className="h-3 w-3 mr-1" />Block
                        </Button>
                      )}
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => openEdit(c)} data-testid={`edit-customer-${c.id}`}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(c.id)} data-testid={`delete-customer-${c.id}`}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" data-testid="customer-dialog">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editing ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
            <DialogDescription>Contact details are saved to the customer portal and reused across invoices.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 mt-3">
            <div><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required data-testid="customer-name-input" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            </div>
            <div><Label>Address</Label><Textarea rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
            <div><Label>City</Label><Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></div>
            <div><Label>Notes</Label><Textarea rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
            <div className="rounded-lg border p-3 space-y-3" style={{ backgroundColor: '#FFF6ED' }}>
              <p className="text-sm font-semibold flex items-center gap-2" style={{ color: '#0747a3' }}>
                <Bell className="h-4 w-4" style={{ color: '#ff6d00' }} /> Notification preferences
              </p>
              <div className="flex items-center justify-between">
                <Label>WhatsApp notifications</Label>
                <Switch
                  checked={formData.notifyWhatsApp !== false}
                  onCheckedChange={(v) => setFormData({ ...formData, notifyWhatsApp: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Email notifications</Label>
                <Switch
                  checked={formData.notifyEmail !== false}
                  onCheckedChange={(v) => setFormData({ ...formData, notifyEmail: v })}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}><X className="h-4 w-4 mr-1" />Cancel</Button>
              <Button type="submit" style={{ backgroundColor: '#ff6d00' }} className="text-white" disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? 'Saving...' : editing ? 'Update' : 'Add'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ledger dialog */}
      <Dialog open={ledgerOpen} onOpenChange={setLedgerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="ledger-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" style={{ color: '#ff6d00' }} />
              Customer Ledger — {ledger?.customer?.name || '...'}
            </DialogTitle>
            <DialogDescription>
              {ledger?.customer ? `Customer ID: ${customerDisplayCode(ledger.customer)}` : 'Orders, invoices and payments recorded against this customer.'}
            </DialogDescription>
          </DialogHeader>
          {ledgerLoading ? <div className="text-center py-8 text-gray-500">Loading ledger...</div>
            : !ledger ? <div className="text-center py-8 text-gray-500">No data</div>
            : (
              <div className="space-y-4 mt-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#FFF4EB' }}>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Total Billed</p>
                    <p className="text-lg font-bold" style={{ color: '#ff6d00' }}>{formatCurrency(ledger.totalBilled)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Total Paid</p>
                    <p className="text-lg font-bold text-emerald-700">{formatCurrency(ledger.totalPaid)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-50">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Outstanding</p>
                    <p className={`text-lg font-bold ${ledger.outstanding > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{formatCurrency(ledger.outstanding)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-sky-50">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Credit</p>
                    <p className="text-lg font-bold text-sky-700">{formatCurrency(ledger.creditBalance || ledger.customer?.creditBalance || 0)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" className="text-white" style={{ backgroundColor: '#ff6d00' }} onClick={() => openCustomerPayment(ledger.customer)}>
                    <Wallet className="h-4 w-4 mr-2" />Record payment
                  </Button>
                  {ledger.outstanding > 0 && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="text-green-700 border-green-200"
                        disabled={balanceSending}
                        onClick={() => sendBalanceRequest(ledger.customer, ledger.outstanding)}
                        data-testid="send-balance-request"
                      >
                        <WhatsAppIcon className="h-4 w-4 mr-2" />
                        {balanceSending ? 'Opening…' : 'باقی رقم — WhatsApp (Urdu)'}
                      </Button>
                      <p className="text-xs text-gray-500 self-center">WhatsApp only — Urdu balance reminder</p>
                    </>
                  )}
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-[10px] uppercase tracking-wider text-gray-500">
                        <th className="text-left py-2 px-2 font-semibold">Date</th>
                        <th className="text-left py-2 px-2 font-semibold">Particulars</th>
                        <th className="text-left py-2 px-2 font-semibold">Ref</th>
                        <th className="text-right py-2 px-2 font-semibold">Debit</th>
                        <th className="text-right py-2 px-2 font-semibold">Credit</th>
                        <th className="text-right py-2 px-2 font-semibold">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(ledger.statement || []).length === 0 ? (
                        <tr><td colSpan={6} className="py-8 text-center text-gray-500 text-sm">No transactions yet.</td></tr>
                      ) : ledger.statement.map((line, i) => (
                        <tr key={`${line.date}-${line.reference}-${i}`} className="border-b last:border-0">
                          <td className="py-2 px-2 text-gray-600 whitespace-nowrap">{formatDate(line.date)}</td>
                          <td className="py-2 px-2">
                            <p className="font-medium text-gray-800">{line.particular}</p>
                            {line.method ? <p className="text-[11px] text-gray-400">{line.method}</p> : null}
                          </td>
                          <td className="py-2 px-2 text-xs" style={{ color: '#ff6d00' }}>{line.reference || line.invoiceNumber || '—'}</td>
                          <td className="py-2 px-2 text-right text-rose-600">{line.debit ? formatCurrency(line.debit) : '—'}</td>
                          <td className="py-2 px-2 text-right text-emerald-700">{line.credit ? formatCurrency(line.credit) : '—'}</td>
                          <td className={`py-2 px-2 text-right font-semibold ${Number(line.balance) > 0 ? 'text-gray-900' : 'text-emerald-700'}`}>{formatCurrency(line.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!payCustomer} onOpenChange={(open) => { if (!open && !paySaving) setPayCustomer(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Customer Payment</DialogTitle>
            <DialogDescription>{payCustomer?.name} · {customerDisplayCode(payCustomer)}</DialogDescription>
          </DialogHeader>
          {payCustomer && (
            <form onSubmit={saveCustomerPayment} className="space-y-3 mt-2">
              <div>
                <Label>Date</Label>
                <Input type="date" value={payData.date} onChange={(e) => setPayData((p) => ({ ...p, date: e.target.value }))} required />
              </div>
              <div>
                <Label>Amount *</Label>
                <Input type="number" min="0.01" step="0.01" value={payData.amount} onChange={(e) => setPayData((p) => ({ ...p, amount: e.target.value }))} required />
              </div>
              <div>
                <Label>Invoice or order # (optional)</Label>
                <Input value={payData.reference} onChange={(e) => setPayData((p) => ({ ...p, reference: e.target.value }))} placeholder="INV-… or ORD-… (blank = customer credit)" />
                <p className="text-[11px] text-gray-500 mt-1">An order number creates or links an invoice before the payment is saved.</p>
              </div>
              <div>
                <Label>Method</Label>
                <Select value={payData.method} onValueChange={(method) => setPayData((p) => ({ ...p, method }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Cash', 'Bank Transfer', 'UPI', 'Card', 'Cheque'].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={payData.notes} onChange={(e) => setPayData((p) => ({ ...p, notes: e.target.value }))} />
              </div>
              <p className="text-xs text-gray-500">Extra amount is saved as customer credit for future invoices/orders.</p>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setPayCustomer(null)} disabled={paySaving}>Cancel</Button>
                <Button type="submit" className="text-white" style={{ backgroundColor: '#ff6d00' }} disabled={paySaving}>
                  <Wallet className="h-4 w-4 mr-1" />{paySaving ? 'Saving…' : 'Record & print receipt'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-md" data-testid="block-customer-dialog">
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <ShieldBan className="h-5 w-5" />Block Customer
            </DialogTitle>
            <DialogDescription>
              {blockTarget?.name} ({customerDisplayCode(blockTarget)}) will not be able to book orders or tokens. Contact Admin to unblock.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Reason for blocking *</Label>
            <Textarea
              rows={3}
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="e.g. Repeated non-payment, abusive behaviour…"
              className="mt-1"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setBlockDialogOpen(false)}>Cancel</Button>
            <Button type="button" className="bg-red-600 text-white hover:bg-red-700" disabled={blockSaving} onClick={handleBlock}>
              {blockSaving ? 'Blocking…' : 'Block Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
