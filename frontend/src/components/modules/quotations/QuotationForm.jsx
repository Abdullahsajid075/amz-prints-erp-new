import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { quotationsAPI, productsAPI, ordersAPI } from '@/services/api';
import { formatCurrency } from '@/utils/helpers';
import { useBrand } from '@/context/BrandContext';
import { ArrowLeft, Plus, Trash2, Save, ShoppingCart, Printer } from 'lucide-react';
import { toast } from 'sonner';

const emptyLine = () => ({
  _key: `l_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  quantity: 1,
  rate: 0,
  size: '',
  material: '',
});

const QuotationForm = ({ printMode = false }) => {
  const navigate = useNavigate();
  const { quotationId } = useParams();
  const isEdit = !!quotationId;
  const { company, primary } = useBrand();

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    remarks: '',
    status: 'Draft',
    products: [emptyLine()],
  });
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const total = useMemo(
    () => form.products.reduce((s, p) => s + (Number(p.quantity) || 0) * (Number(p.rate) || 0), 0),
    [form.products]
  );

  const loadCatalog = useCallback(async () => {
    try {
      const res = await productsAPI.getAll();
      setCatalog(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadQuotation = useCallback(async () => {
    if (!quotationId) return;
    setLoading(true);
    try {
      const res = await quotationsAPI.getById(quotationId);
      const q = res.data;
      setForm({
        customerName: q.customerName || '',
        customerPhone: q.customerPhone || '',
        customerEmail: q.customerEmail || '',
        customerAddress: q.customerAddress || '',
        remarks: q.remarks || '',
        status: q.status || 'Draft',
        products: (q.products || []).length
          ? q.products.map((p, i) => ({
              _key: p.id || `l_${i}`,
              name: p.name || '',
              quantity: p.quantity || 1,
              rate: p.rate || 0,
              size: p.size || '',
              material: p.material || '',
            }))
          : [emptyLine()],
        orderId: q.orderId,
        id: q.id,
        date: q.date,
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load quotation');
    } finally {
      setLoading(false);
    }
  }, [quotationId]);

  useEffect(() => {
    loadCatalog();
    if (isEdit) loadQuotation();
  }, [isEdit, loadCatalog, loadQuotation]);

  useEffect(() => {
    if (printMode && !loading && form.id) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [printMode, loading, form.id]);

  const setLine = (index, field, value) => {
    const products = [...form.products];
    products[index] = { ...products[index], [field]: value };
    setForm({ ...form, products });
  };

  const pickProduct = (index, productId) => {
    const p = catalog.find((x) => String(x.id) === String(productId));
    if (!p) return;
    const products = [...form.products];
    products[index] = {
      ...products[index],
      name: p.name,
      rate: p.rate || p.basePrice || 0,
      size: p.size || products[index].size || '',
      material: p.material || products[index].material || '',
    };
    setForm({ ...form, products });
  };

  const buildPayload = () => ({
    customerName: form.customerName,
    customerPhone: form.customerPhone,
    customerEmail: form.customerEmail,
    customerAddress: form.customerAddress,
    remarks: form.remarks,
    status: form.status,
    products: form.products.map(({ name, quantity, rate, size, material }) => ({
      name,
      quantity: Number(quantity) || 0,
      rate: Number(rate) || 0,
      size,
      material,
    })),
    totalAmount: total,
    balanceAmount: total,
    advancePayment: 0,
    docType: 'Quotation',
  });

  const handleSave = async () => {
    if (!form.customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (isEdit) {
        await quotationsAPI.update(quotationId, payload);
        toast.success('Quotation updated');
      } else {
        const created = await quotationsAPI.create(payload);
        toast.success('Quotation created');
        navigate(`/quotations/${created.data.id}/edit`, { replace: true });
        return;
      }
      navigate('/quotations');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save quotation');
    } finally {
      setSaving(false);
    }
  };

  const convertToOrder = async () => {
    if (!form.customerName.trim()) {
      toast.error('Customer name is required');
      return;
    }
    setSaving(true);
    try {
      let quoteId = quotationId;
      const payload = buildPayload();
      if (!isEdit) {
        const created = await quotationsAPI.create(payload);
        quoteId = created.data.id;
      } else {
        await quotationsAPI.update(quotationId, payload);
      }
      await ordersAPI.create({
        ...payload,
        docType: 'Order',
        status: 'Order Received',
        quotationId: quoteId,
        remarks: payload.remarks ? `${payload.remarks}\n(From quotation)` : 'Converted from quotation',
      });
      toast.success('Converted to order');
      navigate('/orders');
    } catch (err) {
      console.error(err);
      toast.error('Failed to convert to order');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-gray-500">Loading quotation...</div>;
  }

  if (printMode) {
    return (
      <div className="max-w-3xl mx-auto bg-white p-8 print:p-0" data-testid="quotation-print">
        <div className="flex justify-between items-start border-b-2 pb-4 mb-6" style={{ borderColor: primary || '#F26522' }}>
          <div>
            {company.logo ? (
              <img src={company.logo} alt="logo" className="h-14 object-contain mb-2" />
            ) : null}
            <h1 className="text-2xl font-bold">{company.name || 'AMZ Prints'}</h1>
            <p className="text-sm text-gray-600">{company.tagline}</p>
            <p className="text-xs text-gray-500 mt-1">{[company.address, company.phone].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider" style={{ color: primary || '#F26522' }}>Quotation</p>
            <p className="text-xl font-bold">{form.orderId || 'Draft'}</p>
            <p className="text-sm text-gray-600">{form.date || new Date().toISOString().slice(0, 10)}</p>
          </div>
        </div>
        <div className="mb-6">
          <p className="text-xs uppercase font-semibold mb-1" style={{ color: primary || '#F26522' }}>Customer</p>
          <p className="font-semibold">{form.customerName}</p>
          <p className="text-sm text-gray-600">{form.customerPhone}</p>
          <p className="text-sm text-gray-600">{form.customerEmail}</p>
          <p className="text-sm text-gray-600">{form.customerAddress}</p>
        </div>
        <table className="w-full text-sm mb-6">
          <thead>
            <tr style={{ backgroundColor: '#2E2E2E', color: '#fff' }}>
              <th className="text-left p-2">#</th>
              <th className="text-left p-2">Item</th>
              <th className="text-right p-2">Qty</th>
              <th className="text-right p-2">Rate</th>
              <th className="text-right p-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {form.products.map((p, i) => (
              <tr key={p._key} className="border-b">
                <td className="p-2">{i + 1}</td>
                <td className="p-2">{p.name}{p.size ? ` (${p.size})` : ''}</td>
                <td className="p-2 text-right">{p.quantity}</td>
                <td className="p-2 text-right">{formatCurrency(p.rate)}</td>
                <td className="p-2 text-right font-semibold">{formatCurrency(p.quantity * p.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end">
          <div className="px-4 py-2 rounded text-white font-bold" style={{ backgroundColor: primary || '#F26522' }}>
            Total: {formatCurrency(total)}
          </div>
        </div>
        {form.remarks && <p className="mt-6 text-sm text-gray-600"><strong>Notes:</strong> {form.remarks}</p>}
        <div className="no-print mt-8 flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/quotations/${quotationId}/edit`)}>Back</Button>
          <Button onClick={() => window.print()} className="text-white" style={{ backgroundColor: primary || '#F26522' }}>
            <Printer className="h-4 w-4 mr-2" />Print
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="quotation-form">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/quotations')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>
              {isEdit ? 'Edit Quotation' : 'New Quotation'}
            </h1>
            {form.orderId && <p className="text-sm text-gray-500">{form.orderId}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isEdit && (
            <Button variant="outline" onClick={() => navigate(`/quotations/${quotationId}/print`)}>
              <Printer className="h-4 w-4 mr-2" />Print
            </Button>
          )}
          <Button variant="outline" disabled={saving} onClick={convertToOrder}>
            <ShoppingCart className="h-4 w-4 mr-2" />Convert to Order
          </Button>
          <Button disabled={saving} onClick={handleSave} className="text-white" style={{ backgroundColor: primary || '#F26522' }}>
            <Save className="h-4 w-4 mr-2" />{saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Name *</Label>
            <Input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Address</Label>
            <Textarea rows={2} value={form.customerAddress} onChange={(e) => setForm({ ...form, customerAddress: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Line Items</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setForm({ ...form, products: [...form.products, emptyLine()] })}>
            <Plus className="h-4 w-4 mr-1" />Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.products.map((line, index) => (
            <div key={line._key} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border rounded-lg p-3">
              <div className="md:col-span-4">
                <Label>Product</Label>
                <Select onValueChange={(v) => pickProduct(index, v)}>
                  <SelectTrigger><SelectValue placeholder={line.name || 'Pick product'} /></SelectTrigger>
                  <SelectContent>
                    {catalog.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name} · {formatCurrency(p.rate || p.basePrice)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input className="mt-1" placeholder="Or type name" value={line.name} onChange={(e) => setLine(index, 'name', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Qty</Label>
                <Input type="number" min={1} value={line.quantity} onChange={(e) => setLine(index, 'quantity', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="md:col-span-2">
                <Label>Rate</Label>
                <Input type="number" min={0} value={line.rate} onChange={(e) => setLine(index, 'rate', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="md:col-span-2">
                <Label>Amount</Label>
                <Input readOnly value={formatCurrency((line.quantity || 0) * (line.rate || 0))} />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="button" size="icon" variant="ghost" disabled={form.products.length === 1} onClick={() => setForm({ ...form, products: form.products.filter((_, i) => i !== index) })}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <div className="text-lg font-bold" style={{ color: primary || '#F26522' }}>Total: {formatCurrency(total)}</div>
          </div>
          <div>
            <Label>Remarks</Label>
            <Textarea rows={2} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuotationForm;
