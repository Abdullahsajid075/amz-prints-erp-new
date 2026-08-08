import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { productsAPI, ordersAPI, invoicesAPI, customersAPI } from '@/services/api';
import { applyServerNotificationHint } from '@/services/notifications';
import { formatCurrency } from '@/utils/helpers';
import { productImageSrc } from '@/utils/productImage';
import { barcodeBlock, openPrintWindow, printOnLoadScript, POS_MAJOR_SERVICES } from '@/utils/printHelpers';
import { useBrand } from '@/context/BrandContext';
import { Search, Plus, Minus, Trash2, Printer, ShoppingCart, FileSpreadsheet, PackagePlus, UserPlus, Package, Wrench } from 'lucide-react';
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
  const [paymentMethod, setPaymentMethod] = useState('Cash');
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const service = isServiceItem(p);
      if (filter === 'product' && service) return false;
      if (filter === 'service' && !service) return false;
      if (!q) return true;
      return String(p.name || '').toLowerCase().includes(q);
    });
  }, [products, filter, search]);

  const productItems = useMemo(() => filtered.filter((p) => !isServiceItem(p)), [filtered]);
  const serviceItems = useMemo(() => filtered.filter((p) => isServiceItem(p)), [filtered]);

  const renderPosCard = (p) => {
    const img = productImageSrc(p);
    const service = isServiceItem(p);
    return (
      <button
        key={p.id}
        type="button"
        onClick={() => addToCart(p)}
        className="text-left rounded-lg border border-gray-200 bg-white overflow-hidden hover:border-orange-300 hover:shadow-sm transition-all"
        data-testid={`pos-product-${p.id}`}
      >
        <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden relative">
          {img ? (
            <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : service ? (
            <Wrench className="h-5 w-5 text-gray-300" />
          ) : (
            <Package className="h-5 w-5 text-gray-300" />
          )}
          <span className="absolute top-0.5 left-0.5 text-[9px] px-1 rounded bg-white/90 border text-gray-600">
            {service ? 'Svc' : 'Prod'}
          </span>
        </div>
        <div className="p-1.5 space-y-0.5">
          <div className="text-[11px] font-semibold leading-tight line-clamp-2 min-h-[2rem]" style={{ color: '#2E2E2E' }}>
            {p.name}
          </div>
          <div className="text-xs font-bold" style={{ color: primary || '#F26522' }}>
            {formatCurrency(p.rate || p.basePrice)}
          </div>
        </div>
      </button>
    );
  };

  const total = useMemo(
    () => cart.reduce((s, i) => s + i.quantity * i.rate, 0),
    [cart]
  );

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

  const printReceipt = (sale) => {
    const website = company.website || 'https://amzprints.com';
    const logoHtml = company.logo
      ? `<img src="${company.logo}" alt="logo" style="max-height:42px;max-width:140px;display:block;margin:0 auto 4px;filter:grayscale(1);" />`
      : '';
    const code = sale.orderId || sale.id || `POS-${Date.now().toString().slice(-6)}`;
    const rows = (sale.products || [])
      .map(
        (p) =>
          `<tr><td>${p.name}</td><td class="r">${p.quantity}</td><td class="r">${formatCurrency(p.rate)}</td><td class="r">${formatCurrency(p.quantity * p.rate)}</td></tr>`
      )
      .join('');
    const services = POS_MAJOR_SERVICES.map((s) => `<li>${s}</li>`).join('');
    const html = `<!DOCTYPE html><html><head><title>POS ${code}</title>
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
      <div class="total"><span>TOTAL</span><span>${formatCurrency(sale.totalAmount)}</span></div>
      <div class="total" style="font-size:11px;margin-top:2px"><span>PAID</span><span>${formatCurrency(sale.totalAmount)}</span></div>
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
      const payload = {
        customerId: cust.id || WALK_IN.id,
        customerName: cust.name || 'Walk-in',
        customerPhone: cust.phone || '',
        products: productsPayload,
        totalAmount: total,
        advancePayment: total,
        balanceAmount: 0,
        status: 'Delivered',
        remarks: `POS Sale · ${paymentMethod}`,
        docType: 'POS',
        paymentMethod,
      };
      const created = await ordersAPI.create(payload);
      const sale = {
        ...payload,
        customerName: created.data?.customerName || payload.customerName,
        customerPhone: created.data?.customerPhone || payload.customerPhone,
        orderId: created.data?.orderId || created.data?.id,
        id: created.data?.id,
        date: new Date().toLocaleString(),
        paymentMethod,
      };
      setLastSale(sale);
      toast.success(`Sale ${sale.orderId} completed`);
      if (sale.customerPhone && applyServerNotificationHint(created.data)) {
        toast.message('WhatsApp opened — tap Send');
      }
      setCart([]);
      setCustomerId(WALK_IN.id);
      printReceipt(sale);
    } catch (err) {
      console.error(err);
      toast.error('Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="space-y-4" data-testid="pos-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>POS</h1>
          <p className="text-gray-600 mt-1">Quick sale · cash / card · print receipt</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/pos/statement')} data-testid="pos-statement-link">
            <FileSpreadsheet className="h-4 w-4 mr-2" />POS Statement
          </Button>
          <Button variant="outline" onClick={() => navigate('/warehouse/products?new=1')} data-testid="pos-add-product">
            <PackagePlus className="h-4 w-4 mr-2" />Add New Product
          </Button>
          {lastSale && (
            <>
              <Button variant="outline" onClick={() => printReceipt(lastSale)} data-testid="pos-reprint">
                <Printer className="h-4 w-4 mr-2" />Reprint POS slip
              </Button>
              <Button
                variant="outline"
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
                      discount: 0,
                      previousBalance: 0,
                      notes: 'Converted from POS sale',
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
      </div>

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
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {productItems.map(renderPosCard)}
                </div>
              </div>
            )}

            {(filter === 'all' || filter === 'service') && serviceItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between sticky top-0 bg-[#fafafa] z-10 py-1 border-t border-gray-100 pt-3">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-gray-600">Services ({serviceItems.length})</h3>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
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
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                data-testid="pos-customer-select"
              >
                {customerOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || 'Customer'}{c.phone ? ` · ${c.phone}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500">
                Default is Walk-in (one shared customer). Pick another only from saved customers — POS will not create new ones.
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
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
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

            <div className="border-t pt-3 flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-bold" style={{ color: primary || '#F26522' }}>{formatCurrency(total)}</span>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default POS;
