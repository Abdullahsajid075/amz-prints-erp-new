import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { invoicesAPI, customersAPI } from '@/services/api';
import { formatCurrency } from '@/utils/helpers';
import { ArrowLeft, Save, Plus, Trash2, UserPlus, User } from 'lucide-react';
import { toast } from 'sonner';

const emptyItem = () => ({ _key: `i_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name: '', quantity: 1, rate: 0, size: '', material: '' });

const emptyInvoice = {
  invoiceNumber: '',
  orderId: '',
  customerId: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  customerAddress: '',
  date: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  items: [emptyItem()],
  taxRate: 0,
  discount: 0,
  previousBalance: 0,
  paidAmount: 0,
  status: 'Unpaid',
  notes: 'Thank you for your business!'
};

const InvoiceForm = () => {
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const isEdit = !!invoiceId;

  const [formData, setFormData] = useState(emptyInvoice);
  const [customers, setCustomers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });

  const loadCustomers = useCallback(async () => {
    try {
      const res = await customersAPI.getAll();
      setCustomers(res.data || []);
    } catch (err) { console.error(err); }
  }, []);

  const loadInvoice = useCallback(async () => {
    if (!isEdit) {
      setFormData({ ...emptyInvoice, invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}` });
      return;
    }
    try {
      const res = await invoicesAPI.getById(invoiceId);
      const inv = res.data || {};
      const dateOnly = (d) => {
        if (!d) return '';
        const s = String(d);
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
        try { return new Date(d).toISOString().slice(0, 10); } catch { return ''; }
      };
      const items = (inv.items || []).map((i) => ({
        ...emptyItem(),
        ...i,
        _key: i._key || `k_${Math.random().toString(36).slice(2, 8)}`,
        name: i.name || '',
        quantity: Number(i.quantity) || 1,
        rate: Number(i.rate) || 0,
        size: i.size || '',
        material: i.material || '',
      }));
      setFormData({
        ...emptyInvoice,
        invoiceNumber: inv.invoiceNumber || '',
        orderId: inv.orderId || '',
        customerId: inv.customerId || '',
        customerName: inv.customerName || '',
        customerEmail: inv.customerEmail || '',
        customerPhone: inv.customerPhone || '',
        customerAddress: inv.customerAddress || '',
        date: dateOnly(inv.date) || emptyInvoice.date,
        dueDate: dateOnly(inv.dueDate) || '',
        items: items.length ? items : [emptyItem()],
        taxRate: Number(inv.taxRate) || 0,
        discount: Number(inv.discount) || 0,
        previousBalance: Number(inv.previousBalance) || 0,
        paidAmount: Number(inv.paidAmount) || 0,
        status: inv.status || 'Unpaid',
        notes: inv.notes || '',
        shareToken: inv.shareToken || '',
      });
    } catch (err) { console.error(err); toast.error('Failed to load invoice'); }
  }, [invoiceId, isEdit]);

  useEffect(() => { loadCustomers(); loadInvoice(); }, [loadCustomers, loadInvoice]);

  const selectCustomer = async (id) => {
    if (id === '__new__') { setNewCustomerOpen(true); return; }
    const c = customers.find(x => x.id === id);
    if (!c) return;
    // Fetch ledger for previous balance
    let prev = 0;
    try {
      const led = await customersAPI.getLedger(id);
      prev = led.data?.outstanding || 0;
    } catch { /* no-op */ }
    setFormData(f => ({
      ...f,
      customerId: c.id,
      customerName: c.name,
      customerEmail: c.email || '',
      customerPhone: c.phone || '',
      customerAddress: c.address || '',
      previousBalance: prev
    }));
  };

  const handleAddNewCustomer = async () => {
    if (!newCustomer.name) { toast.error('Customer name is required'); return; }
    try {
      const res = await customersAPI.create(newCustomer);
      const c = res.data;
      setCustomers(prev => [c, ...prev]);
      setFormData(f => ({
        ...f, customerId: c.id, customerName: c.name,
        customerPhone: c.phone || '', customerEmail: c.email || '', customerAddress: c.address || '',
        previousBalance: 0
      }));
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
      setNewCustomerOpen(false);
      toast.success('Customer added');
    } catch (err) { console.error(err); toast.error('Failed to add customer'); }
  };

  const updateItem = (i, field, val) => {
    const items = [...formData.items];
    items[i] = { ...items[i], [field]: val };
    setFormData({ ...formData, items });
  };
  const addItem = () => setFormData({ ...formData, items: [...formData.items, emptyItem()] });
  const removeItem = (i) => setFormData({ ...formData, items: formData.items.filter((_, x) => x !== i) });

  const subtotal = formData.items.reduce((s, it) => s + (it.quantity || 0) * (it.rate || 0), 0);
  const tax = (subtotal * (formData.taxRate || 0)) / 100;
  const total = subtotal + tax - (formData.discount || 0);
  const grandTotal = total + (formData.previousBalance || 0);
  const balance = grandTotal - (formData.paidAmount || 0);

  const derivedStatus = () => {
    if (balance <= 0) return 'Paid';
    if ((formData.paidAmount || 0) > 0) return 'Partial';
    return 'Unpaid';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.customerName) { toast.error('Please select or add a customer'); return; }
    if (formData.items.length === 0 || !formData.items[0].name) { toast.error('Please add at least one item'); return; }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        subtotal,
        tax,
        totalAmount: total,
        status: derivedStatus()
      };
      let res;
      if (isEdit) { res = await invoicesAPI.update(invoiceId, payload); toast.success('Invoice updated'); }
      else { res = await invoicesAPI.create(payload); toast.success(`Invoice ${payload.invoiceNumber} created`); }
      const id = res.data?.id || invoiceId;
      navigate(`/invoices/${id}`);
    } catch (err) { console.error(err); toast.error('Failed to save invoice'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-4" data-testid="invoice-form">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/invoices')} data-testid="back-invoices">
          <ArrowLeft className="h-4 w-4 mr-2" />Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1F2937' }}>{isEdit ? 'Edit Invoice' : 'Create Invoice'}</h1>
          <p className="text-gray-600 text-sm mt-0.5">{isEdit ? 'Update invoice details' : 'Fill in details — customer is auto-recorded'}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-3">
        <Card>
          <CardHeader className="py-3"><CardTitle className="text-base">Customer & Invoice Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Label>Customer *</Label>
                <Select value={formData.customerId || ''} onValueChange={selectCustomer}>
                  <SelectTrigger data-testid="customer-select"><SelectValue placeholder="Select existing customer or add new" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__new__" className="text-orange-600 font-semibold">
                      <span className="inline-flex items-center gap-2"><UserPlus className="h-4 w-4" />Add new customer</span>
                    </SelectItem>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}{c.phone ? ` — ${c.phone}` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Invoice #</Label>
                <Input value={formData.invoiceNumber} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} required data-testid="invoice-number-input" />
              </div>
              <div><Label>Customer Name</Label><Input value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} placeholder="Name" required data-testid="customer-name-input" /></div>
              <div><Label>Phone</Label><Input value={formData.customerPhone} onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })} placeholder="+92..." /></div>
              <div><Label>Email</Label><Input type="email" value={formData.customerEmail} onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })} /></div>
              <div className="md:col-span-3"><Label>Address</Label><Input value={formData.customerAddress} onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })} /></div>
              <div><Label>Invoice Date *</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required /></div>
              <div><Label>Due Date</Label><Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} /></div>
              <div><Label>Order Ref</Label><Input value={formData.orderId} onChange={(e) => setFormData({ ...formData, orderId: e.target.value })} placeholder="ORD-001" /></div>
            </div>

            {formData.customerId && formData.previousBalance !== 0 && (
              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center gap-2">
                <User className="h-4 w-4 text-yellow-700" />
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">Previous outstanding balance:</span> {formatCurrency(formData.previousBalance)} — added to grand total.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Line Items</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={addItem} data-testid="add-item"><Plus className="h-3 w-3 mr-1" />Add Item</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {formData.items.map((it, i) => (
              <div key={it._key} className="grid grid-cols-12 gap-2 items-end p-2 border rounded" data-testid={`item-${i}`}>
                <div className="col-span-4"><Label className="text-xs">Item / Description</Label><Input value={it.name} onChange={(e) => updateItem(i, 'name', e.target.value)} required /></div>
                <div className="col-span-2"><Label className="text-xs">Size</Label><Input value={it.size} onChange={(e) => updateItem(i, 'size', e.target.value)} /></div>
                <div className="col-span-1"><Label className="text-xs">Qty</Label><Input type="number" min="1" value={it.quantity} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 0)} /></div>
                <div className="col-span-2"><Label className="text-xs">Rate</Label><Input type="number" step="0.01" min="0" value={it.rate} onChange={(e) => updateItem(i, 'rate', parseFloat(e.target.value) || 0)} /></div>
                <div className="col-span-2"><Label className="text-xs">Amount</Label><Input disabled value={formatCurrency((it.quantity || 0) * (it.rate || 0))} /></div>
                <div className="col-span-1"><Button type="button" size="icon" variant="ghost" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4 text-red-600" /></Button></div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Totals & Payment</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Tax Rate (%)</Label><Input type="number" min="0" step="0.01" value={formData.taxRate} onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })} /></div>
                  <div><Label>Discount (Rs)</Label><Input type="number" min="0" step="0.01" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })} /></div>
                </div>
                <div><Label>Paid Amount</Label><Input type="number" min="0" step="0.01" value={formData.paidAmount} onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })} data-testid="paid-input" /></div>
                <div><Label>Notes</Label><Textarea rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5 p-4 rounded-lg" style={{ backgroundColor: '#FFF9F5' }}>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span className="font-semibold">{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Tax ({formData.taxRate}%)</span><span className="font-semibold">{formatCurrency(tax)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Discount</span><span className="font-semibold text-red-600">-{formatCurrency(formData.discount || 0)}</span></div>
                {(formData.previousBalance || 0) !== 0 && (
                  <div className="flex justify-between text-sm bg-yellow-50 px-2 rounded"><span className="text-yellow-800">Previous Balance</span><span className="font-semibold text-yellow-800">{formatCurrency(formData.previousBalance)}</span></div>
                )}
                <div className="flex justify-between py-2 my-1 rounded" style={{ backgroundColor: '#F26522', paddingLeft: 8, paddingRight: 8 }}>
                  <span className="font-bold text-white uppercase text-sm">Grand Total</span>
                  <span className="font-bold text-white text-lg">{formatCurrency(grandTotal)}</span>
                </div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Paid</span><span className="font-semibold text-green-700">{formatCurrency(formData.paidAmount || 0)}</span></div>
                <div className="flex justify-between border-t border-gray-300 pt-2 mt-1">
                  <span className="font-bold text-sm">Balance Due</span>
                  <span className={`font-bold text-lg ${balance > 0 ? 'text-red-600' : 'text-green-700'}`}>{formatCurrency(balance)}</span>
                </div>
                <div className="pt-2">
                  <Badge className={`${derivedStatus() === 'Paid' ? 'bg-green-100 text-green-800' : derivedStatus() === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    Status: {derivedStatus()}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" style={{ backgroundColor: '#F26522' }} className="text-white" disabled={saving} data-testid="save-invoice">
            <Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : isEdit ? 'Update Invoice' : 'Create Invoice'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/invoices')}>Cancel</Button>
        </div>
      </form>

      {/* Inline new customer dialog */}
      <Dialog open={newCustomerOpen} onOpenChange={setNewCustomerOpen}>
        <DialogContent className="max-w-md" data-testid="new-customer-dialog">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Save a new customer without leaving the invoice form.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-3">
            <div><Label>Name *</Label><Input value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} data-testid="new-cust-name" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} /></div>
            </div>
            <div><Label>Address</Label><Textarea rows={2} value={newCustomer.address} onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })} /></div>
          </div>
          <DialogFooter className="gap-2 mt-3">
            <Button variant="outline" onClick={() => setNewCustomerOpen(false)}>Cancel</Button>
            <Button style={{ backgroundColor: '#F26522' }} className="text-white" onClick={handleAddNewCustomer} data-testid="save-new-customer">Save Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceForm;
