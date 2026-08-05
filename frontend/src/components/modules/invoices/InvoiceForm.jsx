import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { invoicesAPI, customersAPI } from '@/services/api';
import { applyServerNotificationHint, notifyOrderEvent } from '@/services/notifications';
import CustomerPicker, { requireCustomer } from '@/components/shared/CustomerPicker';
import { formatCurrency } from '@/utils/helpers';
import { useBrand } from '@/context/BrandContext';
import { ArrowLeft, Save, Plus, Trash2, User, Receipt } from 'lucide-react';
import { toast } from 'sonner';

const emptyItem = () => ({
  _key: `i_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  quantity: 1,
  rate: 0,
  size: '',
  material: '',
});

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
  notes: 'Thank you for your business!',
};

const InvoiceForm = () => {
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const isEdit = !!invoiceId;
  const { primary } = useBrand();
  const accent = primary || '#F26522';

  const [formData, setFormData] = useState(emptyInvoice);
  const [customers, setCustomers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!isEdit);
  const [pageLoading, setPageLoading] = useState(isEdit);
  const [originalPaid, setOriginalPaid] = useState(0);

  const loadCustomers = useCallback(async () => {
    try {
      const res = await customersAPI.getAll();
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadInvoice = useCallback(async () => {
    if (!isEdit) {
      setFormData({
        ...emptyInvoice,
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      });
      setLoaded(true);
      return;
    }
    setPageLoading(true);
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
      setOriginalPaid(Number(inv.paidAmount) || 0);
      setLoaded(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load invoice');
    } finally {
      setPageLoading(false);
    }
  }, [invoiceId, isEdit]);

  useEffect(() => {
    loadCustomers();
    loadInvoice();
  }, [loadCustomers, loadInvoice]);

  const selectCustomer = async (next) => {
    let prev = formData.previousBalance || 0;
    if (next.customerId) {
      try {
        const led = await customersAPI.getLedger(next.customerId);
        prev = led.data?.outstanding || 0;
      } catch {
        prev = 0;
      }
    }
    setFormData((f) => ({ ...f, ...next, previousBalance: prev }));
  };

  const updateItem = (i, field, val) => {
    setFormData((prev) => {
      const items = prev.items.map((it, idx) => (idx === i ? { ...it, [field]: val } : it));
      return { ...prev, items };
    });
  };
  const addItem = () => setFormData((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  const removeItem = (i) => setFormData((prev) => ({
    ...prev,
    items: prev.items.filter((_, x) => x !== i),
  }));

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
    if (!requireCustomer(formData)) return;
    if (formData.items.length === 0 || !formData.items[0].name) {
      toast.error('Please add at least one item');
      return;
    }
    if (isEdit && !invoiceId) {
      toast.error('Missing invoice id — refresh and try again (will not create duplicate)');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        id: isEdit ? invoiceId : formData.id,
        subtotal,
        tax,
        totalAmount: total,
        status: derivedStatus(),
      };
      let res;
      if (isEdit) {
        res = await invoicesAPI.update(invoiceId, payload);
        toast.success('Invoice updated');
        const data = { ...payload, ...(res.data || {}) };
        const prevPaid = Number(originalPaid) || 0;
        const nextPaid = Number(payload.paidAmount) || 0;
        const receivedDelta = Math.max(0, nextPaid - prevPaid);
        if (receivedDelta > 0) {
          await notifyOrderEvent({
            event: 'payment_received',
            order: {
              customerName: payload.customerName,
              customerPhone: payload.customerPhone,
              customerEmail: payload.customerEmail,
              orderId: payload.orderId,
              totalAmount: grandTotal,
              balanceAmount: balance,
            },
            invoice: {
              ...data,
              invoiceNumber: payload.invoiceNumber,
              date: payload.date,
              totalAmount: grandTotal,
              balanceAmount: balance,
            },
            payment: {
              party: payload.customerName,
              partyPhone: payload.customerPhone,
              amount: receivedDelta,
              method: 'Invoice payment',
              reference: payload.invoiceNumber,
              type: 'inflow',
              balanceDue: balance,
            },
          });
          toast.message('Payment WhatsApp opened — Total / Received / Balance');
        }
      } else {
        res = await invoicesAPI.create(payload);
        toast.success(`Invoice ${payload.invoiceNumber} created`);
        const data = res.data || payload;
        if (applyServerNotificationHint(data)) {
          toast.message('WhatsApp opened — tap Send to notify customer');
        } else if (payload.customerPhone || payload.customerEmail) {
          await notifyOrderEvent({
            event: 'invoice_generated',
            order: {
              customerName: payload.customerName,
              customerPhone: payload.customerPhone,
              customerEmail: payload.customerEmail,
              orderId: payload.orderId,
              status: 'Invoice',
              totalAmount: grandTotal,
              balanceAmount: balance,
            },
            invoice: {
              ...data,
              invoiceNumber: payload.invoiceNumber,
              date: payload.date,
              totalAmount: grandTotal,
              balanceAmount: balance,
            },
          });
          toast.message('Invoice WhatsApp prepared');
        }
        const paidNow = Number(payload.paidAmount) || 0;
        if (paidNow > 0 && payload.customerPhone) {
          await notifyOrderEvent({
            event: 'payment_received',
            order: {
              customerName: payload.customerName,
              customerPhone: payload.customerPhone,
              orderId: payload.orderId,
              totalAmount: grandTotal,
              balanceAmount: balance,
            },
            invoice: { invoiceNumber: payload.invoiceNumber, date: payload.date, totalAmount: grandTotal, balanceAmount: balance },
            payment: {
              party: payload.customerName,
              partyPhone: payload.customerPhone,
              amount: paidNow,
              method: 'Invoice payment',
              reference: payload.invoiceNumber,
              type: 'inflow',
              balanceDue: balance,
            },
          });
        }
      }
      const id = res.data?.id || invoiceId;
      navigate(`/invoices/${id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading || (isEdit && !loaded)) {
    return <div className="py-16 text-center text-gray-500">Loading invoice…</div>;
  }

  return (
    <div className="space-y-4 pb-8" data-testid="invoice-form">
      <div className="rounded-2xl border border-orange-100 bg-white overflow-hidden shadow-sm">
        <div className="h-1.5" style={{ backgroundColor: accent }} />
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="outline" size="sm" onClick={() => navigate('/invoices')} data-testid="back-invoices">
              <ArrowLeft className="h-4 w-4 mr-1.5" />Back
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 shrink-0" style={{ color: accent }} />
                <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ color: '#1F2937' }}>
                  {isEdit ? 'Edit Invoice' : 'New Invoice'}
                </h1>
              </div>
              {formData.invoiceNumber && (
                <p className="text-xs text-gray-500 mt-0.5 pl-7">{formData.invoiceNumber}</p>
              )}
            </div>
          </div>
          <Button
            type="submit"
            form="invoice-form-el"
            size="sm"
            style={{ backgroundColor: accent }}
            className="text-white"
            disabled={saving}
            data-testid="save-invoice"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? 'Saving…' : isEdit ? 'Update Invoice' : 'Create Invoice'}
          </Button>
        </div>
      </div>

      <form id="invoice-form-el" onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="border-orange-100/80 shadow-sm rounded-2xl">
            <CardHeader className="py-3"><CardTitle className="text-base">Customer</CardTitle></CardHeader>
            <CardContent className="pt-0 space-y-3">
              <CustomerPicker
                customers={customers}
                customerId={formData.customerId}
                customerName={formData.customerName}
                customerPhone={formData.customerPhone}
                customerEmail={formData.customerEmail}
                customerAddress={formData.customerAddress}
                accent={accent}
                onCustomersChange={(c) => setCustomers((prev) => [c, ...prev.filter((x) => x.id !== c.id)])}
                onChange={selectCustomer}
              />
              {formData.customerId && formData.previousBalance !== 0 && (
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center gap-2">
                  <User className="h-4 w-4 text-yellow-700" />
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">Previous outstanding:</span> {formatCurrency(formData.previousBalance)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-orange-100/80 shadow-sm rounded-2xl">
            <CardHeader className="py-3"><CardTitle className="text-base">Invoice Info</CardTitle></CardHeader>
            <CardContent className="pt-0 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Invoice #</Label>
                <Input
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData((f) => ({ ...f, invoiceNumber: e.target.value }))}
                  required
                  data-testid="invoice-number-input"
                />
              </div>
              <div>
                <Label className="text-xs">Invoice Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((f) => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
              <div className="md:col-span-3">
                <Label className="text-xs">Order Ref</Label>
                <Input
                  value={formData.orderId}
                  onChange={(e) => setFormData((f) => ({ ...f, orderId: e.target.value }))}
                  placeholder="ORD-001"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-orange-100/80 shadow-sm rounded-2xl">
          <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Line Items</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={addItem} data-testid="add-item">
              <Plus className="h-3 w-3 mr-1" />Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {formData.items.map((it, i) => (
              <div key={it._key} className="grid grid-cols-12 gap-2 items-end p-2 border rounded-xl bg-gray-50/50" data-testid={`item-${i}`}>
                <div className="col-span-12 md:col-span-4">
                  <Label className="text-xs">Item</Label>
                  <Input className="bg-white" value={it.name} onChange={(e) => updateItem(i, 'name', e.target.value)} required />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Label className="text-xs">Size</Label>
                  <Input className="bg-white" value={it.size} onChange={(e) => updateItem(i, 'size', e.target.value)} />
                </div>
                <div className="col-span-4 md:col-span-1">
                  <Label className="text-xs">Qty</Label>
                  <Input className="bg-white" type="number" min="1" value={it.quantity} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value, 10) || 0)} />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Label className="text-xs">Rate</Label>
                  <Input className="bg-white" type="number" step="0.01" min="0" value={it.rate} onChange={(e) => updateItem(i, 'rate', parseFloat(e.target.value) || 0)} />
                </div>
                <div className="col-span-8 md:col-span-2">
                  <Label className="text-xs">Amount</Label>
                  <Input disabled className="bg-white font-semibold" value={formatCurrency((it.quantity || 0) * (it.rate || 0))} />
                </div>
                <div className="col-span-4 md:col-span-1 flex justify-end">
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeItem(i)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-orange-100/80 shadow-sm rounded-2xl">
          <CardHeader className="py-3"><CardTitle className="text-base">Totals & Payment</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Tax Rate (%)</Label>
                    <Input type="number" min="0" step="0.01" value={formData.taxRate} onChange={(e) => setFormData((f) => ({ ...f, taxRate: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Discount (Rs)</Label>
                    <Input type="number" min="0" step="0.01" value={formData.discount} onChange={(e) => setFormData((f) => ({ ...f, discount: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Paid Amount</Label>
                  <Input type="number" min="0" step="0.01" value={formData.paidAmount} onChange={(e) => setFormData((f) => ({ ...f, paidAmount: parseFloat(e.target.value) || 0 }))} data-testid="paid-input" />
                </div>
                <div>
                  <Label className="text-xs">Notes</Label>
                  <Textarea rows={2} value={formData.notes} onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5 p-4 rounded-xl" style={{ backgroundColor: '#FFF9F5' }}>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal</span><span className="font-semibold">{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Tax ({formData.taxRate}%)</span><span className="font-semibold">{formatCurrency(tax)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">Discount</span><span className="font-semibold text-red-600">-{formatCurrency(formData.discount || 0)}</span></div>
                {(formData.previousBalance || 0) !== 0 && (
                  <div className="flex justify-between text-sm bg-yellow-50 px-2 rounded">
                    <span className="text-yellow-800">Previous Balance</span>
                    <span className="font-semibold text-yellow-800">{formatCurrency(formData.previousBalance)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 my-1 rounded px-2" style={{ backgroundColor: accent }}>
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
          <Button type="submit" style={{ backgroundColor: accent }} className="text-white" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />{saving ? 'Saving…' : isEdit ? 'Update Invoice' : 'Create Invoice'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/invoices')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;
