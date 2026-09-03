import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { vendorsAPI, purchasesAPI } from '@/services/api';
import { formatCurrency } from '@/utils/helpers';
import { sortBy } from '@/utils/sortBy';
import SortBar from '@/components/shared/SortBar';
import { useAuth } from '@/context/AuthContext';
import { aggregateVendorPurchases, canAccessVendors, canManageVendors } from '@/utils/vendorPayables';
import { Plus, Search, Edit, Trash2, Building2, Phone, Mail, MapPin, TrendingUp, Package, AlertCircle, X, Save, Shield } from 'lucide-react';
import { toast } from 'sonner';

const VENDOR_SORT_OPTS = [
  { value: 'name', label: 'Name' },
  { value: 'phone', label: 'Phone' },
  { value: 'city', label: 'City' },
];

const emptyVendor = { name: '', contactPerson: '', phone: '', email: '', address: '', category: 'Materials', paymentTerms: 'Net 30', taxId: '', notes: '' };
const CATEGORIES = ['Materials', 'Ink & Toner', 'Machinery', 'Outsourced Printing', 'Packaging', 'Services', 'Other'];
const PAYMENT_TERMS = ['Cash on Delivery', 'Net 7', 'Net 15', 'Net 30', 'Net 60', 'Net 90', 'Advance'];

const Vendors = () => {
  const { user } = useAuth();
  const allowed = canAccessVendors(user);
  const canManage = canManageVendors(user);
  const [searchParams, setSearchParams] = useSearchParams();
  const [vendors, setVendors] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ field: 'name', dir: 'asc' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyVendor);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, pRes] = await Promise.all([
        vendorsAPI.getAll(),
        purchasesAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setVendors(vRes.data || []);
      setPurchases(Array.isArray(pRes.data) ? pRes.data : []);
    } catch (err) {
      console.error('Failed to fetch vendors', err);
      setVendors([]);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (allowed) fetchAll();
  }, [allowed, fetchAll]);

  const aggregates = useMemo(() => aggregateVendorPurchases(purchases), [purchases]);

  const enriched = useMemo(() => vendors.map((v) => {
    const byId = aggregates[String(v.id)] || {};
    const byName = aggregates[String(v.name || '').trim()] || {};
    return {
      ...v,
      totalPurchases: Number(byId.totalPurchases || byName.totalPurchases || v.totalPurchases || 0),
      outstandingBalance: Number(byId.outstandingBalance || byName.outstandingBalance || v.outstandingBalance || 0),
    };
  }), [vendors, aggregates]);

  const filtered = enriched.filter((v) =>
    !search
    || v.name?.toLowerCase().includes(search.toLowerCase())
    || v.contactPerson?.toLowerCase().includes(search.toLowerCase())
    || v.phone?.includes(search)
  );

  const sorted = useMemo(() => sortBy(filtered, sort, {
    name: (v) => v.name || '',
    phone: (v) => v.phone || '',
    city: (v) => v.city || '',
  }), [filtered, sort]);

  const stats = {
    total: enriched.length,
    totalOutstanding: enriched.reduce((s, v) => s + (v.outstandingBalance || 0), 0),
    totalPurchases: enriched.reduce((s, v) => s + (v.totalPurchases || 0), 0),
    active: enriched.filter((v) => (v.totalPurchases || 0) > 0).length,
  };

  const openCreate = useCallback(() => {
    if (!canManage) {
      toast.error('You do not have permission to add vendors');
      return;
    }
    setEditing(null);
    setFormData(emptyVendor);
    setDialogOpen(true);
  }, [canManage]);

  const openEdit = (v) => {
    if (!canManage) {
      toast.error('You do not have permission to edit vendors');
      return;
    }
    setEditing(v);
    setFormData(v);
    setDialogOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreate();
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, openCreate]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    setSaving(true);
    try {
      if (editing) {
        await vendorsAPI.update(editing.id, formData);
        toast.success('Updated');
      } else {
        await vendorsAPI.create(formData);
        toast.success('Vendor added');
      }
      setDialogOpen(false);
      fetchAll();
    } catch {
      toast.error('Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canManage) {
      toast.error('Only Admin / Accounts can delete vendors');
      return;
    }
    if (!window.confirm('Delete this vendor? This cannot be undone.')) return;
    try {
      await vendorsAPI.delete(id);
      toast.success('Deleted');
      fetchAll();
    } catch {
      toast.error('Failed');
    }
  };

  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6" data-testid="vendors-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>Vendors</h1>
          <p className="text-gray-600 mt-1">Suppliers, payables & purchase history</p>
          <p className="text-xs text-amber-700 mt-1 flex items-center gap-1">
            <Shield className="h-3.5 w-3.5" />
            Restricted — Admin / Accounts / Manager only
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate} style={{ backgroundColor: '#ff6d00' }} className="text-white" data-testid="add-vendor-button">
            <Plus className="h-4 w-4 mr-2" />Add Vendor
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#ff6d00' }}><Building2 className="h-6 w-6 text-white" /></div>
          <div><p className="text-xs text-gray-500 uppercase font-medium">Total Vendors</p><p className="text-2xl font-bold">{stats.total}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#10B981' }}><TrendingUp className="h-6 w-6 text-white" /></div>
          <div><p className="text-xs text-gray-500 uppercase font-medium">Active</p><p className="text-2xl font-bold">{stats.active}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#8B5CF6' }}><Package className="h-6 w-6 text-white" /></div>
          <div><p className="text-xs text-gray-500 uppercase font-medium">Total Purchases</p><p className="text-xl font-bold">{formatCurrency(stats.totalPurchases)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EF4444' }}><AlertCircle className="h-6 w-6 text-white" /></div>
          <div><p className="text-xs text-gray-500 uppercase font-medium">Payable to vendors</p><p className="text-xl font-bold text-red-600" data-testid="vendor-total-payable">{formatCurrency(stats.totalOutstanding)}</p></div>
        </CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" data-testid="vendor-search" />
          </div>
          <SortBar value={sort} onChange={setSort} options={VENDOR_SORT_OPTS} className="w-full sm:w-auto sm:min-w-[280px]" />
        </div>
      </CardContent></Card>

      <Card>
        <CardHeader><CardTitle>Vendor Directory</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-gray-500">Loading...</div>
            : sorted.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">No vendors yet.</p>
                {canManage && (
                  <Button onClick={openCreate} style={{ backgroundColor: '#ff6d00' }} className="text-white"><Plus className="h-4 w-4 mr-2" />Add First Vendor</Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sorted.map((v) => (
                  <div key={v.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-orange-300 transition-all" data-testid={`vendor-card-${v.id}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#FFF3ED' }}><Building2 className="h-6 w-6" style={{ color: '#ff6d00' }} /></div>
                        <div>
                          <h3 className="font-bold" style={{ color: '#2E2E2E' }}>{v.name}</h3>
                          <p className="text-xs text-gray-500">{v.contactPerson}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">{v.category}</Badge>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600 mb-3">
                      {v.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{v.phone}</p>}
                      {v.email && <p className="flex items-center gap-1"><Mail className="h-3 w-3" />{v.email}</p>}
                      {v.address && <p className="flex items-start gap-1"><MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />{v.address}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 pb-3 border-b border-gray-100 mb-3">
                      <div><p className="text-xs text-gray-500">Purchases</p><p className="font-bold" style={{ color: '#2E2E2E' }}>{formatCurrency(v.totalPurchases || 0)}</p></div>
                      <div><p className="text-xs text-gray-500">Payable</p><p className="font-bold" style={{ color: (v.outstandingBalance || 0) > 0 ? '#EF4444' : '#10B981' }}>{formatCurrency(v.outstandingBalance || 0)}</p></div>
                    </div>
                    {canManage && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(v)}><Edit className="h-3 w-3 mr-1" />Edit</Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(v.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-2xl font-bold" style={{ color: '#2E2E2E' }}>{editing ? 'Edit Vendor' : 'Add New Vendor'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>Vendor Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required data-testid="vendor-name-input" /></div>
              <div><Label>Contact Person</Label><Input value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} /></div>
              <div><Label>Phone (WhatsApp)</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="03XXXXXXXXX" /></div>
              <div><Label>Email</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
              <div><Label>Tax ID</Label><Input value={formData.taxId} onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} /></div>
              <div className="col-span-2"><Label>Address</Label><Textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} /></div>
              <div><Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Payment Terms</Label>
                <Select value={formData.paymentTerms} onValueChange={(v) => setFormData({ ...formData, paymentTerms: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} /></div>
            </div>
            <DialogFooter className="gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}><X className="h-4 w-4 mr-1" />Cancel</Button>
              <Button type="submit" style={{ backgroundColor: '#ff6d00' }} className="text-white" disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? 'Saving...' : editing ? 'Update' : 'Add'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Vendors;
