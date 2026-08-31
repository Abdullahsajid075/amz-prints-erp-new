import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { customersAPI } from '@/services/api';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/helpers';
import { customerMatchesQuery } from '@/utils/customerSearch';
import { sortBy } from '@/utils/sortBy';
import SortBar from '@/components/shared/SortBar';
import { Plus, Search, Edit, Trash2, User, Phone, Mail, MapPin, FileText, Receipt, CreditCard, TrendingUp, X, Save, BookOpen, Bell, Kanban, MessageCircle, Ban, ShieldCheck, Hash, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { openWhatsAppChat } from '@/services/notifications';
import { buildWelcomeMessage, buildReminderMessage } from '@/utils/customerMessages';
import { isAdmin } from '@/utils/roles';

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
  const admin = isAdmin(user);
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
  const [blockOpen, setBlockOpen] = useState(false);
  const [blockTarget, setBlockTarget] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [blocking, setBlocking] = useState(false);

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

  const stats = useMemo(() => {
    let withBalance = 0;
    let totalReceivable = 0;
    let blocked = 0;
    customers.forEach((c) => {
      const out = Number(c.outstanding || 0);
      if (out > 0) { withBalance += 1; totalReceivable += out; }
      if (c.blocked) blocked += 1;
    });
    return { withBalance, totalReceivable, blocked, active: customers.length - blocked };
  }, [customers]);

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

  // Feature: WhatsApp-only Urdu reminder for customers with a pending/receivable balance.
  const sendReminder = (c) => {
    const outstanding = Number(c.outstanding || 0);
    if (!c.phone) { toast.error('This customer has no phone number for WhatsApp'); return; }
    if (outstanding <= 0) { toast.info('No pending amount for this customer'); return; }
    const msg = buildReminderMessage(c, outstanding);
    const r = openWhatsAppChat(c.phone, msg);
    if (r?.ok) toast.success('WhatsApp reminder opened'); else toast.error('Could not open WhatsApp');
  };

  const openBlock = (c) => { setBlockTarget(c); setBlockReason(''); setBlockOpen(true); };

  const confirmBlock = async () => {
    if (!blockTarget) return;
    const reason = blockReason.trim();
    if (!reason) { toast.error('Please enter a reason for blocking'); return; }
    setBlocking(true);
    try {
      await customersAPI.block(blockTarget.id, reason);
      toast.success('Customer blocked');
      setBlockOpen(false); setBlockTarget(null); setBlockReason('');
      fetchCustomers();
    } catch (err) { console.error(err); toast.error(err.response?.data?.message || 'Failed to block'); }
    finally { setBlocking(false); }
  };

  const handleUnblock = async (c) => {
    if (!admin) { toast.error('Only an Admin can unblock a customer. Please contact your Admin.'); return; }
    if (!window.confirm(`Unblock ${c.name}? They will be able to place orders again.`)) return;
    try {
      await customersAPI.unblock(c.id);
      toast.success('Customer unblocked');
      fetchCustomers();
    } catch (err) { console.error(err); toast.error(err.response?.data?.message || 'Failed to unblock'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    // Pre-open a window on the user gesture so the welcome WhatsApp survives the async create.
    let pending = null;
    if (!editing) {
      try { pending = window.open('', '_blank'); } catch { pending = null; }
    }
    setSaving(true);
    try {
      if (editing) {
        await customersAPI.update(editing.id, formData);
        toast.success('Customer updated');
      } else {
        const res = await customersAPI.create(formData);
        const created = res.data || {};
        toast.success(created.customerCode ? `Customer added (ID: ${created.customerCode})` : 'Customer added');
        // First-time registration: send welcome + office ID over WhatsApp.
        const wantsWhatsApp = created.notifyWhatsApp !== false && formData.notifyWhatsApp !== false;
        if (created._isNew && created.phone && wantsWhatsApp) {
          openWhatsAppChat(created.phone, buildWelcomeMessage(created), { pendingWindow: pending });
          pending = null;
        }
      }
      setDialogOpen(false); fetchCustomers();
    } catch (err) { console.error(err); toast.error(err.response?.data?.message || 'Failed to save'); }
    finally {
      setSaving(false);
      if (pending && !pending.closed) { try { pending.close(); } catch { /* ignore */ } }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try { await customersAPI.delete(id); toast.success('Deleted'); fetchCustomers(); }
    catch (err) { console.error(err); toast.error('Failed to delete'); }
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
          <Button onClick={openCreate} style={{ backgroundColor: '#F26522' }} className="text-white" data-testid="add-customer-button">
            <Plus className="h-4 w-4 mr-2" />Add Customer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F26522' }}><User className="h-5 w-5 text-white" /></div>
          <div><p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Total Customers</p><p className="text-lg font-bold">{customers.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: stats.blocked ? '#EF4444' : '#10B981' }}>{stats.blocked ? <Ban className="h-5 w-5 text-white" /> : <TrendingUp className="h-5 w-5 text-white" />}</div>
          <div><p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Active / Blocked</p><p className="text-lg font-bold text-emerald-700">{stats.active}{stats.blocked ? <span className="text-rose-600"> / {stats.blocked}</span> : ''}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#8B5CF6' }}><BookOpen className="h-5 w-5 text-white" /></div>
          <div><p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">With Balance</p><p className="text-lg font-bold">{stats.withBalance || 0}</p>{stats.totalReceivable > 0 && <p className="text-[11px] text-rose-600 font-semibold">{formatCurrency(stats.totalReceivable)}</p>}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#3B82F6' }}><MapPin className="h-5 w-5 text-white" /></div>
          <div><p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Cities</p><p className="text-lg font-bold">{new Set(customers.map(c => c.city).filter(Boolean)).size || '—'}</p></div>
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
                <Button onClick={openCreate} style={{ backgroundColor: '#F26522' }} className="text-white"><Plus className="h-4 w-4 mr-2" />Add First Customer</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sorted.map(c => {
                  const outstanding = Number(c.outstanding || 0);
                  return (
                  <div key={c.id} className={`bg-white border rounded-xl p-4 hover:shadow-md transition-all ${c.blocked ? 'border-rose-300 bg-rose-50/40' : 'border-gray-100 hover:border-orange-200'}`} data-testid={`customer-card-${c.id}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: c.blocked ? '#FEE2E2' : '#FFF3ED' }}>
                        <User className="h-5 w-5" style={{ color: c.blocked ? '#DC2626' : '#F26522' }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold truncate" style={{ color: '#1F2937' }}>{c.name}</h3>
                          {c.blocked && <Badge className="bg-rose-100 text-rose-700 text-[10px] gap-1"><Ban className="h-3 w-3" />Blocked</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {c.customerCode && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600"><Hash className="h-3 w-3" style={{ color: '#F26522' }} />{c.customerCode}</span>}
                          {c.city && <span className="text-xs text-gray-500">{c.city}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600 mb-3">
                      {c.phone && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{c.phone}</p>}
                      {c.email && <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" />{c.email}</p>}
                      {c.address && <p className="flex items-start gap-1.5"><MapPin className="h-3 w-3 mt-0.5 shrink-0" /><span className="truncate">{c.address}</span></p>}
                    </div>
                    {outstanding > 0 && (
                      <div className="mb-3 flex items-center justify-between rounded-lg bg-rose-50 border border-rose-100 px-2.5 py-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-rose-600">Pending</span>
                        <span className="text-sm font-bold text-rose-700">{formatCurrency(outstanding)}</span>
                      </div>
                    )}
                    {c.blocked && c.blockReason && (
                      <p className="mb-3 flex items-start gap-1.5 text-[11px] text-rose-700 bg-rose-50 border border-rose-100 rounded-md px-2 py-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span>Reason: {c.blockReason}</span>
                      </p>
                    )}
                    <div className="space-y-1.5">
                      <div className="flex gap-1">
                        <Button size="sm" className="flex-1 text-white h-8 text-xs" style={{ backgroundColor: '#F26522' }} onClick={() => openLedger(c)} data-testid={`ledger-${c.id}`}>
                          <BookOpen className="h-3 w-3 mr-1" />Ledger
                        </Button>
                        <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => openEdit(c)} data-testid={`edit-customer-${c.id}`}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(c.id)} data-testid={`delete-customer-${c.id}`}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>
                      </div>
                      {outstanding > 0 && (
                        <Button size="sm" className="w-full h-8 text-xs text-white bg-[#25D366] hover:bg-[#1EBE5A]" onClick={() => sendReminder(c)} data-testid={`remind-${c.id}`}>
                          <MessageCircle className="h-3.5 w-3.5 mr-1" />بقایا رقم کی یاد دہانی (WhatsApp)
                        </Button>
                      )}
                      {c.blocked ? (
                        <Button size="sm" variant="outline" className="w-full h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50" onClick={() => handleUnblock(c)} data-testid={`unblock-${c.id}`}>
                          <ShieldCheck className="h-3.5 w-3.5 mr-1" />{admin ? 'Unblock' : 'Unblock (Admin only)'}
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="w-full h-8 text-xs border-rose-300 text-rose-700 hover:bg-rose-50" onClick={() => openBlock(c)} data-testid={`block-${c.id}`}>
                          <Ban className="h-3.5 w-3.5 mr-1" />Block Customer
                        </Button>
                      )}
                    </div>
                  </div>
                  );
                })}
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
            <div className="rounded-lg border p-3 space-y-3" style={{ backgroundColor: '#FFF9F5' }}>
              <p className="text-sm font-semibold flex items-center gap-2" style={{ color: '#2E2E2E' }}>
                <Bell className="h-4 w-4" style={{ color: '#F26522' }} /> Notification preferences
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
              <Button type="submit" style={{ backgroundColor: '#F26522' }} className="text-white" disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? 'Saving...' : editing ? 'Update' : 'Add'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ledger dialog */}
      <Dialog open={ledgerOpen} onOpenChange={setLedgerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="ledger-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" style={{ color: '#F26522' }} />
              Customer Ledger — {ledger?.customer?.name || '...'}
            </DialogTitle>
            <DialogDescription>Orders, invoices and payments recorded against this customer.</DialogDescription>
          </DialogHeader>
          {ledgerLoading ? <div className="text-center py-8 text-gray-500">Loading ledger...</div>
            : !ledger ? <div className="text-center py-8 text-gray-500">No data</div>
            : (
              <div className="space-y-4 mt-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#FFF3ED' }}>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Total Billed</p>
                    <p className="text-lg font-bold" style={{ color: '#F26522' }}>{formatCurrency(ledger.totalBilled)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Total Paid</p>
                    <p className="text-lg font-bold text-emerald-700">{formatCurrency(ledger.totalPaid)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-50">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Outstanding</p>
                    <p className={`text-lg font-bold ${ledger.outstanding > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{formatCurrency(ledger.outstanding)}</p>
                  </div>
                </div>
                <Tabs defaultValue="invoices">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="invoices"><Receipt className="h-3 w-3 mr-1" />Invoices ({ledger.invoices.length})</TabsTrigger>
                    <TabsTrigger value="orders"><FileText className="h-3 w-3 mr-1" />Orders ({ledger.orders.length})</TabsTrigger>
                    <TabsTrigger value="payments"><CreditCard className="h-3 w-3 mr-1" />Payments ({ledger.payments.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="invoices">
                    {ledger.invoices.length === 0 ? <p className="text-center py-6 text-gray-500 text-sm">No invoices yet.</p> : (
                      <table className="w-full text-sm">
                        <thead><tr className="border-b bg-gray-50"><th className="text-left py-2 px-2 text-xs uppercase text-gray-600">Invoice</th><th className="text-left py-2 px-2 text-xs uppercase text-gray-600">Date</th><th className="text-right py-2 px-2 text-xs uppercase text-gray-600">Total</th><th className="text-right py-2 px-2 text-xs uppercase text-gray-600">Paid</th><th className="text-left py-2 px-2 text-xs uppercase text-gray-600">Status</th></tr></thead>
                        <tbody>{ledger.invoices.map(inv => (<tr key={inv.id} className="border-b"><td className="py-2 px-2 font-semibold" style={{ color: '#F26522' }}>{inv.invoiceNumber}</td><td className="py-2 px-2 text-gray-600">{formatDate(inv.date)}</td><td className="py-2 px-2 text-right font-semibold">{formatCurrency(inv.totalAmount)}</td><td className="py-2 px-2 text-right text-emerald-700">{formatCurrency(inv.paidAmount || 0)}</td><td className="py-2 px-2"><Badge className={`${inv.status === 'Paid' ? 'bg-green-100 text-green-800' : inv.status === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'} text-[10px]`}>{inv.status}</Badge></td></tr>))}</tbody>
                      </table>
                    )}
                  </TabsContent>
                  <TabsContent value="orders">
                    {ledger.orders.length === 0 ? <p className="text-center py-6 text-gray-500 text-sm">No orders yet.</p> : (
                      <table className="w-full text-sm">
                        <thead><tr className="border-b bg-gray-50"><th className="text-left py-2 px-2 text-xs uppercase text-gray-600">Order</th><th className="text-left py-2 px-2 text-xs uppercase text-gray-600">Date</th><th className="text-right py-2 px-2 text-xs uppercase text-gray-600">Amount</th><th className="text-left py-2 px-2 text-xs uppercase text-gray-600">Status</th></tr></thead>
                        <tbody>{ledger.orders.map(o => (<tr key={o.id} className="border-b"><td className="py-2 px-2 font-semibold">{o.orderId}</td><td className="py-2 px-2 text-gray-600">{formatDate(o.date)}</td><td className="py-2 px-2 text-right font-semibold">{formatCurrency(o.totalAmount)}</td><td className="py-2 px-2"><Badge className={`${getStatusColor(o.status)} text-[10px]`}>{o.status}</Badge></td></tr>))}</tbody>
                      </table>
                    )}
                  </TabsContent>
                  <TabsContent value="payments">
                    {ledger.payments.length === 0 ? <p className="text-center py-6 text-gray-500 text-sm">No payments recorded yet.</p> : (
                      <table className="w-full text-sm">
                        <thead><tr className="border-b bg-gray-50"><th className="text-left py-2 px-2 text-xs uppercase text-gray-600">Date</th><th className="text-left py-2 px-2 text-xs uppercase text-gray-600">Reference</th><th className="text-left py-2 px-2 text-xs uppercase text-gray-600">Method</th><th className="text-right py-2 px-2 text-xs uppercase text-gray-600">Amount</th></tr></thead>
                        <tbody>{ledger.payments.map(p => (<tr key={p.id} className="border-b"><td className="py-2 px-2 text-gray-600">{formatDate(p.date)}</td><td className="py-2 px-2 text-xs" style={{ color: '#F26522' }}>{p.reference || '-'}</td><td className="py-2 px-2"><Badge variant="outline" className="text-[10px]">{p.method}</Badge></td><td className={`py-2 px-2 text-right font-bold ${p.type === 'inflow' ? 'text-emerald-700' : 'text-rose-600'}`}>{p.type === 'inflow' ? '+' : '-'}{formatCurrency(p.amount)}</td></tr>))}</tbody>
                      </table>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
        </DialogContent>
      </Dialog>

      {/* Block customer dialog */}
      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent className="max-w-md" data-testid="block-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700"><Ban className="h-5 w-5" />Block {blockTarget?.name || 'Customer'}</DialogTitle>
            <DialogDescription>
              A blocked customer cannot place any orders or use our services. The reason is recorded and shown during order booking. Unblocking requires an Admin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            <Label>Reason for blocking *</Label>
            <Textarea
              rows={3}
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="e.g. Unpaid dues, repeated cancellations, misconduct…"
              data-testid="block-reason-input"
            />
          </div>
          <DialogFooter className="gap-2 pt-3">
            <Button type="button" variant="outline" onClick={() => setBlockOpen(false)}><X className="h-4 w-4 mr-1" />Cancel</Button>
            <Button type="button" className="bg-rose-600 hover:bg-rose-700 text-white" disabled={blocking} onClick={confirmBlock} data-testid="confirm-block">
              <Ban className="h-4 w-4 mr-1" />{blocking ? 'Blocking…' : 'Block Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
