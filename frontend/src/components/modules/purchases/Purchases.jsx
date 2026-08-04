import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { purchasesAPI, vendorsAPI, ordersAPI, productsAPI, paymentsAPI } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { Plus, Search, Eye, Edit, Trash2, ShoppingBag, PackageCheck, Paperclip, AlertTriangle, X, Save, FileText, Link2 } from 'lucide-react';
import { toast } from 'sonner';

const PO_STATUS = ['Draft', 'Ordered', 'Partial Paid', 'Fully Paid', 'Received'];

const emptyPurchase = {
  vendorId: '', vendorInvoiceNumber: '',
  purchaseDate: new Date().toISOString().split('T')[0],
  expectedDeliveryDate: '', actualDeliveryDate: '',
  status: 'Draft',
  linkedOrderId: '',
  items: [{ _key: 'i_init', productId: '', name: '', quantity: 1, rate: 0, unit: 'piece' }],
  notes: '', totalAmount: 0, paidAmount: 0
};

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyPurchase);
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, vRes, oRes, prodRes] = await Promise.all([
        purchasesAPI.getAll(),
        vendorsAPI.getAll(),
        ordersAPI.getAll(),
        productsAPI.getAll(),
      ]);
      setPurchases(pRes.data || []);
      setVendors(vRes.data || []);
      setOrders(oRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      console.error('Failed to fetch purchases data', err);
      toast.error('Failed to load purchase data');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = purchases.filter(p => {
    const matchS = !search || p.poNumber?.toLowerCase().includes(search.toLowerCase()) || p.vendorName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchS && matchStatus;
  });

  const isPaidStatus = (s) => s === 'Partial Paid' || s === 'Fully Paid';
  const isUnpaidLike = (s) => !isPaidStatus(s) && s !== 'Received';

  const stats = {
    total: purchases.length,
    pending: purchases.filter(p => p.status !== 'Received').length,
    received: purchases.filter(p => p.status === 'Received').length,
    totalValue: purchases.reduce((s, p) => s + (p.totalAmount || 0), 0),
    unpaid: purchases.filter(p => isUnpaidLike(p.status) || p.status === 'Partial Paid')
      .reduce((s, p) => s + ((p.totalAmount || 0) - (p.paidAmount || 0)), 0)
  };

  const openCreate = () => { setEditing(null); setFormData(emptyPurchase); setDialogOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setFormData({
      ...emptyPurchase,
      ...p,
      items: (p.items?.length ? p.items : emptyPurchase.items).map((it, i) => ({
        ...it,
        _key: it._key || it.id || `i_${i}`,
        productId: it.productId || '',
      })),
      paidAmount: p.paidAmount || 0,
    });
    setDialogOpen(true);
  };
  const openView = (p) => { setViewData(p); setViewOpen(true); };

  const calcTotal = () => formData.items.reduce((s, i) => s + (Number(i.quantity) * Number(i.rate)), 0);

  const updateItem = (i, field, value) => {
    const items = [...formData.items];
    items[i] = { ...items[i], [field]: value };
    setFormData({ ...formData, items });
  };

  const selectProduct = (i, productId) => {
    const product = products.find(p => p.id === productId);
    const items = [...formData.items];
    items[i] = {
      ...items[i],
      productId,
      name: product?.name || items[i].name,
      rate: product?.costPrice ?? product?.purchasePrice ?? items[i].rate,
      unit: product?.unit || items[i].unit || 'piece',
    };
    setFormData({ ...formData, items });
  };

  const addItem = () => setFormData({
    ...formData,
    items: [...formData.items, { _key: `i_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, productId: '', name: '', quantity: 1, rate: 0, unit: 'piece' }],
  });
  const removeItem = (i) => setFormData({ ...formData, items: formData.items.filter((_, x) => x !== i) });

  const applyStockIncrease = async (items) => {
    for (const item of items || []) {
      if (!item.productId) continue;
      const qty = Number(item.quantity) || 0;
      if (qty <= 0) continue;
      try {
        const res = await productsAPI.getById(item.productId);
        const product = res.data;
        if (!product) continue;
        const nextStock = (Number(product.stock) || 0) + qty;
        await productsAPI.update(item.productId, { ...product, stock: nextStock });
      } catch (err) {
        console.error('Stock update failed for', item.productId, err);
        toast.error(`Stock update failed for ${item.name || item.productId}`);
      }
    }
  };

  const createVendorPayment = async ({ vendorName, amount, refId, poNumber }) => {
    if (!paymentsAPI?.create || !(Number(amount) > 0)) return;
    try {
      await paymentsAPI.create({
        type: 'vendor',
        amount: Number(amount),
        vendorName: vendorName || '',
        refId: refId || poNumber || '',
        date: new Date().toISOString().split('T')[0],
        category: 'Purchase Payment',
        method: 'Cash',
        party: vendorName || '',
        reference: poNumber || refId || '',
        notes: `Auto from purchase ${poNumber || refId || ''}`,
      });
    } catch (err) {
      console.error('Payment create failed', err);
      toast.error('Purchase saved but payment record failed');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const vendor = vendors.find(v => v.id === formData.vendorId);
    const totalAmount = calcTotal();
    let paidAmount = Number(formData.paidAmount) || 0;
    if (formData.status === 'Fully Paid') paidAmount = totalAmount;
    const payload = {
      ...formData,
      vendorName: vendor?.name,
      totalAmount,
      paidAmount,
      paymentStatus: formData.status === 'Fully Paid' ? 'Paid'
        : formData.status === 'Partial Paid' ? 'Partially Paid'
          : formData.status === 'Received' && paidAmount >= totalAmount ? 'Paid'
            : paidAmount > 0 ? 'Partially Paid' : 'Unpaid',
      actualDeliveryDate: formData.status === 'Received'
        ? (formData.actualDeliveryDate || new Date().toISOString().split('T')[0])
        : formData.actualDeliveryDate,
    };
    try {
      let saved;
      const wasReceived = editing?.status === 'Received';
      if (editing) {
        const res = await purchasesAPI.update(editing.id, payload);
        saved = res.data || { ...editing, ...payload };
        toast.success('Updated');
      } else {
        const res = await purchasesAPI.create(payload);
        saved = res.data || payload;
        toast.success('Purchase order created');
      }

      if (isPaidStatus(formData.status) && paidAmount > 0) {
        const prevPaid = Number(editing?.paidAmount) || 0;
        const paymentAmount = editing && isPaidStatus(editing.status)
          ? Math.max(0, paidAmount - prevPaid)
          : paidAmount;
        if (paymentAmount > 0) {
          await createVendorPayment({
            vendorName: vendor?.name || payload.vendorName,
            amount: paymentAmount,
            refId: saved?.id || editing?.id,
            poNumber: saved?.poNumber || editing?.poNumber,
          });
        }
      }

      if (formData.status === 'Received' && !wasReceived) {
        await applyStockIncrease(payload.items);
        toast.success('Stock updated for received items');
      }

      setDialogOpen(false);
      fetchAll();
    } catch (err) {
      console.error(err);
      toast.error('Failed');
    } finally { setSaving(false); }
  };

  const markReceived = async (p) => {
    if (!window.confirm('Mark as received? This updates inventory.')) return;
    try {
      await purchasesAPI.update(p.id, {
        ...p,
        status: 'Received',
        actualDeliveryDate: new Date().toISOString().split('T')[0],
      });
      if (p.status !== 'Received') {
        await applyStockIncrease(p.items);
      }
      toast.success('Marked received. Inventory updated.');
      if (p.linkedOrderId) toast.info(`Linked order ${p.linkedOrderId} updated to Ready for Delivery.`);
      fetchAll();
    } catch (err) {
      console.error(err);
      toast.error('Failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this purchase?')) {
      try { await purchasesAPI.delete(id); toast.success('Deleted'); fetchAll(); }
      catch (e) { toast.error('Failed'); }
    }
  };

  const statusColor = (s) => ({
    Draft: 'bg-gray-100 text-gray-800',
    Ordered: 'bg-blue-100 text-blue-800',
    'Partial Paid': 'bg-yellow-100 text-yellow-800',
    'Fully Paid': 'bg-emerald-100 text-emerald-800',
    Received: 'bg-green-100 text-green-800',
    'Purchase Order': 'bg-blue-100 text-blue-800',
    'In Transit': 'bg-yellow-100 text-yellow-800',
  }[s] || 'bg-gray-100');

  return (
    <div className="space-y-6" data-testid="purchases-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>Purchases</h1>
          <p className="text-gray-600 mt-1">Manage purchase orders, deliveries & vendor payments</p>
        </div>
        <Button onClick={openCreate} style={{ backgroundColor: '#F26522' }} className="text-white" data-testid="add-purchase-button"><Plus className="h-4 w-4 mr-2" />New PO</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 uppercase font-medium mb-1">Total POs</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 uppercase font-medium mb-1">Pending</p><p className="text-2xl font-bold text-yellow-600">{stats.pending}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 uppercase font-medium mb-1">Received</p><p className="text-2xl font-bold text-green-600">{stats.received}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 uppercase font-medium mb-1">Total Value</p><p className="text-xl font-bold" style={{ color: '#F26522' }}>{formatCurrency(stats.totalValue)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 uppercase font-medium mb-1">Payable</p><p className="text-xl font-bold text-red-600">{formatCurrency(stats.unpaid)}</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input placeholder="Search by PO or vendor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" data-testid="purchase-search" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? undefined : v)}>
            <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Statuses</SelectItem>{PO_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      <Card>
        <CardHeader><CardTitle>Purchase Orders</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-gray-500">Loading...</div>
            : filtered.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">No purchase orders yet.</p>
                <Button onClick={openCreate} style={{ backgroundColor: '#F26522' }} className="text-white"><Plus className="h-4 w-4 mr-2" />Create First PO</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-3 text-xs uppercase font-semibold text-gray-600">PO #</th>
                      <th className="text-left py-3 px-3 text-xs uppercase font-semibold text-gray-600">Vendor</th>
                      <th className="text-left py-3 px-3 text-xs uppercase font-semibold text-gray-600">Date</th>
                      <th className="text-left py-3 px-3 text-xs uppercase font-semibold text-gray-600">Delivery</th>
                      <th className="text-left py-3 px-3 text-xs uppercase font-semibold text-gray-600">Status</th>
                      <th className="text-right py-3 px-3 text-xs uppercase font-semibold text-gray-600">Paid</th>
                      <th className="text-right py-3 px-3 text-xs uppercase font-semibold text-gray-600">Amount</th>
                      <th className="text-right py-3 px-3 text-xs uppercase font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => {
                      const isOverdue = p.expectedDeliveryDate && new Date(p.expectedDeliveryDate) < new Date() && p.status !== 'Received';
                      return (
                        <tr key={p.id} className="border-b hover:bg-orange-50 transition-colors" data-testid={`purchase-row-${p.id}`}>
                          <td className="py-3 px-3">
                            <p className="font-bold" style={{ color: '#2E2E2E' }}>{p.poNumber}</p>
                            {p.vendorInvoiceNumber && <p className="text-xs text-gray-500">Inv: {p.vendorInvoiceNumber}</p>}
                            {p.linkedOrderId && <p className="text-xs" style={{ color: '#F26522' }}><Link2 className="h-3 w-3 inline" /> {p.linkedOrderId}</p>}
                          </td>
                          <td className="py-3 px-3 text-sm">{p.vendorName}</td>
                          <td className="py-3 px-3 text-sm text-gray-600">{formatDate(p.purchaseDate)}</td>
                          <td className="py-3 px-3 text-sm">
                            {p.expectedDeliveryDate && (
                              <div>
                                <p className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}>{formatDate(p.expectedDeliveryDate)}</p>
                                {isOverdue && <p className="text-xs text-red-500 flex items-center gap-0.5"><AlertTriangle className="h-3 w-3" />Overdue</p>}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3"><Badge className={statusColor(p.status)}>{p.status}</Badge></td>
                          <td className="py-3 px-3 text-right text-sm">{formatCurrency(p.paidAmount || 0)}</td>
                          <td className="py-3 px-3 text-right font-bold" style={{ color: '#F26522' }}>{formatCurrency(p.totalAmount)}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1 justify-end">
                              {p.status !== 'Received' && (
                                <Button size="icon" variant="ghost" onClick={() => markReceived(p)} title="Mark Received"><PackageCheck className="h-4 w-4 text-green-600" /></Button>
                              )}
                              <Button size="icon" variant="ghost" onClick={() => openView(p)}><Eye className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-2xl font-bold" style={{ color: '#2E2E2E' }}>{editing ? 'Edit PO' : 'New Purchase Order'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Vendor *</Label>
                <Select value={formData.vendorId} onValueChange={(v) => setFormData({ ...formData, vendorId: v })}>
                  <SelectTrigger data-testid="vendor-select"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>{vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Vendor Invoice #</Label><Input value={formData.vendorInvoiceNumber} onChange={(e) => setFormData({ ...formData, vendorInvoiceNumber: e.target.value })} /></div>
              <div><Label>Purchase Date</Label><Input type="date" value={formData.purchaseDate} onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })} /></div>
              <div><Label>Expected Delivery</Label><Input type="date" value={formData.expectedDeliveryDate} onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })} /></div>
              <div><Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger data-testid="purchase-status"><SelectValue /></SelectTrigger>
                  <SelectContent>{PO_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Paid Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })}
                  data-testid="paid-amount"
                />
              </div>
              <div className="col-span-2"><Label>Linked Customer Order</Label>
                <Select value={formData.linkedOrderId || undefined} onValueChange={(v) => setFormData({ ...formData, linkedOrderId: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">None</SelectItem>{orders.map(o => <SelectItem key={o.id} value={o.orderId}>{o.orderId} - {o.customerName}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Linked order auto-updates to &quot;Ready for Delivery&quot; when received.</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2"><Label>Items</Label><Button type="button" size="sm" variant="outline" onClick={addItem}><Plus className="h-3 w-3 mr-1" />Add Item</Button></div>
              <div className="space-y-2">
                {formData.items.map((item, i) => (
                  <div key={item._key || item.id || `item-${i}`} className="grid grid-cols-12 gap-2 items-end p-2 border rounded">
                    <div className="col-span-5">
                      <Label className="text-xs">Product</Label>
                      <Select value={item.productId || undefined} onValueChange={(v) => selectProduct(i, v)}>
                        <SelectTrigger data-testid={`product-select-${i}`}><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>
                          {products.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2"><Label className="text-xs">Qty</Label><Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 0)} /></div>
                    <div className="col-span-2"><Label className="text-xs">Purchase Price</Label><Input type="number" step="0.01" min="0" value={item.rate} onChange={(e) => updateItem(i, 'rate', parseFloat(e.target.value) || 0)} /></div>
                    <div className="col-span-2"><Label className="text-xs">Subtotal</Label><Input disabled value={formatCurrency(item.quantity * item.rate)} /></div>
                    <div className="col-span-1"><Button type="button" size="icon" variant="ghost" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4 text-red-600" /></Button></div>
                  </div>
                ))}
              </div>
              <div className="text-right mt-3 pt-3 border-t"><span className="text-sm text-gray-500">Total: </span><span className="text-xl font-bold" style={{ color: '#F26522' }}>{formatCurrency(calcTotal())}</span></div>
            </div>

            <div className="p-3 bg-orange-50 rounded border border-orange-200">
              <div className="flex items-center gap-2 mb-2"><Paperclip className="h-4 w-4" style={{ color: '#F26522' }} /><span className="text-sm font-semibold">Attachments</span></div>
              <Input type="file" multiple accept=".pdf,.jpg,.png,.doc,.docx,.xls,.xlsx" className="text-sm" />
              <p className="text-xs text-gray-500 mt-1">Supplier invoices, bills, quotations, receipts (uploads to Google Drive)</p>
            </div>

            <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} /></div>

            <DialogFooter className="gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}><X className="h-4 w-4 mr-1" />Cancel</Button>
              <Button type="submit" style={{ backgroundColor: '#F26522' }} className="text-white" disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? 'Saving...' : editing ? 'Update' : 'Create PO'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Purchase Order Details</DialogTitle></DialogHeader>
          {viewData && (
            <div className="space-y-4">
              <div className="flex justify-between items-start p-3 rounded-lg" style={{ backgroundColor: '#FFF3ED' }}>
                <div><p className="text-xs uppercase text-gray-500">PO Number</p><p className="text-xl font-bold" style={{ color: '#F26522' }}>{viewData.poNumber}</p></div>
                <div className="space-y-1 text-right"><Badge className={statusColor(viewData.status)}>{viewData.status}</Badge></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-gray-500">Vendor</p><p className="font-semibold">{viewData.vendorName}</p></div>
                <div><p className="text-xs text-gray-500">Vendor Invoice</p><p className="font-semibold">{viewData.vendorInvoiceNumber || '-'}</p></div>
                <div><p className="text-xs text-gray-500">Purchase Date</p><p className="font-semibold">{formatDate(viewData.purchaseDate)}</p></div>
                <div><p className="text-xs text-gray-500">Expected Delivery</p><p className="font-semibold">{formatDate(viewData.expectedDeliveryDate)}</p></div>
                <div><p className="text-xs text-gray-500">Actual Delivery</p><p className="font-semibold">{formatDate(viewData.actualDeliveryDate) || 'Not received'}</p></div>
                <div><p className="text-xs text-gray-500">Linked Order</p><p className="font-semibold" style={{ color: '#F26522' }}>{viewData.linkedOrderId || 'None'}</p></div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Items</p>
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-gray-50"><th className="text-left p-2">Item</th><th className="text-right p-2">Qty</th><th className="text-right p-2">Rate</th><th className="text-right p-2">Amount</th></tr></thead>
                  <tbody>
                    {(viewData.items || []).map((it, i) => (
                      <tr key={it.id || `${it.name}-${it.quantity}-${it.rate}-${i}`} className="border-b"><td className="p-2">{it.name}</td><td className="text-right p-2">{it.quantity}</td><td className="text-right p-2">{formatCurrency(it.rate)}</td><td className="text-right p-2 font-semibold">{formatCurrency(it.quantity * it.rate)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 rounded-lg text-white" style={{ backgroundColor: '#F26522' }}>
                <div className="flex justify-between"><span>Total</span><span className="text-xl font-bold">{formatCurrency(viewData.totalAmount)}</span></div>
                <div className="flex justify-between"><span>Paid</span><span>{formatCurrency(viewData.paidAmount || 0)}</span></div>
                <div className="flex justify-between border-t border-white/20 pt-2 mt-2"><span>Balance</span><span className="font-bold">{formatCurrency((viewData.totalAmount || 0) - (viewData.paidAmount || 0))}</span></div>
              </div>
              {viewData.notes && <div><p className="text-xs text-gray-500">Notes</p><p className="text-sm">{viewData.notes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Purchases;
