import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ordersAPI, customersAPI, designersAPI, tokensAPI, productsAPI } from '@/services/api';
import { notifyOrderEvent } from '@/services/notifications';
import CustomerPicker, { requireCustomer } from '@/components/shared/CustomerPicker';
import ProductPicker from '@/components/shared/ProductPicker';
import { ORDER_STATUS } from '@/utils/constants';
import { formatCurrency } from '@/utils/helpers';
import { catalogFieldsForOrderLine } from '@/utils/productImage';
import { useBrand } from '@/context/BrandContext';
import { Plus, Trash2, Save, ArrowLeft, ClipboardList, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';

const emptyProduct = () => ({
  _key: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  productId: '',
  name: '',
  quantity: 1,
  rate: 0,
  size: '',
  material: '',
  notes: '',
  description: '',
  productType: 'Product',
});

const isServiceLine = (line, catalog = []) => {
  if (String(line?.productType || '').toLowerCase() === 'service') return true;
  const p = catalog.find((x) => String(x.id) === String(line?.productId || ''));
  return String(p?.productType || '').toLowerCase() === 'service';
};

const OrderForm = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!orderId;
  const prefillTokenNo = searchParams.get('tokenNo') || '';
  const { primary, company } = useBrand();
  const accent = primary || '#F26522';

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    customerId: '',
    assignedDesigner: '',
    deliveryDate: '',
    remarks: '',
    advancePayment: 0,
    status: ORDER_STATUS.RECEIVED,
    tokenNo: '',
    products: [emptyProduct()],
  });

  const [customers, setCustomers] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit);
  const [prefilled, setPrefilled] = useState(false);
  const [originalStatus, setOriginalStatus] = useState('');
  const [originalAdvance, setOriginalAdvance] = useState(0);
  const [loaded, setLoaded] = useState(!isEdit);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await customersAPI.getAll();
      setCustomers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }, []);

  const fetchDesigners = useCallback(async () => {
    try {
      const response = await designersAPI.getAll();
      setDesigners(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching designers:', error);
    }
  }, []);

  const fetchCatalog = useCallback(async () => {
    try {
      const response = await productsAPI.getAll();
      setCatalog(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchOrder = useCallback(async () => {
    setPageLoading(true);
    try {
      const response = await ordersAPI.getById(orderId);
      const o = response.data || {};
      const dateOnly = (d) => {
        if (!d) return '';
        const s = String(d);
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
        try {
          return new Date(d).toISOString().slice(0, 10);
        } catch {
          return '';
        }
      };
      const products = Array.isArray(o.products) && o.products.length
        ? o.products.map((p, i) => {
            const productType = p.productType || (String(p.name || '').toLowerCase().includes('service') ? 'Service' : 'Product');
            const service = String(productType).toLowerCase() === 'service';
            return {
              _key: p._key || p.id || `p_${i}_${Date.now()}`,
              name: p.name || '',
              productId: p.productId || '',
              quantity: service ? 1 : (Number(p.quantity) || 1),
              rate: Number(p.rate) || 0,
              size: service ? '' : (p.size || ''),
              material: service ? '' : (p.material || ''),
              notes: p.notes || '',
              description: p.description || (service ? (p.notes || '') : ''),
              productType: service ? 'Service' : 'Product',
            };
          })
        : [emptyProduct()];

      setFormData({
        customerName: o.customerName || '',
        customerEmail: o.customerEmail || '',
        customerPhone: o.customerPhone || '',
        customerAddress: o.customerAddress || '',
        customerId: o.customerId || '',
        assignedDesigner: o.assignedDesigner || '',
        deliveryDate: dateOnly(o.deliveryDate),
        date: dateOnly(o.date) || dateOnly(new Date()),
        remarks: o.remarks || '',
        advancePayment: Number(o.advancePayment) || 0,
        status: o.status || ORDER_STATUS.RECEIVED,
        tokenNo: o.tokenNo || '',
        products,
        orderId: o.orderId || '',
        quotationId: o.quotationId || '',
        trackingNumber: o.trackingNumber || '',
        deliveryAddress: o.deliveryAddress || o.customerAddress || '',
      });
      setOriginalStatus(o.status || ORDER_STATUS.RECEIVED);
      setOriginalAdvance(Number(o.advancePayment) || 0);
      setLoaded(true);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order');
    } finally {
      setPageLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchCustomers();
    fetchDesigners();
    fetchCatalog();
    if (isEdit) fetchOrder();
  }, [isEdit, fetchCustomers, fetchDesigners, fetchCatalog, fetchOrder]);

  // Prefill from token / query — never overwrite an edit load
  useEffect(() => {
    if (isEdit || prefilled || !loaded) return;
    const customerName = searchParams.get('customerName');
    const customerPhone = searchParams.get('customerPhone');
    const customerId = searchParams.get('customerId');
    const service = searchParams.get('service');
    const tokenNo = searchParams.get('tokenNo');
    if (!customerName && !customerPhone && !service && !tokenNo && !customerId) return;

    setFormData((prev) => ({
      ...prev,
      customerName: customerName || prev.customerName,
      customerPhone: customerPhone || prev.customerPhone,
      customerId: customerId || prev.customerId,
      tokenNo: tokenNo || prev.tokenNo,
      products: service
        ? [{ ...emptyProduct(), name: service }]
        : prev.products,
    }));
    setPrefilled(true);
  }, [isEdit, prefilled, loaded, searchParams]);

  // Auto-link prefilled phone to existing customer record
  useEffect(() => {
    if (isEdit || formData.customerId || !formData.customerPhone || !customers.length) return;
    const digits = String(formData.customerPhone).replace(/\D/g, '');
    if (!digits) return;
    const match = customers.find((c) => {
      const p = String(c.phone || '').replace(/\D/g, '');
      return p && (p === digits || p.slice(-10) === digits.slice(-10));
    });
    if (!match) return;
    setFormData((prev) => ({
      ...prev,
      customerId: match.id,
      customerName: match.name || prev.customerName,
      customerPhone: match.phone || prev.customerPhone,
      customerEmail: match.email || prev.customerEmail,
      customerAddress: match.address || prev.customerAddress,
    }));
  }, [customers, formData.customerId, formData.customerPhone, isEdit]);

  const designerSelectValue = useMemo(() => {
    const v = formData.assignedDesigner;
    if (!v) return undefined;
    const byId = designers.find((d) => String(d.id) === String(v));
    if (byId) return String(byId.id);
    const byName = designers.find((d) => String(d.name).toLowerCase() === String(v).toLowerCase());
    if (byName) return String(byName.id);
    return String(v);
  }, [formData.assignedDesigner, designers]);

  const catalogValueFor = (line) => {
    if (line.productId && catalog.some((p) => String(p.id) === String(line.productId))) {
      return String(line.productId);
    }
    const match = catalog.find((p) => String(p.name).toLowerCase() === String(line.name || '').toLowerCase());
    return match ? String(match.id) : undefined;
  };

  const handleProductChange = (index, field, value) => {
    setFormData((prev) => {
      const products = prev.products.map((p, i) => (i === index ? { ...p, [field]: value } : p));
      return { ...prev, products };
    });
  };

  const pickProduct = (index, productOrId) => {
    if (!productOrId) {
      setFormData((prev) => {
        const products = prev.products.map((line, i) => (
          i === index
            ? { ...emptyProduct(), _key: line._key }
            : line
        ));
        return { ...prev, products };
      });
      return;
    }
    const productId = typeof productOrId === 'object' ? productOrId.id : productOrId;
    const p = catalog.find((x) => String(x.id) === String(productId));
    if (!p) return;
    const fields = catalogFieldsForOrderLine(p);
    setFormData((prev) => {
      const products = prev.products.map((line, i) => (
        i === index
          ? {
              ...line,
              ...fields,
              _key: line._key,
              notes: fields.productType === 'Service' ? (fields.description || '') : (line.notes || ''),
            }
          : line
      ));
      return { ...prev, products };
    });
  };

  const goAddProduct = () => {
    navigate('/warehouse/products?new=1');
  };

  const lineHasCatalogProduct = (line) => Boolean(catalogValueFor(line));

  const addProduct = () => {
    setFormData((prev) => ({ ...prev, products: [...prev.products, emptyProduct()] }));
  };

  const removeProduct = (index) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index),
    }));
  };

  const calculateTotal = () => formData.products.reduce((t, p) => t + (Number(p.quantity) || 0) * (Number(p.rate) || 0), 0);
  const calculateBalance = () => calculateTotal() - (Number(formData.advancePayment) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requireCustomer(formData)) return;
    if (!catalog.length) {
      toast.error('Pehle catalog me product add karein');
      return;
    }
    if (!formData.products.every(lineHasCatalogProduct)) {
      toast.error('Har item pe catalog se product select karein (optional name allowed nahi)');
      return;
    }
    if (isEdit && !orderId) {
      toast.error('Missing order id — refresh and try again (will not create duplicate)');
      return;
    }

    setLoading(true);
    try {
      const designerId = formData.assignedDesigner;
      const designerRow = designers.find((d) => String(d.id) === String(designerId))
        || designers.find((d) => String(d.name).toLowerCase() === String(designerId || '').toLowerCase());
      const designerName = designerRow?.name || formData.assignedDesigner || '';

      const cleanProducts = formData.products.map((p) => {
        const service = isServiceLine(p, catalog);
        return {
          productId: p.productId || '',
          name: p.name || '',
          quantity: service ? 1 : (Number(p.quantity) || 0),
          rate: Number(p.rate) || 0,
          size: service ? '' : (p.size || ''),
          material: service ? '' : (p.material || ''),
          notes: service ? (p.description || p.notes || '') : (p.notes || ''),
          description: service ? (p.description || p.notes || '') : '',
          productType: service ? 'Service' : 'Product',
          // never persist catalog photo onto order lines
        };
      });

      const totalAmount = cleanProducts.reduce((t, p) => t + (p.quantity * p.rate), 0);
      const advancePayment = Number(formData.advancePayment) || 0;
      const orderData = {
        id: isEdit ? orderId : formData.id,
        orderId: formData.orderId || undefined,
        date: formData.date || undefined,
        customerId: formData.customerId || '',
        customerName: formData.customerName || '',
        customerPhone: formData.customerPhone || '',
        customerEmail: formData.customerEmail || '',
        customerAddress: formData.customerAddress || '',
        assignedDesigner: designerName,
        deliveryDate: formData.deliveryDate || '',
        deliveryAddress: formData.deliveryAddress || formData.customerAddress || '',
        remarks: formData.remarks || '',
        advancePayment,
        status: formData.status || ORDER_STATUS.RECEIVED,
        tokenNo: formData.tokenNo || '',
        quotationId: formData.quotationId || '',
        trackingNumber: formData.trackingNumber || undefined,
        products: cleanProducts,
        totalAmount,
        balanceAmount: Math.max(0, totalAmount - advancePayment),
        docType: 'Order',
      };

      const prevStatus = isEdit ? originalStatus : '';

      if (isEdit) {
        const updated = await ordersAPI.update(orderId, orderData);
        toast.success('Order updated successfully');
        const server = updated.data || {};
        const data = {
          ...orderData,
          ...server,
          // Prefer what we just saved if server omits / mis-parses products
          products: (Array.isArray(server.products) && server.products.length)
            ? server.products
            : orderData.products,
          customerName: server.customerName || orderData.customerName,
          customerPhone: server.customerPhone || orderData.customerPhone,
          customerEmail: server.customerEmail || orderData.customerEmail,
          customerAddress: server.customerAddress || orderData.customerAddress,
          assignedDesigner: server.assignedDesigner || orderData.assignedDesigner,
          remarks: server.remarks != null ? server.remarks : orderData.remarks,
          trackingNumber: server.trackingNumber || orderData.trackingNumber,
        };

        // Payments live on invoices — no payment slip from the order form.
        const statusChanged = String(prevStatus) !== String(data.status || orderData.status);
        if (statusChanged) {
          const notify = await notifyOrderEvent({ event: 'status', order: data, sendEmail: false });
          toast.message('WhatsApp opened — tap Send (status update)');
          const gasEmail = server?._notifications?.email;
          if (gasEmail?.ok === false) {
            toast.error(gasEmail.error || 'Status email failed — authorize Mail in Apps Script');
          } else if (gasEmail?.ok) {
            toast.success(`Email sent to ${data.customerEmail}`);
          }
          if (notify?.emailError) toast.error(notify.emailError);
        }
      } else {
        const created = await ordersAPI.create(orderData);
        if (prefillTokenNo || formData.tokenNo) {
          try {
            await tokensAPI.linkOrder(prefillTokenNo || formData.tokenNo, {
              orderId: created.data?.orderId || created.data?.id || '',
            });
            toast.message(`Token ${prefillTokenNo || formData.tokenNo} linked to order`);
          } catch (linkError) {
            console.warn('Token link failed', linkError);
            toast.error(linkError.response?.data?.message || 'Order saved, but token link failed');
          }
        }
        toast.success('Order created successfully');
        const data = { ...orderData, ...(created.data || {}) };
        await notifyOrderEvent({ event: 'created', order: data, sendEmail: false });
        toast.message('WhatsApp opened — tap Send to notify customer');
        const gasEmail = created.data?._notifications?.email;
        if (gasEmail?.ok === false) {
          toast.error(gasEmail.error || 'Order email failed — authorize Mail in Apps Script as amazonprinting@gmail.com');
        } else if (gasEmail?.ok) {
          toast.success(`Order email sent to ${data.customerEmail}`);
        }
      }
      navigate('/orders');
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error(error.response?.data?.message || (isEdit ? 'Failed to update order' : 'Failed to create order'));
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading || (isEdit && !loaded)) {
    return <div className="py-16 text-center text-gray-500">Loading order…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-8" data-testid="order-form">
      <div className="rounded-2xl border border-orange-100 bg-white overflow-hidden shadow-sm">
        <div className="h-1.5" style={{ backgroundColor: accent }} />
        <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="outline" size="sm" onClick={() => navigate('/orders')} data-testid="back-button">
              <ArrowLeft className="h-4 w-4 mr-1.5" />Back
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 shrink-0" style={{ color: accent }} />
                <h1 className="text-xl font-bold truncate" style={{ color: '#2E2E2E' }}>
                  {isEdit ? 'Edit Order' : 'New Order'}
                </h1>
              </div>
              {(formData.orderId || formData.tokenNo || formData.quotationId) && (
                <p className="text-xs text-gray-500 mt-0.5 pl-7">
                  {[formData.orderId, formData.tokenNo && `Token ${formData.tokenNo}`, formData.quotationId && `Quote ${formData.quotationId}`]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
            </div>
          </div>
          <Button
            type="submit"
            form="order-form-el"
            size="sm"
            style={{ backgroundColor: accent }}
            className="text-white"
            disabled={loading}
            data-testid="submit-order-button"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {loading ? 'Saving…' : (isEdit ? 'Update Order' : 'Create Order')}
          </Button>
        </div>
      </div>

      <form id="order-form-el" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-orange-100/80 shadow-sm rounded-2xl">
            <CardHeader className="py-3"><CardTitle className="text-base">Customer</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <CustomerPicker
                customers={customers}
                customerId={formData.customerId}
                customerName={formData.customerName}
                customerPhone={formData.customerPhone}
                customerEmail={formData.customerEmail}
                customerAddress={formData.customerAddress}
                accent={accent}
                onCustomersChange={(c) => setCustomers((prev) => [c, ...prev.filter((x) => x.id !== c.id)])}
                onChange={(next) => setFormData((prev) => ({ ...prev, ...next }))}
              />
            </CardContent>
          </Card>

          <Card className="border-orange-100/80 shadow-sm rounded-2xl">
            <CardHeader className="py-3"><CardTitle className="text-base">Order Details</CardTitle></CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Assigned Designer</Label>
                  <Select
                    value={designerSelectValue}
                    onValueChange={(value) => {
                      const d = designers.find((x) => String(x.id) === String(value));
                      setFormData((prev) => ({
                        ...prev,
                        assignedDesigner: d?.name || value,
                      }));
                    }}
                  >
                    <SelectTrigger data-testid="designer-select"><SelectValue placeholder="Select designer" /></SelectTrigger>
                    <SelectContent>
                      {designers.map((designer) => (
                        <SelectItem key={designer.id} value={String(designer.id)}>
                          {designer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Delivery Date *</Label>
                  <Input
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, deliveryDate: e.target.value }))}
                    required
                    data-testid="delivery-date-input"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={formData.status || ORDER_STATUS.RECEIVED}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger data-testid="status-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.values(ORDER_STATUS).map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Remarks</Label>
                <Textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData((prev) => ({ ...prev, remarks: e.target.value }))}
                  rows={2}
                  data-testid="remarks-input"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-orange-100/80 shadow-sm rounded-2xl">
          <CardHeader className="py-3 flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">Products / Items</CardTitle>
            <Button type="button" size="sm" variant="outline" onClick={goAddProduct} data-testid="goto-add-product">
              <PackagePlus className="h-4 w-4 mr-1.5" />
              Add New Product
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {!catalog.length && (
              <div className="rounded-xl border border-dashed border-orange-300 bg-orange-50/60 p-4 text-center space-y-2">
                <p className="text-sm text-gray-700">Catalog khali hai — pehle product add karein, phir order book karein.</p>
                <Button type="button" size="sm" style={{ backgroundColor: accent }} className="text-white" onClick={goAddProduct}>
                  <PackagePlus className="h-4 w-4 mr-1.5" />
                  Add New Product
                </Button>
              </div>
            )}
            {formData.products.map((product, index) => {
              const service = isServiceLine(product, catalog);
              return (
              <div key={product._key} className="rounded-xl border border-gray-100 bg-white p-3 space-y-2 shadow-sm" data-testid={`product-${index}`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Item {index + 1}{service ? ' · Service' : ''}
                  </p>
                  {formData.products.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeProduct(index)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
                {service ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="sm:col-span-2">
                      <ProductPicker
                        catalog={catalog}
                        value={catalogValueFor(product) || ''}
                        selectedName={product.name}
                        onSelect={(p) => pickProduct(index, p)}
                        label="Service * (type to search)"
                        placeholder="Type any word to find service…"
                        testId={`product-select-${index}`}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs">Description *</Label>
                      <Textarea
                        className="bg-white min-h-[72px]"
                        value={product.description || product.notes || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            products: prev.products.map((p, i) => (
                              i === index ? { ...p, description: v, notes: v } : p
                            )),
                          }));
                        }}
                        placeholder="Service details…"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Service Charges *</Label>
                      <Input
                        className="bg-white h-9"
                        type="number"
                        min="0"
                        step="0.01"
                        value={product.rate}
                        onChange={(e) => handleProductChange(index, 'rate', parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Amount</Label>
                      <Input className="bg-orange-50 h-9 font-semibold" value={formatCurrency(Number(product.rate) || 0)} disabled />
                    </div>
                  </div>
                ) : (
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  <div className="col-span-2 sm:col-span-3">
                    <ProductPicker
                      catalog={catalog}
                      value={catalogValueFor(product) || ''}
                      selectedName={product.name}
                      onSelect={(p) => pickProduct(index, p)}
                      label="Product * (type to search)"
                      placeholder="Type any word to find product…"
                      testId={`product-select-${index}`}
                      required
                    />
                    {!lineHasCatalogProduct(product) && (
                      <p className="text-[11px] text-red-600 mt-1">Product select karna lazmi hai</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs">Qty *</Label>
                    <Input
                      className="bg-white h-9"
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) => handleProductChange(index, 'quantity', parseInt(e.target.value, 10) || 1)}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Rate *</Label>
                    <Input
                      className="bg-white h-9"
                      type="number"
                      min="0"
                      step="0.01"
                      value={product.rate}
                      onChange={(e) => handleProductChange(index, 'rate', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Amount</Label>
                    <Input className="bg-orange-50 h-9 font-semibold" value={formatCurrency((product.quantity || 0) * (product.rate || 0))} disabled />
                  </div>
                  <div>
                    <Label className="text-xs">Size</Label>
                    <Input className="bg-white h-9" value={product.size} onChange={(e) => handleProductChange(index, 'size', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs">Material</Label>
                    <Input className="bg-white h-9" value={product.material} onChange={(e) => handleProductChange(index, 'material', e.target.value)} />
                  </div>
                  <div className="col-span-2 sm:col-span-4">
                    <Label className="text-xs">Notes</Label>
                    <Input className="bg-white h-9" value={product.notes} onChange={(e) => handleProductChange(index, 'notes', e.target.value)} />
                  </div>
                </div>
                )}
              </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed border-orange-300 text-orange-700 hover:bg-orange-50"
              onClick={addProduct}
              data-testid="add-product-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add more items
            </Button>
          </CardContent>
        </Card>

        <Card className="border-orange-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1" style={{ backgroundColor: accent }} />
          <CardHeader className="py-3"><CardTitle className="text-base">Payment summary</CardTitle></CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl p-3 bg-[#FFF9F5] border border-orange-100">
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Order Total</p>
                <p className="font-bold text-xl" style={{ color: accent }}>{formatCurrency(calculateTotal())}</p>
              </div>
              <div>
                <Label className="text-xs">Shown received</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.advancePayment}
                  onChange={(e) => setFormData((prev) => ({ ...prev, advancePayment: parseFloat(e.target.value) || 0 }))}
                  disabled={isEdit}
                  data-testid="advance-payment-input"
                />
              </div>
              <div className="rounded-xl p-3 bg-gray-50 border border-gray-100">
                <p className="text-[10px] uppercase tracking-wide text-gray-500">Balance Due</p>
                <p className="font-bold text-xl text-gray-900">{formatCurrency(calculateBalance())}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Payments are recorded on the Invoice, POS, or customer ledger — not as order payment lines.
            </p>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            style={{ backgroundColor: accent }}
            className="text-white"
            disabled={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving…' : (isEdit ? 'Update Order' : 'Create Order')}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/orders')} data-testid="cancel-button">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
