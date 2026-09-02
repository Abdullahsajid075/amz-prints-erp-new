import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { productsAPI, ordersAPI, invoicesAPI, customersAPI } from '@/services/api';
import { applyServerNotificationHint, openWhatsAppChat } from '@/services/notifications';
import { formatCurrency } from '@/utils/helpers';
import { customerMatchesQuery } from '@/utils/customerSearch';
import { productMatchesQuery } from '@/utils/productSearch';
import { barcodeBlock, openPrintWindow, printOnLoadScript, POS_MAJOR_SERVICES, documentFileName } from '@/utils/printHelpers';
import { useBrand } from '@/context/BrandContext';
import { Search, Plus, Minus, Trash2, Printer, ShoppingCart, FileSpreadsheet, PackagePlus, UserPlus, Package, Wrench } from 'lucide-react';
import { WhatsAppIcon } from '@/components/shared/WhatsAppIcon';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const isServiceItem = (p) => {
  const type = String(p?.productType || '').toLowerCase();
  if (type === 'service') return true;
  if (type === 'product') return false;
  return /service/i.test(String(p?.category || ''));
};

const WALK_IN = { id: 'cust_walkin', name: 'Walk-in', phone: '' };

const POS = () => {
  const navigate = useNavigate();
  const { company, primary } = useBrand();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState(WALK_IN.id);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerListOpen, setCustomerListOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discountType, setDiscountType] = useState('amount'); // amount | percent
  const [discountValue, setDiscountValue] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [waPhone, setWaPhone] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  const loadProducts = useCallback(async () => {
    try {
      const res = await productsAPI.getAll();
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load products');
    }
  }, []);

  const loadCustomers = useCallback(async () => {
    try {
      const res = await customersAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : [];
      setCustomers(list);
    } catch (err) {
      console.error(err);
      setCustomers([]);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, [loadProducts, loadCustomers]);

  const selectedCustomer = useMemo(() => {
    if (!customerId || customerId === WALK_IN.id) {
      const existingWalk = customers.find((c) => {
        const n = String(c.name || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
        return c.id === WALK_IN.id || n === 'walkin' || n === 'walking';
      });
      return existingWalk || WALK_IN;
    }
    return customers.find((c) => c.id === customerId) || WALK_IN;
  }, [customerId, customers]);

  const customerOptions = useMemo(() => {
    const walk = customers.find((c) => {
      const n = String(c.name || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
      return c.id === WALK_IN.id || n === 'walkin' || n === 'walking';
    });
    const rest = customers.filter((c) => c !== walk && c.id !== WALK_IN.id);
    const walkOpt = walk || WALK_IN;
    return [walkOpt, ...rest.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))];
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim();
    if (!q) return customerOptions.slice(0, 60);
    return customerOptions.filter((c) => customerMatchesQuery(c, q)).slice(0, 60);
  }, [customerOptions, customerQuery]);

  const filtered = useMemo(() => {
    const q = search.trim();
    return products.filter((p) => {
      const service = isServiceItem(p);
      if (filter === 'product' && service) return false;
      if (filter === 'service' && !service) return false;
      if (!q) return true;
      return productMatchesQuery(p, q);
    });
  }, [products, filter, search]);

  const productItems = useMemo(() => filtered.filter((p) => !isServiceItem(p)), [filtered]);
  const serviceItems = useMemo(() => filtered.filter((p) => isServiceItem(p)), [filtered]);

  const renderPosCard = (p) => {
    const service = isServiceItem(p);
    return (
      <button
        key={p.id}
        type="button"
        onClick={() => addToCart(p)}
        className="text-left rounded-xl border-2 border-gray-700 bg-white p-4 hover:border-orange-500 hover:shadow-md transition-all"
        data-testid={`pos-product-${p.id}`}
      >
        <div className="flex items-center gap-2 mb-2">
          {service ? <Wrench className="h-4 w-4 text-gray-600" /> : <Package className="h-4 w-4 text-gray-600" />}
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-gray-600 text-gray-700">
            {service ? 'Service' : 'Product'}
          </span>
        </div>
        <div className="text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem]" style={{ color: '#2E2E2E' }}>
          {p.name}
        </div>
        <div className="text-base font-bold mt-2" style={{ color: primary || '#F26522' }}>
          {formatCurrency(p.rate || p.basePrice)}
        </div>
      </button>
    );
  };

  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + i.quantity * i.rate, 0),
    [cart]
  );

  const discountAmount = useMemo(() => {
    const raw = Number(discountValue) || 0;
    if (raw <= 0 || subtotal <= 0) return 0;
    if (discountType === 'percent') {
      return Math.min(subtotal, Math.round((subtotal * Math.min(100, raw)) / 100));
    }
    return Math.min(subtotal, Math.max(0, raw));
  }, [discountType, discountValue, subtotal]);

  const payable = Math.max(0, subtotal - discountAmount);
  const receivedNum = Number(receivedAmount);
  const cashReceived = Number.isFinite(receivedNum) && String(receivedAmount).trim() !== ''
    ? Math.max(0, receivedNum)
    : payable;
  const changeBack = Math.max(0, cashReceived - payable);

  useEffect(() => {
    setWaPhone(String(selectedCustomer?.phone || ''));
  }, [selectedCustomer?.id, selectedCustomer?.phone]);

  const addToCart = (product) => {
    const rate = Number(product.rate || product.basePrice || 0);
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.productId === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          rate,
          quantity: 1,
          size: product.size || '',
          material: product.material || '',
        },
      ];
    });
  };

  const updateQty = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((c) => (c.productId === productId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const setQtyManual = (productId, raw) => {
    const n = Math.floor(Number(raw));
    if (!Number.isFinite(n)) return;
    setCart((prev) =>
      prev
        .map((c) => (c.productId === productId ? { ...c, quantity: n } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const clearCart = () => {
    if (!cart.length) return;
    setCart([]);
    setDiscountValue('');
    setDiscountType('amount');
    setReceivedAmount('');
    toast.message('Cart cleared');
  };

  const printReceipt = (sale) => {
    const website = company.website || 'https://amzprints.com';
    const logoHtml = company.logo
      ? `<img src="${company.logo}" alt="logo" style="max-height:42px;max-width:140px;display:block;margin:0 auto 4px;filter:grayscale(1);" />`
      : '';
    const code = sale.orderId || sale.id || `POS-${Date.now().toString().slice(-6)}`;
    const printTitle = documentFileName({
      docType: 'POS',
      customerName: sale.customerName,
      orderNumber: code,
    });
    const rows = (sale.products || [])
      .map(
        (p) =>
          `<tr><td>${p.name}</td><td class="r">${p.quantity}</td><td class="r">${formatCurrency(p.rate)}</td><td class="r">${formatCurrency(p.quantity * p.rate)}</td></tr>`
      )
      .join('');
    const services = POS_MAJOR_SERVICES.map((s) => `<li>${s}</li>`).join('');
    const html = `<!DOCTYPE html><html><head><title>${printTitle}</title>
      <style>
        @page { size: 80mm auto; margin: 3mm; }
        body { font-family: Arial, Helvetica, sans-serif; width: 72mm; margin: 0; color: #000; font-size: 11px; }
        h1 { font-size: 14px; margin: 0; text-align: center; font-weight: 800; }
        .tag { text-align: center; font-size: 9px; margin-top: 2px; }
        .center { text-align: center; }
        .title { text-align:center; font-weight:800; letter-spacing:0.12em; font-size:11px;
          border-top:2px solid #000; border-bottom:2px solid #000; padding:4px 0; margin:6px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 6px; }
        td, th { padding: 2px 0; font-size: 10px; }
        th { border-bottom: 1px solid #000; text-align:left; }
        .r { text-align: right; }
        hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
        .total { font-size: 13px; font-weight: 800; display:flex; justify-content:space-between; }
        .services { font-size: 9px; margin: 6px 0 0; padding-left: 14px; }
        .services li { margin: 1px 0; }
        .barcode-wrap { text-align:center; margin-top:6px; }
      </style></head><body>
      ${logoHtml}
      <h1>${company.name || 'Amazon Printing Services'}</h1>
      <div class="tag">${company.address || 'King Road, Mandi Bahauddin'}</div>
      <div class="center" style="font-size:9px;margin-top:2px">${company.phone || ''} · ${website.replace(/^https?:\/\//, '')}</div>
      <div class="title">POS RECEIPT</div>
      <div>Sale: <strong>${code}</strong></div>
      <div>Customer: ${sale.customerName || 'Walk-in'}</div>
      <div>Phone: ${sale.customerPhone || '—'}</div>
      <div>Pay: ${sale.paymentMethod || paymentMethod}</div>
      <div>Date: ${sale.date || new Date().toLocaleString()}</div>
      <hr />
      <table>
        <thead><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amt</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <hr />
      ${Number(sale.subtotal) > 0 && Number(sale.discount) > 0
        ? `<div class="total" style="font-size:11px;font-weight:600"><span>SUBTOTAL</span><span>${formatCurrency(sale.subtotal)}</span></div>
           <div class="total" style="font-size:11px;font-weight:600"><span>DISCOUNT</span><span>-${formatCurrency(sale.discount)}</span></div>`
        : ''}
      <div class="total"><span>TOTAL</span><span>${formatCurrency(sale.totalAmount)}</span></div>
      <div class="total" style="font-size:11px;margin-top:2px"><span>RECEIVED</span><span>${formatCurrency(sale.receivedAmount != null ? sale.receivedAmount : sale.totalAmount)}</span></div>
      <div class="total" style="font-size:11px;margin-top:2px"><span>CHANGE</span><span>${formatCurrency(sale.changeBack != null ? sale.changeBack : 0)}</span></div>
      <hr />
      <div style="font-size:9px;font-weight:800;letter-spacing:0.06em">OUR MAJOR SERVICES</div>
      <ol class="services">${services}</ol>
      ${barcodeBlock(code, { height: 30 })}
      <div class="center" style="margin-top:6px;font-size:10px">Thank you for your business!</div>
      ${printOnLoadScript(500)}
      </body></html>`;
    const res = openPrintWindow(html, { width: 360, height: 740 });
    if (!res.ok) toast.error('Allow popups to print receipt');
  };

  const buildPosWhatsAppReceipt = (sale) => {
    const companyName = company?.name || 'Amazon Printing Services';
    const lines = (sale.products || [])
      .map((p) => `• ${p.name} × ${p.quantity} = ${formatCurrency(p.quantity * p.rate)}`)
      .join('\n');
    return (
      `*${companyName} — POS Receipt*\n`
      + `Sale: *${sale.orderId || sale.id}*\n`
      + `Customer: ${sale.customerName || 'Walk-in'}\n`
      + `${lines}\n`
      + (Number(sale.discount) > 0 ? `Discount: -${formatCurrency(sale.discount)}\n` : '')
      + `Total: *${formatCurrency(sale.totalAmount)}*\n`
      + `Received: ${formatCurrency(sale.receivedAmount != null ? sale.receivedAmount : sale.totalAmount)}\n`
      + `Change: ${formatCurrency(sale.changeBack != null ? sale.changeBack : 0)}\n`
      + `Pay: ${sale.paymentMethod || 'Cash'}\n`
      + `\nThank you!`
    );
  };

  const sendPosWhatsApp = (sale, phoneOverride) => {
    const phone = String(phoneOverride || sale?.customerPhone || waPhone || '').trim();
    if (!phone) {
      toast.error('Enter WhatsApp number');
      return;
    }
    if (!sale) {
      toast.error('Complete a sale first');
      return;
    }
    const result = openWhatsAppChat(phone, buildPosWhatsAppReceipt({ ...sale, customerPhone: phone }));
    if (!result.ok) toast.error('Could not open WhatsApp');
    else toast.message('WhatsApp receipt opened — tap Send');
  };

  const checkout = async () => {
    if (!cart.length) {
      toast.error('Cart is empty');
      return;
    }
    setCheckingOut(true);
    try {
      const productsPayload = cart.map(({ name, quantity, rate, size, material }) => ({
        name,
        quantity,
        rate,
        size,
        material,
      }));
      const cust = selectedCustomer || WALK_IN;
      const phoneForSale = String(waPhone || cust.phone || '').trim();
      const discNote = discountAmount > 0
        ? ` · Disc ${discountType === 'percent' ? `${Number(discountValue) || 0}%` : ''} Rs ${discountAmount} (sub ${subtotal})`
        : '';
      const payload = {
        customerId: cust.id || WALK_IN.id,
        customerName: cust.name || 'Walk-in',
        customerPhone: phoneForSale,
        products: productsPayload,
        totalAmount: payable,
        advancePayment: payable,
        balanceAmount: 0,
        status: 'Delivered',
        remarks: `POS Sale · ${paymentMethod}${discNote} · Recv ${cashReceived} · Change ${changeBack}`,
        docType: 'POS',
        paymentMethod,
      };
      const created = await ordersAPI.create(payload);
      const sale = {
        ...payload,
        customerName: created.data?.customerName || payload.customerName,
        customerPhone: phoneForSale || created.data?.customerPhone || payload.customerPhone,
        orderId: created.data?.orderId || created.data?.id,
        id: created.data?.id,
        date: new Date().toLocaleString(),
        paymentMethod,
        subtotal,
        discount: discountAmount,
        discountType,
        discountValue: Number(discountValue) || 0,
        receivedAmount: cashReceived,
        changeBack,
      };
      setLastSale(sale);
      toast.success(`Sale ${sale.orderId} completed`);
      if (created.data?._invoiceError) toast.error(created.data._invoiceError);
      else if (created.data?.invoiceNumber) toast.message(`Invoice ${created.data.invoiceNumber} created`);
      if (sale.customerPhone && applyServerNotificationHint(created.data)) {
        toast.message('WhatsApp opened — tap Send');
      }
      setCart([]);
      setCustomerId(WALK_IN.id);
      setDiscountValue('');
      setDiscountType('amount');
      setReceivedAmount('');
      printReceipt(sale);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="erp-page space-y-4" data-testid="pos-page">
      <PageHeader
        eyebrow="Sales"
        title="POS Counter"
        subtitle="Quick sale · cash / card · print receipt"
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => navigate('/pos/statement')} data-testid="pos-statement-link">
              <FileSpreadsheet className="h-4 w-4 mr-2" />POS Statement
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => navigate('/warehouse/products?new=1')} data-testid="pos-add-product">
              <PackagePlus className="h-4 w-4 mr-2" />Add New Product
            </Button>
            {lastSale && (
              <>
                <Button variant="outline" className="rounded-xl" onClick={() => printReceipt(lastSale)} data-testid="pos-reprint">
                  <Printer className="h-4 w-4 mr-2" />Reprint POS slip
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl text-green-700 border-green-200 hover:bg-green-50"
                  onClick={() => sendPosWhatsApp(lastSale, waPhone || lastSale.customerPhone)}
                  data-testid="pos-whatsapp-last"
                >
                  <WhatsAppIcon className="h-4 w-4 mr-2" />Send WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={async () => {
                    try {
                      const inv = {
                        invoiceNumber: `INV-POS-${Date.now().toString().slice(-6)}`,
                        orderId: lastSale.orderId || '',
                        customerName: lastSale.customerName || 'Walk-in',
                        customerPhone: lastSale.customerPhone || '',
                        items: (lastSale.products || []).map((p) => ({
                          name: p.name,
                          quantity: p.quantity,
                          rate: p.rate,
                          size: p.size || '',
                          material: p.material || '',
                        })),
                        paidAmount: lastSale.totalAmount || 0,
                        taxRate: 0,
                        discount: Number(lastSale.discount) || 0,
                        previousBalance: 0,
                        notes: Number(lastSale.discount) > 0
                          ? `Converted from POS sale · Discount Rs ${lastSale.discount}`
                          : 'Converted from POS sale',
                        date: new Date().toISOString().slice(0, 10),
                      };
                      const created = await invoicesAPI.create(inv);
                      toast.success('POS sale converted to invoice');
                      navigate(`/invoices/${created.data?.id || ''}`);
                    } catch (err) {
                      console.error(err);
                      toast.error('Failed to convert to invoice');
                    }
                  }}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />Convert to Invoice
                </Button>
              </>
            )}
          </div>
        )}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input className="pl-10" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {['all', 'product', 'service'].map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'default' : 'outline'}
                style={filter === f ? { backgroundColor: primary || '#F26522' } : undefined}
                className={filter === f ? 'text-white' : ''}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'product' ? 'Products' : 'Services'}
              </Button>
            ))}
          </div>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {!filtered.length && (
              <div className="text-center text-gray-500 py-8 space-y-3 border border-dashed rounded-xl">
                <p>No items in catalog</p>
                <Button size="sm" style={{ backgroundColor: primary || '#F26522' }} className="text-white" onClick={() => navigate('/warehouse/products?new=1')}>
                  <PackagePlus className="h-4 w-4 mr-2" />Add New Product
                </Button>
              </div>
            )}

            {(filter === 'all' || filter === 'product') && productItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between sticky top-0 bg-[#fafafa]/z-10 py-1">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600">Products ({productItems.length})</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {productItems.map(renderPosCard)}
                </div>
              </div>
            )}

            {(filter === 'all' || filter === 'service') && serviceItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between sticky top-0 bg-[#fafafa] z-10 py-1 border-t border-gray-100 pt-3">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600">Services ({serviceItems.length})</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {serviceItems.map(renderPosCard)}
                </div>
              </div>
            )}
          </div>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" style={{ color: primary || '#F26522' }} />
              Cart
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Customer</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={() => navigate('/customers?new=1')}
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1" />Add in Customers
                </Button>
              </div>
              <div className="relative">
                <div className="rounded-md border bg-white px-3 py-2 text-sm mb-1">
                  <span className="font-medium">{selectedCustomer?.name || 'Walk-in'}</span>
                  {selectedCustomer?.phone ? (
                    <span className="text-gray-500 text-xs"> · {selectedCustomer.phone}</span>
                  ) : null}
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    className="pl-8 h-9 text-sm"
                    placeholder="Search customer name or phone…"
                    value={customerQuery}
                    data-testid="pos-customer-select"
                    onFocus={() => setCustomerListOpen(true)}
                    onChange={(e) => {
                      setCustomerQuery(e.target.value);
                      setCustomerListOpen(true);
                    }}
                    onBlur={() => setTimeout(() => setCustomerListOpen(false), 150)}
                  />
                </div>
                {customerListOpen && (
                  <div className="absolute z-40 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 border-b font-medium"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setCustomerId(WALK_IN.id);
                        setCustomerQuery('');
                        setCustomerListOpen(false);
                      }}
                    >
                      Walk-in
                    </button>
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 border-b last:border-0"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setCustomerId(c.id);
                          setCustomerQuery('');
                          setCustomerListOpen(false);
                        }}
                      >
                        <span className="font-medium">{c.name || 'Customer'}</span>
                        {c.phone ? <span className="text-gray-500"> · {c.phone}</span> : null}
                      </button>
                    ))}
                    {!filteredCustomers.length && (
                      <p className="px-3 py-2 text-xs text-gray-500">No match — add customer in Customers page</p>
                    )}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-gray-500">
                Default is Walk-in. Type name/phone to find saved customers.
              </p>
            </div>
            <div>
              <Label>Payment</Label>
              <div className="flex gap-2 mt-1">
                {['Cash', 'Card'].map((m) => (
                  <Button
                    key={m}
                    type="button"
                    size="sm"
                    variant={paymentMethod === m ? 'default' : 'outline'}
                    style={paymentMethod === m ? { backgroundColor: primary || '#F26522' } : undefined}
                    className={paymentMethod === m ? 'text-white' : ''}
                    onClick={() => setPaymentMethod(m)}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Label className="mb-0">Cart ({cart.length})</Label>
              {!!cart.length && (
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200" onClick={clearCart} data-testid="pos-clear-cart">
                  Clear
                </Button>
              )}
            </div>
            <div className="space-y-2 max-h-[36vh] overflow-y-auto">
              {!cart.length && <p className="text-sm text-gray-500 text-center py-6">Tap products to add</p>}
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center gap-2 border rounded-lg p-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.name}</div>
                    <div className="text-xs text-gray-500">{formatCurrency(item.rate)} each</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.productId, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => setQtyManual(item.productId, e.target.value)}
                      className="h-7 w-14 text-center text-sm font-semibold px-1"
                      data-testid={`pos-qty-${item.productId}`}
                    />
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQty(item.productId, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="w-20 text-right text-sm font-bold">{formatCurrency(item.quantity * item.rate)}</div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCart((c) => c.filter((x) => x.productId !== item.productId))}>
                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 space-y-2">
              <div>
                <Label>Discount</Label>
                <div className="flex gap-2 mt-1">
                  <div className="flex gap-1">
                    {[
                      { key: 'amount', label: 'Rs' },
                      { key: 'percent', label: '%' },
                    ].map((m) => (
                      <Button
                        key={m.key}
                        type="button"
                        size="sm"
                        variant={discountType === m.key ? 'default' : 'outline'}
                        style={discountType === m.key ? { backgroundColor: primary || '#F26522' } : undefined}
                        className={`h-9 ${discountType === m.key ? 'text-white' : ''}`}
                        onClick={() => setDiscountType(m.key)}
                      >
                        {m.label}
                      </Button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step={discountType === 'percent' ? '1' : '1'}
                    placeholder={discountType === 'percent' ? '0%' : '0'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="h-9"
                    data-testid="pos-discount-input"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-sm text-emerald-700">
                  <span>Discount{discountType === 'percent' ? ` (${Number(discountValue) || 0}%)` : ''}</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total due</span>
                <span className="text-2xl font-bold" style={{ color: primary || '#F26522' }}>{formatCurrency(payable)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <Label className="text-xs">Received amount</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder={String(payable || 0)}
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    className="h-9"
                    data-testid="pos-received-amount"
                  />
                </div>
                <div>
                  <Label className="text-xs">Change back</Label>
                  <Input
                    className="h-9 bg-emerald-50 font-semibold text-emerald-800"
                    value={formatCurrency(changeBack)}
                    disabled
                    data-testid="pos-change-back"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">WhatsApp number</Label>
                <Input
                  className="h-9"
                  placeholder="03XXXXXXXXX"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  data-testid="pos-wa-phone"
                />
                <p className="text-[11px] text-gray-500 mt-1">Edit manually if needed, then send receipt.</p>
              </div>
            </div>
            <Button
              className="w-full text-white"
              style={{ backgroundColor: primary || '#F26522' }}
              disabled={checkingOut || !cart.length}
              onClick={checkout}
              data-testid="pos-checkout"
            >
              {checkingOut ? 'Processing…' : 'Checkout & Print'}
            </Button>
            <Button
              type="button"
              className="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white"
              disabled={!lastSale && !cart.length}
              onClick={() => {
                if (lastSale) sendPosWhatsApp(lastSale, waPhone);
                else toast.message('Complete checkout first, then send WhatsApp receipt');
              }}
              data-testid="pos-whatsapp-send"
            >
              <WhatsAppIcon className="h-4 w-4 mr-2" />
              Send WhatsApp receipt
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default POS;
