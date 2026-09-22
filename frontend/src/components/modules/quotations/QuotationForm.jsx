import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { quotationsAPI, productsAPI, ordersAPI, customersAPI } from '@/services/api';
import { applyServerNotificationHint, notifyOrderEvent, openWhatsAppChat } from '@/services/notifications';
import CustomerPicker, { requireCustomer } from '@/components/shared/CustomerPicker';
import { WhatsAppIcon } from '@/components/shared/WhatsAppIcon';
import { formatCurrency } from '@/utils/helpers';
import { documentFileName, printWithDocumentTitle } from '@/utils/printHelpers';
import { useBrand } from '@/context/BrandContext';
import { ArrowLeft, Plus, Trash2, Save, ShoppingCart, Printer, FileText, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';

const emptyLine = () => ({
  _key: `l_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  productId: '',
  name: '',
  quantity: 1,
  rate: 0,
  size: '',
  material: '',
  notes: '',
});

const QuotationForm = ({ printMode = false }) => {
  const navigate = useNavigate();
  const { quotationId } = useParams();
  const isEdit = !!quotationId;
  const { company, primary } = useBrand();
  const accent = primary || '#ff6d00';

  const [form, setForm] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    remarks: '',
    status: 'Draft',
    products: [emptyLine()],
  });
  const [customers, setCustomers] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!isEdit);

  const total = useMemo(
    () => form.products.reduce((s, p) => s + (Number(p.quantity) || 0) * (Number(p.rate) || 0), 0),
    [form.products]
  );

  const loadCustomers = useCallback(async () => {
    try {
      const res = await customersAPI.getAll();
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

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
      const q = res.data || {};
      const products = Array.isArray(q.products) && q.products.length
        ? q.products.map((p, i) => ({
            _key: p._key || p.id || `l_${i}_${Date.now()}`,
            productId: p.productId || '',
            name: p.name || '',
            quantity: Number(p.quantity) || 1,
            rate: Number(p.rate) || 0,
            size: p.size || '',
            material: p.material || '',
            notes: p.notes || '',
          }))
        : [emptyLine()];

      setForm({
        customerId: q.customerId || '',
        customerName: q.customerName || '',
        customerPhone: q.customerPhone || '',
        customerEmail: q.customerEmail || '',
        customerAddress: q.customerAddress || '',
        remarks: q.remarks || '',
        status: q.status || 'Draft',
        products,
        orderId: q.orderId,
        id: q.id,
        date: q.date,
      });
      setLoaded(true);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load quotation');
    } finally {
      setLoading(false);
    }
  }, [quotationId]);

  useEffect(() => {
    loadCustomers();
    loadCatalog();
    if (isEdit) loadQuotation();
  }, [isEdit, loadCustomers, loadCatalog, loadQuotation]);

  useEffect(() => {
    if (printMode && !loading && form.id) {
      const title = documentFileName({
        docType: 'Quotation',
        customerName: form.customerName,
        orderNumber: form.orderId,
      });
      const t = setTimeout(() => printWithDocumentTitle(title), 400);
      return () => clearTimeout(t);
    }
  }, [printMode, loading, form.id, form.customerName, form.orderId]);

  const setLine = (index, field, value) => {
    setForm((prev) => {
      const products = prev.products.map((p, i) => (i === index ? { ...p, [field]: value } : p));
      return { ...prev, products };
    });
  };

  const pickProduct = (index, productId) => {
    const p = catalog.find((x) => String(x.id) === String(productId));
    if (!p) return;
    setForm((prev) => {
      const products = prev.products.map((line, i) => (
        i === index
          ? {
              ...line,
              productId: String(p.id),
              name: p.name || line.name,
              rate: Number(p.rate ?? p.basePrice ?? line.rate) || 0,
              size: p.size || line.size || '',
              material: p.material || line.material || '',
            }
          : line
      ));
      return { ...prev, products };
    });
  };

  const catalogValueFor = (line) => {
    if (line.productId && catalog.some((p) => String(p.id) === String(line.productId))) {
      return String(line.productId);
    }
    const match = catalog.find((p) => String(p.name).toLowerCase() === String(line.name || '').toLowerCase());
    return match ? String(match.id) : undefined;
  };

  const lineHasCatalogProduct = (line) => Boolean(catalogValueFor(line));

  const goAddProduct = () => navigate('/warehouse/products?new=1');

  const buildPayload = () => ({
    customerId: form.customerId,
    customerName: form.customerName,
    customerPhone: form.customerPhone,
    customerEmail: form.customerEmail,
    customerAddress: form.customerAddress,
    remarks: form.remarks,
    status: form.status,
    products: form.products.map(({ productId, name, quantity, rate, size, material, notes }) => ({
      productId: productId || '',
      name,
      quantity: Number(quantity) || 0,
      rate: Number(rate) || 0,
      size: size || '',
      material: material || '',
      notes: notes || '',
    })),
    totalAmount: total,
    balanceAmount: 0,
    advancePayment: 0,
    docType: 'Quotation',
  });

  const notifyQuotation = async (saved) => {
    try {
      const orderLike = {
        ...buildPayload(),
        ...saved,
        orderId: saved?.orderId || form.orderId || '',
        totalAmount: saved?.totalAmount ?? total,
      };
      if (applyServerNotificationHint(saved)) {
        toast.message('WhatsApp opened — tap Send');
        return;
      }
      await notifyOrderEvent({ event: 'quotation', order: orderLike });
      toast.message('Quotation WhatsApp prepared');
    } catch (err) {
      console.warn('Quotation notify failed', err);
    }
  };

  const sendFollowUp = () => {
    const status = String(form.status || '').trim().toLowerCase();
    if (status === 'accepted' || status.includes('accept') || status.includes('converted')) {
      toast.message('Quotation already accepted — follow-up not needed');
      return;
    }
    const phone = form.customerPhone || '';
    if (!phone) {
      toast.error('Customer phone missing — add phone to follow up');
      return;
    }
    const name = form.customerName || 'Customer';
    const quoteNo = form.orderId || quotationId || '';
    const companyName = company?.name || 'Amazon Printing Services';
    const msg = (
      `Dear ${name},\n\n`
      + `*Soft follow-up — Quotation*\n\n`
      + `Just checking in regarding quotation *${quoteNo}*`
      + (total > 0 ? ` (Total: ${formatCurrency(total)})` : '')
      + `.\n\n`
      + `Please let us know if you would like to proceed, need any changes, or have questions.\n\n`
      + `We are ready to start as soon as you confirm.\n\n`
      + `Thank you.\n${companyName}`
    );
    const result = openWhatsAppChat(phone, msg);
    if (!result.ok) toast.error('Could not open WhatsApp');
    else toast.message('Follow-up opened — tap Send');
  };

  const handleSave = async () => {
    if (!requireCustomer(form)) return;
    if (!catalog.length) {
      toast.error('Pehle catalog me product add karein');
      return;
    }
    if (!form.products.every(lineHasCatalogProduct)) {
      toast.error('Har item pe catalog se product select karein');
      return;
    }
    if (isEdit && !quotationId) {
      toast.error('Missing quotation id — refresh (will not create duplicate)');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...buildPayload(), id: isEdit ? quotationId : undefined };
      if (isEdit) {
        const updated = await quotationsAPI.update(quotationId, payload);
        toast.success('Quotation updated');
        await notifyQuotation(updated.data || payload);
        navigate('/quotations');
      } else {
        const created = await quotationsAPI.create(payload);
        toast.success('Quotation created');
        await notifyQuotation(created.data || payload);
        navigate(`/quotations/${created.data.id}/edit`, { replace: true });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save quotation');
    } finally {
      setSaving(false);
    }
  };

  const convertToOrder = async () => {
    if (!requireCustomer(form)) return;
    if (!catalog.length) {
      toast.error('Pehle catalog me product add karein');
      return;
    }
    if (!form.products.every(lineHasCatalogProduct)) {
      toast.error('Har item pe catalog se product select karein');
      return;
    }
    setSaving(true);
    try {
      let quoteId = quotationId;
      const payload = buildPayload();
      let savedQuote;
      if (!isEdit) {
        const created = await quotationsAPI.create({ ...payload, status: 'Accepted' });
        quoteId = created.data?.id;
        savedQuote = created.data;
      } else {
        const updated = await quotationsAPI.update(quotationId, { ...payload, status: 'Accepted' });
        savedQuote = updated.data;
      }

      const orderPayload = {
        customerId: payload.customerId,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        customerEmail: payload.customerEmail,
        customerAddress: payload.customerAddress,
        products: payload.products,
        totalAmount: payload.totalAmount,
        balanceAmount: payload.totalAmount,
        advancePayment: 0,
        remarks: payload.remarks
          ? `${payload.remarks}\n(From quotation ${savedQuote?.orderId || quoteId || ''})`
          : `Converted from quotation ${savedQuote?.orderId || quoteId || ''}`,
        status: 'Order Received',
        docType: 'Order',
        quotationId: quoteId,
        assignedDesigner: form.assignedDesigner || '',
        deliveryDate: form.deliveryDate || '',
      };

      const createdOrder = await ordersAPI.create(orderPayload);
      if (isEdit && quoteId) {
        try {
          await quotationsAPI.update(quoteId, { ...payload, status: 'Accepted' });
        } catch {
          /* quote already saved */
        }
      }

      toast.success('Converted to order — details copied');
      const data = createdOrder.data || orderPayload;
      if (applyServerNotificationHint(data)) {
        toast.message('WhatsApp opened — tap Send');
      } else {
        await notifyOrderEvent({ event: 'created', order: { ...orderPayload, ...data } });
      }

      if (data.id) navigate(`/orders/${data.id}/edit`);
      else navigate('/orders');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to convert to order');
    } finally {
      setSaving(false);
    }
  };

  if (loading || (isEdit && !loaded)) {
    return <div className="py-16 text-center text-gray-500">Loading quotation…</div>;
  }

  if (printMode) {
    return (
      <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none invoice-container" data-testid="quotation-print">
        <div className="h-2" style={{ backgroundColor: accent }} />
        <div className="p-8 print:p-6">
          <div className="flex justify-between items-start gap-6 border-b-2 pb-5 mb-6" style={{ borderColor: accent }}>
            <div className="flex items-start gap-4">
              {company.logo ? (
                <img src={company.logo} alt="logo" className="h-16 object-contain" />
              ) : (
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: accent }}>
                  {(company.name || 'A').charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold" style={{ color: '#0747a3' }}>{company.name || 'AMZ Prints'}</h2>
                <p className="text-sm text-gray-600">{company.tagline}</p>
                <p className="text-xs text-gray-500 mt-1">{[company.address, company.phone, company.email].filter(Boolean).join(' · ')}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black tracking-tight" style={{ color: accent }}>QUOTATION</p>
              <p className="text-lg font-semibold mt-2">{form.orderId || 'Draft'}</p>
              <p className="text-sm text-gray-600">{form.date || new Date().toISOString().slice(0, 10)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: accent }}>Quote For</p>
              <p className="font-semibold text-lg">{form.customerName}</p>
              <p className="text-sm text-gray-600">{form.customerPhone}</p>
              <p className="text-sm text-gray-600">{form.customerEmail}</p>
              <p className="text-sm text-gray-600">{form.customerAddress}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: accent }}>Status</p>
              <p className="font-semibold">{form.status || 'Draft'}</p>
            </div>
          </div>

          <table className="w-full text-sm mb-6">
            <thead>
              <tr style={{ backgroundColor: '#0747a3', color: '#fff' }}>
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Description</th>
                <th className="text-right p-3">Qty</th>
                <th className="text-right p-3">Rate</th>
                <th className="text-right p-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {form.products.map((p, i) => (
                <tr key={p._key} className="border-b border-gray-100">
                  <td className="p-3 text-gray-500">{i + 1}</td>
                  <td className="p-3">
                    <p className="font-medium">{p.name}</p>
                    {(p.size || p.material) && (
                      <p className="text-xs text-gray-500">{[p.size, p.material].filter(Boolean).join(' · ')}</p>
                    )}
                  </td>
                  <td className="p-3 text-right">{p.quantity}</td>
                  <td className="p-3 text-right">{formatCurrency(p.rate)}</td>
                  <td className="p-3 text-right font-semibold">{formatCurrency(p.quantity * p.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between px-3 py-2 rounded text-white font-bold" style={{ backgroundColor: accent }}>
                <span>TOTAL</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {form.remarks && (
            <div className="mb-8 p-4 bg-gray-50 rounded border border-gray-100">
              <p className="text-xs uppercase font-semibold text-gray-700 mb-1">Notes</p>
              <p className="text-sm text-gray-600 whitespace-pre-line">{form.remarks}</p>
            </div>
          )}

          <div className="text-center text-xs text-gray-500 border-t pt-4">
            Thank you for considering {company.name || 'AMZ Prints'} · This quotation is valid for 15 days
            {company.website ? ` · ${company.website}` : ''}
          </div>
        </div>

        <div className="no-print mt-6 flex gap-2 px-2 pb-4">
          <Button variant="outline" onClick={() => navigate(`/quotations/${quotationId}/edit`)}>Back</Button>
          <Button
            onClick={() => printWithDocumentTitle(documentFileName({
              docType: 'Quotation',
              customerName: form.customerName,
              orderNumber: form.orderId,
            }))}
            className="text-white"
            style={{ backgroundColor: accent }}
          >
            <Printer className="h-4 w-4 mr-2" />Print
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8" data-testid="quotation-form">
      <div className="rounded-2xl border border-orange-100 bg-white overflow-hidden shadow-sm">
        <div className="h-1.5" style={{ backgroundColor: accent }} />
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="outline" size="sm" onClick={() => navigate('/quotations')}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />Back
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 shrink-0" style={{ color: accent }} />
                <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ color: '#0747a3' }}>
                  {isEdit ? 'Edit Quotation' : 'New Quotation'}
                </h1>
              </div>
              {form.orderId && <p className="text-xs text-gray-500 mt-0.5 pl-7">{form.orderId}</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isEdit && !(['accepted'].includes(String(form.status || '').trim().toLowerCase())
              || /accept|converted/i.test(String(form.status || ''))) && (
              <Button
                variant="outline"
                size="sm"
                className="text-green-700 border-green-200 hover:bg-green-50"
                onClick={sendFollowUp}
                data-testid="quotation-followup-button"
              >
                <WhatsAppIcon className="h-4 w-4 mr-1.5" />
                Follow up
              </Button>
            )}
            {isEdit && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/quotations/${quotationId}/print`)}>
                <Printer className="h-4 w-4 mr-1.5" />Print
              </Button>
            )}
            <Button variant="outline" size="sm" disabled={saving} onClick={convertToOrder}>
              <ShoppingCart className="h-4 w-4 mr-1.5" />Convert to Order
            </Button>
            <Button size="sm" disabled={saving} onClick={handleSave} className="text-white" style={{ backgroundColor: accent }}>
              <Save className="h-4 w-4 mr-1.5" />{saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 border-orange-100/80 shadow-sm rounded-2xl">
          <CardHeader className="py-3"><CardTitle className="text-base">Customer</CardTitle></CardHeader>
          <CardContent className="pt-0 space-y-3">
            <CustomerPicker
              customers={customers}
              customerId={form.customerId}
              customerName={form.customerName}
              customerPhone={form.customerPhone}
              customerEmail={form.customerEmail}
              customerAddress={form.customerAddress}
              accent={accent}
              onCustomersChange={(c) => setCustomers((prev) => [c, ...prev.filter((x) => x.id !== c.id)])}
              onChange={(next) => setForm((prev) => ({ ...prev, ...next }))}
            />
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</Label>
              <Select value={form.status || 'Draft'} onValueChange={(v) => setForm((prev) => ({ ...prev, status: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Sent">Sent</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-orange-100/80 shadow-sm rounded-2xl">
          <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0 gap-2">
            <CardTitle className="text-base">Line Items</CardTitle>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={goAddProduct}>
                <PackagePlus className="h-4 w-4 mr-1" />Add New Product
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setForm((prev) => ({ ...prev, products: [...prev.products, emptyLine()] }))}
              >
                <Plus className="h-4 w-4 mr-1" />Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {!catalog.length && (
              <div className="rounded-xl border border-dashed border-orange-300 bg-orange-50/60 p-3 text-center space-y-2">
                <p className="text-sm text-gray-700">Catalog empty — pehle product add karein.</p>
                <Button type="button" size="sm" style={{ backgroundColor: accent }} className="text-white" onClick={goAddProduct}>
                  <PackagePlus className="h-4 w-4 mr-1" />Add New Product
                </Button>
              </div>
            )}
            {form.products.map((line, index) => (
              <div key={line._key} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                  <div className="md:col-span-5">
                    <Label className="text-xs">Product * (catalog)</Label>
                    <Select
                      value={catalogValueFor(line)}
                      onValueChange={(v) => pickProduct(index, v)}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select product from catalog" />
                      </SelectTrigger>
                      <SelectContent>
                        {catalog.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!lineHasCatalogProduct(line) && (
                      <p className="text-[11px] text-red-600 mt-1">Product select lazmi hai</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      className="bg-white"
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => setLine(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Rate</Label>
                    <Input
                      className="bg-white"
                      type="number"
                      min={0}
                      value={line.rate}
                      onChange={(e) => setLine(index, 'rate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Amount</Label>
                    <Input readOnly className="bg-white font-semibold" value={formatCurrency((line.quantity || 0) * (line.rate || 0))} />
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={form.products.length === 1}
                      onClick={() => setForm((prev) => ({
                        ...prev,
                        products: prev.products.filter((_, i) => i !== index),
                      }))}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Size</Label>
                    <Input className="bg-white" value={line.size} onChange={(e) => setLine(index, 'size', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Material</Label>
                    <Input className="bg-white" value={line.material} onChange={(e) => setLine(index, 'material', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-xl p-3 flex items-center justify-between" style={{ backgroundColor: '#FFF6ED' }}>
              <span className="text-sm font-medium text-gray-600">Quotation total</span>
              <span className="text-xl font-bold" style={{ color: accent }}>{formatCurrency(total)}</span>
            </div>

            <div>
              <Label className="text-xs">Remarks</Label>
              <Textarea
                rows={2}
                className="bg-white"
                value={form.remarks}
                onChange={(e) => setForm((prev) => ({ ...prev, remarks: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuotationForm;
