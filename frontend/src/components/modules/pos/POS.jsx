import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { productsAPI, ordersAPI, invoicesAPI } from '@/services/api';
import { applyServerNotificationHint } from '@/services/notifications';
import { formatCurrency } from '@/utils/helpers';
import { barcodeBlock, openPrintWindow, printOnLoadScript, POS_MAJOR_SERVICES } from '@/utils/printHelpers';
import { useBrand } from '@/context/BrandContext';
import { Search, Plus, Minus, Trash2, Printer, ShoppingCart, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const POS = () => {
  const navigate = useNavigate();
  const { company, primary } = useBrand();
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Walk-in');
  const [customerPhone, setCustomerPhone] = useState('');
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

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const type = String(p.productType || p.category || 'Product');
      if (filter === 'product' && !/product/i.test(type)) return false;
      if (filter === 'service' && !/service/i.test(type)) return false;
      if (!search) return true;
      return String(p.name || '').toLowerCase().includes(search.toLowerCase());
    });
  }, [products, filter, search]);

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
      const payload = {
        customerName: customerName || 'Walk-in',
        customerPhone,
        products: productsPayload,
        totalAmount: total,
        advancePayment: total,
        balanceAmount: 0,
        status: 'Delivered',
        remarks: `POS Sale · ${paymentMethod}`,
        docType: 'Order',
        paymentMethod,
      };
      const created = await ordersAPI.create(payload);
      const sale = {
        ...payload,
        orderId: created.data?.orderId || created.data?.id,
        id: created.data?.id,
        date: new Date().toLocaleString(),
        paymentMethod,
      };
      setLastSale(sale);
      toast.success(`Sale ${sale.orderId} completed`);
      if (customerPhone && applyServerNotificationHint(created.data)) {
        toast.message('WhatsApp opened — tap Send');
      }
      setCart([]);
      setCustomerName('Walk-in');
      setCustomerPhone('');
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
        {lastSale && (
          <div className="flex flex-wrap gap-2">
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
          </div>
        )}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[70vh] overflow-y-auto pr-1">
            {filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addToCart(p)}
                className="text-left rounded-xl border border-gray-100 bg-white p-3 hover:shadow-md transition-all"
                data-testid={`pos-product-${p.id}`}
              >
                <div className="font-semibold text-sm truncate" style={{ color: '#2E2E2E' }}>{p.name}</div>
                <Badge variant="outline" className="mt-1 text-[10px]">{p.productType || 'Product'}</Badge>
                <div className="mt-2 font-bold" style={{ color: primary || '#F26522' }}>
                  {formatCurrency(p.rate || p.basePrice)}
                </div>
              </button>
            ))}
            {!filtered.length && <p className="col-span-full text-center text-gray-500 py-8">No items</p>}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Customer</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Optional" />
              </div>
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
