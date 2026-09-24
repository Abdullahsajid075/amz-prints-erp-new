import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { productsAPI, ordersAPI, invoicesAPI, customersAPI, posRegisterAPI, settingsAPI } from '@/services/api';
import { applyServerNotificationHint, openWhatsAppChat } from '@/services/notifications';
import { formatCurrency } from '@/utils/helpers';
import { customerMatchesQuery } from '@/utils/customerSearch';
import { productMatchesQuery } from '@/utils/productSearch';
import { printPosSlip, buildPosWhatsAppReceipt } from '@/utils/posSlip';
import { mergePosSettings, mergeInventorySettings } from '@/utils/moduleSettings';
import { useBrand } from '@/context/BrandContext';
import {
  Search, Plus, Minus, Trash2, Printer, PackagePlus, UserPlus, Package, Wrench,
  Lock, Unlock, BookOpen, Settings, Clock, LayoutGrid, Pause, RotateCcw,
  Banknote, CreditCard, Building2, Quote, User,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/shared/WhatsAppIcon';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth, getUserDisplayName } from '@/context/AuthContext';
import { productImageSrc } from '@/utils/productImage';
import { isServiceItem, tracksInventory } from '@/utils/inventoryTrack';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const WALK_IN = { id: 'cust_walkin', name: 'Walk-in', phone: '' };
const HOLD_KEY = 'amz_pos_held_sale';
const LAST_SALE_KEY = 'amz_pos_last_sale';

const POS = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { company, primary } = useBrand();
  const accent = primary || '#ff6d00';
  const cashier = getUserDisplayName(user) || 'Cashier';

  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState(WALK_IN.id);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerListOpen, setCustomerListOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discountType, setDiscountType] = useState('amount');
  const [discountValue, setDiscountValue] = useState('');
  const [taxPercent, setTaxPercent] = useState('');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [waPhone, setWaPhone] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [lastSale, setLastSale] = useState(() => {
    try {
      const raw = sessionStorage.getItem(LAST_SALE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [register, setRegister] = useState({ current: null, history: [], totals: {} });
  const [openDlg, setOpenDlg] = useState(false);
  const [closeDlg, setCloseDlg] = useState(false);
  const [openingFloat, setOpeningFloat] = useState('0');
  const [countedCash, setCountedCash] = useState('');
  const [regNote, setRegNote] = useState('');
  const [regBusy, setRegBusy] = useState(false);
  const [confirmedClose, setConfirmedClose] = useState(false);
  const [posCfg, setPosCfg] = useState(mergePosSettings({}));
  const [invCfg, setInvCfg] = useState(mergeInventorySettings({}));
  const [clock, setClock] = useState(() => new Date());
  const [registerReady, setRegisterReady] = useState(false);

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
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setCustomers([]);
    }
  }, []);

  const loadRegister = useCallback(async () => {
    try {
      const res = await posRegisterAPI.get();
      setRegister(res.data || { current: null, history: [], totals: {} });
    } catch {
      setRegister({ current: null, history: [], totals: {} });
    } finally {
      setRegisterReady(true);
    }
  }, []);

  useEffect(() => { loadProducts(); loadCustomers(); }, [loadProducts, loadCustomers]);
  useEffect(() => { loadRegister(); }, [loadRegister]);
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    settingsAPI.get().then((res) => {
      const data = res.data || {};
      const nextPos = mergePosSettings(data);
      setPosCfg(nextPos);
      setInvCfg(mergeInventorySettings(data));
      if (nextPos.defaultPayment) setPaymentMethod(nextPos.defaultPayment);
    }).catch(() => {});
  }, []);

  const registerOpen = !!register.current;

  useEffect(() => {
    if (!registerReady) return undefined;
    if (registerOpen) {
      setOpenDlg(false);
      return undefined;
    }
    setOpenDlg(true);
    return undefined;
  }, [registerReady, registerOpen]);

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

  useEffect(() => {
    setWaPhone(String(selectedCustomer?.phone || ''));
  }, [selectedCustomer?.id, selectedCustomer?.phone]);

  const customerOptions = useMemo(() => {
    const walk = customers.find((c) => {
      const n = String(c.name || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
      return c.id === WALK_IN.id || n === 'walkin' || n === 'walking';
    });
    const rest = customers.filter((c) => c !== walk && c.id !== WALK_IN.id);
    return [walk || WALK_IN, ...rest.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))];
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim();
    if (!q) return customerOptions.slice(0, 60);
    return customerOptions.filter((c) => customerMatchesQuery(c, q)).slice(0, 60);
  }, [customerOptions, customerQuery]);

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      const c = String(p.category || '').trim();
      if (c) set.add(c);
    });
    return ['all', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim();
    return products.filter((p) => {
      if (category !== 'all' && String(p.category || '') !== category) return false;
      if (!q) return true;
      return productMatchesQuery(p, q);
    });
  }, [products, category, search]);

  const stockGuard = (product, nextQty) => {
    if (!product || !invCfg.trackStock || invCfg.allowNegativeStock) return true;
    if (!tracksInventory(product)) return true;
    const stock = Number(product.stock ?? 0) || 0;
    if (nextQty > stock) {
      toast.error(`Inventory block: only ${stock} of ${product.name} in stock`);
      return false;
    }
    return true;
  };

  const addToCart = (product) => {
    if (!register.current) {
      toast.error('Pehle cash register open karein');
      setOpenDlg(true);
      return;
    }
    const rate = Number(product.rate || product.basePrice || product.effectivePrice || 0);
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.productId === product.id);
      const nextQty = idx >= 0 ? prev[idx].quantity + 1 : 1;
      if (!stockGuard(product, nextQty)) return prev;
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: nextQty };
        return next;
      }
      return [...prev, {
        productId: product.id,
        productType: product.productType,
        trackInventory: tracksInventory(product),
        name: product.name,
        rate,
        quantity: 1,
        size: product.size || '',
        material: product.material || '',
        image: productImageSrc(product),
      }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart((prev) => prev
      .map((c) => {
        if (c.productId !== productId) return c;
        const nextQty = c.quantity + delta;
        const catalog = products.find((p) => p.id === productId);
        if (delta > 0 && catalog && !stockGuard(catalog, nextQty)) return c;
        return { ...c, quantity: nextQty };
      })
      .filter((c) => c.quantity > 0));
  };

  const setQtyManual = (productId, raw) => {
    const n = Math.floor(Number(raw));
    if (!Number.isFinite(n)) return;
    setCart((prev) => prev
      .map((c) => {
        if (c.productId !== productId) return c;
        const catalog = products.find((p) => p.id === productId);
        if (catalog && n > c.quantity && !stockGuard(catalog, n)) return c;
        return { ...c, quantity: Math.max(0, n) };
      })
      .filter((c) => c.quantity > 0));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountValue('');
    setDiscountType('amount');
    setTaxPercent('');
    setReceivedAmount('');
  };

  const newSale = () => {
    clearCart();
    setCustomerId(WALK_IN.id);
    setCustomerQuery('');
    toast.message('New sale');
  };

  const holdSale = () => {
    if (!cart.length) {
      toast.error('Cart is empty');
      return;
    }
    try {
      sessionStorage.setItem(HOLD_KEY, JSON.stringify({
        cart, customerId, discountType, discountValue, taxPercent, paymentMethod, waPhone,
      }));
      clearCart();
      toast.success('Sale held — tap Hold to restore');
    } catch {
      toast.error('Could not hold sale');
    }
  };

  const restoreHold = () => {
    try {
      const raw = sessionStorage.getItem(HOLD_KEY);
      if (!raw) {
        toast.message('No held sale');
        return;
      }
      const held = JSON.parse(raw);
      setCart(Array.isArray(held.cart) ? held.cart : []);
      setCustomerId(held.customerId || WALK_IN.id);
      setDiscountType(held.discountType || 'amount');
      setDiscountValue(held.discountValue || '');
      setTaxPercent(held.taxPercent || '');
      setPaymentMethod(held.paymentMethod || 'Cash');
      setWaPhone(held.waPhone || '');
      sessionStorage.removeItem(HOLD_KEY);
      toast.success('Held sale restored');
    } catch {
      toast.error('Could not restore held sale');
    }
  };

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.quantity * i.rate, 0), [cart]);
  const discountAmount = useMemo(() => {
    const raw = Number(discountValue) || 0;
    if (raw <= 0 || subtotal <= 0) return 0;
    if (discountType === 'percent') return Math.min(subtotal, Math.round((subtotal * Math.min(100, raw)) / 100));
    return Math.min(subtotal, Math.max(0, raw));
  }, [discountType, discountValue, subtotal]);
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = useMemo(() => {
    const p = Number(taxPercent) || 0;
    if (p <= 0) return 0;
    return Math.round((afterDiscount * Math.min(100, p)) / 100);
  }, [taxPercent, afterDiscount]);
  const payable = Math.max(0, afterDiscount + taxAmount);
  const receivedNum = Number(receivedAmount);
  const cashReceived = Number.isFinite(receivedNum) && String(receivedAmount).trim() !== ''
    ? Math.max(0, receivedNum)
    : payable;
  const changeBack = Math.max(0, cashReceived - payable);

  const rememberSale = (sale) => {
    setLastSale(sale);
    try { sessionStorage.setItem(LAST_SALE_KEY, JSON.stringify(sale)); } catch { /* ignore */ }
  };

  const printReceipt = async (sale) => {
    if (!sale) {
      toast.error('Koi recent sale nahi — pehle complete sale karein');
      return;
    }
    const res = await printPosSlip({
      ...sale,
      paymentMethod: sale.paymentMethod || paymentMethod,
    }, { company, posCfg });
    if (!res.ok) toast.error('Print dialog blocked — allow printing for POS slip');
    else toast.message('Receipt sent to default printer');
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
    const result = openWhatsAppChat(phone, buildPosWhatsAppReceipt({ ...sale, customerPhone: phone }, company));
    if (!result.ok) toast.error('Could not open WhatsApp');
    else toast.message('WhatsApp receipt opened — tap Send');
  };

  const checkout = async () => {
    if (!cart.length) {
      toast.error('Cart is empty');
      return;
    }
    if (!register.current) {
      toast.error('Pehle cash register open karein — opening float required');
      setOpenDlg(true);
      return;
    }
    setCheckingOut(true);
    try {
      const productsPayload = cart.map(({ productId, productType, trackInventory, name, quantity, rate, size, material }) => ({
        productId,
        productType,
        trackInventory: trackInventory !== false && !String(productId || '').startsWith('calc_'),
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
        remarks: `POS Sale · ${paymentMethod}${discNote} · By ${cashier} · Recv ${cashReceived} · Change ${changeBack}`,
        docType: 'POS',
        paymentMethod,
        soldBy: cashier,
        cashier,
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
        tax: taxAmount,
        receivedAmount: cashReceived,
        changeBack,
        shareToken: created.data?.shareToken || created.data?.invoiceShareToken || '',
        trackingNumber: created.data?.trackingNumber || '',
        invoiceUrl: created.data?.shareToken
          ? `${window.location.origin}/invoice/${created.data.shareToken}`
          : '',
      };
      rememberSale(sale);
      toast.success(`Sale ${sale.orderId} completed`);
      if (created.data?._invoiceError) toast.error(created.data._invoiceError);
      else if (created.data?.invoiceNumber) toast.message(`Invoice ${created.data.invoiceNumber} created`);
      if (sale.customerPhone && applyServerNotificationHint(created.data)) {
        toast.message('WhatsApp opened — tap Send');
      }
      newSale();
      printReceipt(sale);
      loadProducts();
      loadRegister();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const openShift = async () => {
    setRegBusy(true);
    try {
      await posRegisterAPI.open({
        openingFloat: Number(openingFloat) || 0,
        note: regNote,
        openedBy: cashier,
      });
      toast.success('Cash register opened');
      setOpenDlg(false);
      setRegNote('');
      loadRegister();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not open register');
    } finally {
      setRegBusy(false);
    }
  };

  const closeShift = async () => {
    if (!confirmedClose) {
      toast.error('Tick the confirmation box — counted cash vs expected cash (Z-report)');
      return;
    }
    setRegBusy(true);
    try {
      const res = await posRegisterAPI.close({
        countedCash: Number(countedCash) || 0,
        note: regNote,
        closedBy: cashier,
        confirmed: true,
      });
      const v = Number(res.data?.closed?.variance || 0);
      toast.success(`Z-report posted · variance ${formatCurrency(v)}`);
      setCloseDlg(false);
      setConfirmedClose(false);
      setRegNote('');
      loadRegister();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not close register');
    } finally {
      setRegBusy(false);
    }
  };

  const convertLastToInvoice = async () => {
    if (!lastSale) {
      toast.error('Complete a sale first');
      return;
    }
    try {
      const inv = {
        invoiceNumber: `INV-POS-${Date.now().toString().slice(-6)}`,
        orderId: lastSale.orderId || '',
        customerName: lastSale.customerName || 'Walk-in',
        customerPhone: lastSale.customerPhone || '',
        items: (lastSale.products || []).map((p) => ({
          name: p.name, quantity: p.quantity, rate: p.rate, size: p.size || '', material: p.material || '',
        })),
        paidAmount: lastSale.totalAmount || 0,
        taxRate: 0,
        discount: Number(lastSale.discount) || 0,
        previousBalance: 0,
        notes: 'Converted from POS sale',
        date: new Date().toISOString().slice(0, 10),
      };
      const created = await invoicesAPI.create(inv);
      toast.success('POS sale converted to invoice');
      navigate(`/invoices/${created.data?.id || ''}`);
    } catch {
      toast.error('Failed to convert to invoice');
    }
  };

  const clockLabel = clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateLabel = clock.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="h-full min-h-0 flex flex-col bg-[#f4f6f8] text-slate-800" data-testid="pos-page">
      <header className="shrink-0 bg-white border-b px-4 py-2.5 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-xl">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            className="pl-10 h-10 bg-[#f4f6f8] border-slate-200 rounded-xl"
            placeholder="Search product (e.g. Visiting Card, Mug, T-shirt…)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="pos-search"
          />
        </div>
        <Button
          variant="outline"
          className="h-10 rounded-xl font-semibold"
          disabled={!lastSale}
          onClick={() => printReceipt(lastSale)}
          data-testid="pos-reprint-header"
        >
          <Printer className="h-4 w-4 mr-1" />Reprint receipt
        </Button>
        <Button variant="outline" className="h-10 rounded-xl" onClick={newSale}>
          <Plus className="h-4 w-4 mr-1" />New sale
        </Button>
        <Button variant="outline" className="h-10 rounded-xl" onClick={() => (sessionStorage.getItem(HOLD_KEY) ? restoreHold() : holdSale())}>
          <Pause className="h-4 w-4 mr-1" />Hold sale
        </Button>
        {registerOpen ? (
          <Button variant="outline" className="h-10 rounded-xl" onClick={() => { setCountedCash(''); setCloseDlg(true); }}>
            <Lock className="h-4 w-4 mr-1" />Close register
          </Button>
        ) : (
          <Button className="h-10 rounded-xl text-white" style={{ backgroundColor: accent }} onClick={() => setOpenDlg(true)}>
            <Unlock className="h-4 w-4 mr-1" />Open register
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2 text-sm">
          <div className={`h-2 w-2 rounded-full ${registerOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <User className="h-4 w-4 text-slate-400" />
          <span className="font-semibold">{cashier}</span>
          <span className="text-slate-400">Cashier</span>
        </div>
      </header>

      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="min-h-0 flex flex-col p-3 gap-3 relative">
          {!registerOpen && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-[2px] p-6" data-testid="pos-register-lock">
              <div className="max-w-md w-full rounded-2xl border bg-white p-8 text-center shadow-xl">
                <div className="mx-auto mb-4 h-12 w-12 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: accent }}>
                  <Lock className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-black">Register band hai</h2>
                <p className="text-sm text-slate-500 mt-2">Sale tabhi hogi jab cash register open ho — pehle opening float declare karein.</p>
                <Button className="mt-5 text-white" style={{ backgroundColor: accent }} onClick={() => setOpenDlg(true)}>
                  <Unlock className="h-4 w-4 mr-2" />Open register
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`shrink-0 h-10 px-3 rounded-xl text-sm font-semibold border ${
                  category === c ? 'text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:border-orange-200'
                }`}
                style={category === c ? { backgroundColor: accent } : undefined}
              >
                {c === 'all' ? (
                  <span className="inline-flex items-center gap-1.5"><LayoutGrid className="h-4 w-4" />All</span>
                ) : c}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {!filtered.length ? (
              <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-slate-400 border border-dashed rounded-2xl bg-white">
                <Package className="h-8 w-8 mb-2" />
                <p>No products in this category</p>
                <Button size="sm" className="mt-3 text-white" style={{ backgroundColor: accent }} onClick={() => navigate('/warehouse/products?new=1')}>
                  <PackagePlus className="h-4 w-4 mr-1" />Add product
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3">
                {filtered.map((p) => {
                  const img = productImageSrc(p);
                  const service = isServiceItem(p);
                  const tracking = tracksInventory(p);
                  const qty = cart.find((c) => c.productId === p.id)?.quantity || 0;
                  return (
                    <div
                      key={p.id}
                      className="text-left bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all overflow-hidden"
                      data-testid={`pos-product-${p.id}`}
                    >
                      <button
                        type="button"
                        onClick={() => addToCart(p)}
                        className="w-full text-left"
                      >
                        <div className="relative aspect-square w-full bg-slate-50 overflow-hidden">
                          {img ? (
                            <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                              {service ? <Wrench className="h-8 w-8" /> : <Package className="h-8 w-8" />}
                            </div>
                          )}
                          {tracking ? (
                            <span className="absolute top-2 right-2 min-w-[1.5rem] h-6 px-1.5 rounded-md text-white text-xs font-black flex items-center justify-center" style={{ backgroundColor: accent }}>
                              {Number(p.stock ?? 0) || 0}
                            </span>
                          ) : null}
                        </div>
                        <div className="px-3 pt-2">
                          <p className="text-[13px] font-semibold leading-snug line-clamp-2 min-h-[2.4rem]">{p.name}</p>
                          <p className="text-sm font-black mt-1" style={{ color: accent }}>{formatCurrency(p.rate || p.basePrice || p.effectivePrice)}</p>
                        </div>
                      </button>
                      <div className="px-2 pb-2 pt-2">
                        {qty > 0 ? (
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="h-9 w-9 shrink-0 font-black"
                              onClick={() => updateQty(p.id, -1)}
                              data-testid={`pos-qty-minus-${p.id}`}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="flex-1 text-center text-base font-black" data-testid={`pos-qty-${p.id}`}>{qty}</span>
                            <Button
                              type="button"
                              size="icon"
                              className="h-9 w-9 shrink-0 text-white"
                              style={{ backgroundColor: accent }}
                              onClick={() => addToCart(p)}
                              data-testid={`pos-qty-plus-${p.id}`}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            className="w-full h-9 text-white font-bold rounded-xl"
                            style={{ backgroundColor: accent }}
                            onClick={() => addToCart(p)}
                            data-testid={`pos-qty-add-${p.id}`}
                          >
                            <Plus className="h-4 w-4 mr-1" />Add
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <aside className="min-h-0 flex flex-col bg-white border-l">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-bold" style={{ color: accent }}>Current sale</p>
              <p className="text-xs text-slate-500">{cart.length} items</p>
            </div>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => window.open(`${window.location.origin}/customers?new=1`, '_blank')}>
              <UserPlus className="h-3.5 w-3.5 mr-1" />Customer
            </Button>
          </div>

          <div className="px-4 py-3 border-b space-y-2">
            <div className="rounded-xl border bg-slate-50 px-3 py-2 text-sm">
              <span className="font-semibold">{selectedCustomer?.name || 'Walk-in'}</span>
              {selectedCustomer?.phone ? <span className="text-slate-500"> · {selectedCustomer.phone}</span> : null}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                className="pl-8 h-9 text-sm"
                placeholder="Search customer name or phone…"
                value={customerQuery}
                data-testid="pos-customer-select"
                onFocus={() => setCustomerListOpen(true)}
                onChange={(e) => { setCustomerQuery(e.target.value); setCustomerListOpen(true); }}
                onBlur={() => setTimeout(() => setCustomerListOpen(false), 150)}
              />
              {customerListOpen && (
                <div className="absolute z-40 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 border-b font-medium"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { setCustomerId(WALK_IN.id); setCustomerQuery(''); setCustomerListOpen(false); }}
                  >
                    Walk-in
                  </button>
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 border-b last:border-0"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setCustomerId(c.id); setCustomerQuery(''); setCustomerListOpen(false); }}
                    >
                      <span className="font-medium">{c.name || 'Customer'}</span>
                      {c.phone ? <span className="text-slate-500"> · {c.phone}</span> : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2">
            {!cart.length ? (
              <p className="p-8 text-center text-slate-400 text-sm">Tap a product to add</p>
            ) : cart.map((item, i) => (
              <div key={item.productId} className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5" data-testid={`pos-cart-line-${item.productId}`}>
                <div className="flex items-start gap-2">
                  <span className="text-[11px] text-slate-400 font-semibold mt-0.5">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug text-sm">{item.name}</p>
                    <p className="text-[11px] text-slate-500">{formatCurrency(item.rate)} each</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setCart((c) => c.filter((x) => x.productId !== item.productId))}>
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-10 w-10 shrink-0 font-black"
                    onClick={() => updateQty(item.productId, -1)}
                    data-testid={`pos-cart-minus-${item.productId}`}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => setQtyManual(item.productId, e.target.value)}
                    className="h-10 w-16 text-center text-base font-black px-1"
                    data-testid={`pos-cart-qty-${item.productId}`}
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="h-10 w-10 shrink-0 text-white"
                    style={{ backgroundColor: accent }}
                    onClick={() => updateQty(item.productId, 1)}
                    data-testid={`pos-cart-plus-${item.productId}`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="ml-auto text-sm font-black" style={{ color: accent }}>{formatCurrency(item.quantity * item.rate)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="shrink-0 border-t px-4 py-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] text-slate-500">Discount</Label>
                <div className="flex gap-1 mt-1">
                  <Button size="sm" variant={discountType === 'amount' ? 'default' : 'outline'} className={`h-8 ${discountType === 'amount' ? 'text-white' : ''}`} style={discountType === 'amount' ? { backgroundColor: accent } : undefined} onClick={() => setDiscountType('amount')}>Rs</Button>
                  <Button size="sm" variant={discountType === 'percent' ? 'default' : 'outline'} className={`h-8 ${discountType === 'percent' ? 'text-white' : ''}`} style={discountType === 'percent' ? { backgroundColor: accent } : undefined} onClick={() => setDiscountType('percent')}>%</Button>
                  <Input type="number" min="0" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="h-8" placeholder="0" />
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-slate-500">Tax %</Label>
                <Input type="number" min="0" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)} className="h-8 mt-1" placeholder="0" />
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-slate-500"><span>Discount</span><span>-{formatCurrency(discountAmount)}</span></div>
              <div className="flex justify-between text-slate-500"><span>Tax</span><span>{formatCurrency(taxAmount)}</span></div>
              <div className="flex justify-between items-end pt-1">
                <span className="font-bold">Total</span>
                <span className="text-2xl font-black" style={{ color: accent }}>{formatCurrency(payable)}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { key: 'Cash', icon: Banknote, label: 'Cash' },
                { key: 'Card', icon: CreditCard, label: 'Card' },
                { key: 'Bank Transfer', icon: Building2, label: 'Bank' },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPaymentMethod(m.key)}
                  className={`h-10 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1 ${paymentMethod === m.key ? 'text-white border-transparent' : 'bg-white text-slate-600'}`}
                  style={paymentMethod === m.key ? { backgroundColor: accent } : undefined}
                >
                  <m.icon className="h-3.5 w-3.5" />{m.label}
                </button>
              ))}
            </div>
            {paymentMethod === 'Cash' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[11px] text-slate-500">Received</Label>
                  <Input type="number" min="0" value={receivedAmount} onChange={(e) => setReceivedAmount(e.target.value)} className="h-8" placeholder={String(payable || 0)} />
                </div>
                <div>
                  <Label className="text-[11px] text-slate-500">Change</Label>
                  <Input className="h-8 bg-emerald-50 font-semibold text-emerald-800" value={formatCurrency(changeBack)} disabled />
                </div>
              </div>
            )}
            <Input className="h-8" placeholder="WhatsApp number" value={waPhone} onChange={(e) => setWaPhone(e.target.value)} />
            <Button
              className="w-full h-12 text-white text-base font-black rounded-xl"
              style={{ backgroundColor: accent }}
              disabled={checkingOut || !cart.length || !registerOpen}
              onClick={checkout}
              data-testid="pos-checkout"
            >
              <Printer className="h-4 w-4 mr-2" />
              {checkingOut ? 'Processing…' : 'Complete sale'}
            </Button>
            <Button
              variant="outline"
              className="w-full h-10 rounded-xl font-semibold"
              disabled={!lastSale}
              onClick={() => printReceipt(lastSale)}
              data-testid="pos-reprint-cart"
            >
              <RotateCcw className="h-4 w-4 mr-2" />Reprint receipt
            </Button>
          </div>
        </aside>
      </div>

      <footer className="shrink-0 bg-white border-t px-3 py-2 flex flex-wrap items-center gap-2 text-sm">
        <Button variant="ghost" size="sm" className="h-8 font-semibold" disabled={!lastSale} onClick={() => printReceipt(lastSale)} data-testid="pos-reprint-footer">
          <Printer className="h-3.5 w-3.5 mr-1" />Reprint receipt
        </Button>
        <Button variant="ghost" size="sm" className="h-8" disabled={!lastSale} onClick={convertLastToInvoice}>
          <Quote className="h-3.5 w-3.5 mr-1" />Invoice
        </Button>
        <Button variant="ghost" size="sm" className="h-8" onClick={() => { setCustomerId(WALK_IN.id); toast.message('Walk-in selected'); }}>
          <User className="h-3.5 w-3.5 mr-1" />Walk-in
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-rose-600" onClick={clearCart}>
          <Trash2 className="h-3.5 w-3.5 mr-1" />Clear cart
        </Button>
        <Button variant="ghost" size="sm" className="h-8" disabled={!lastSale} onClick={() => lastSale && sendPosWhatsApp(lastSale)}>
          <WhatsAppIcon className="h-3.5 w-3.5 mr-1" />WhatsApp
        </Button>
        <Button variant="ghost" size="sm" className="h-8" onClick={() => navigate('/accounts/pos-statement')}>
          <BookOpen className="h-3.5 w-3.5 mr-1" />Statement
        </Button>
        <Button variant="ghost" size="sm" className="h-8" onClick={() => navigate('/pos/settings')}>
          <Settings className="h-3.5 w-3.5 mr-1" />Settings
        </Button>
        <span className="ml-auto text-slate-500">
          Items: <strong className="text-slate-800">{cart.length}</strong>
          {' · '}
          <strong style={{ color: accent }}>{formatCurrency(payable)}</strong>
        </span>
      </footer>

      <div className="shrink-0 px-4 py-1.5 bg-[#0b1b33] text-white/70 text-[11px] flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Online
        </span>
        <span>{company.address || company.city || 'Mandi Bahauddin'}</span>
        <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{dateLabel} · {clockLabel}</span>
        <span className="ml-auto">{company.name || 'Amazon Printing Services'} · {company.website || 'amzprints.com'}</span>
      </div>

      <Dialog open={openDlg} onOpenChange={setOpenDlg}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Open cash register</DialogTitle>
            <DialogDescription>
              Declare opening float before the first sale. Drawer cash is reconcilable at close (Z-report).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Opening float (cash in drawer)</Label>
              <Input type="number" min="0" value={openingFloat} onChange={(e) => setOpeningFloat(e.target.value)} />
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Input value={regNote} onChange={(e) => setRegNote(e.target.value)} placeholder="Till 1 · morning shift" />
            </div>
            <p className="text-xs text-slate-500">Cashier: {cashier}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDlg(false)}>Cancel</Button>
            <Button className="text-white" style={{ backgroundColor: accent }} disabled={regBusy} onClick={openShift}>
              <Unlock className="h-4 w-4 mr-1" />{regBusy ? 'Opening…' : 'Open register'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={closeDlg} onOpenChange={setCloseDlg}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Close register — Z-report</DialogTitle>
            <DialogDescription>
              Count drawer cash. Expected = opening float + cash sales this shift.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>Opening float: <strong>{formatCurrency(register.current?.openingFloat)}</strong></p>
            <p>Cash sales: <strong>{formatCurrency(register.totals?.cashSales)}</strong></p>
            <p>Expected cash: <strong>{formatCurrency(Number(register.current?.openingFloat || 0) + Number(register.totals?.cashSales || 0))}</strong></p>
            <div>
              <Label>Counted cash in drawer</Label>
              <Input type="number" min="0" value={countedCash} onChange={(e) => setCountedCash(e.target.value)} />
            </div>
            <div>
              <Label>Close note</Label>
              <Input value={regNote} onChange={(e) => setRegNote(e.target.value)} />
            </div>
            <label className="flex items-start gap-2 text-xs">
              <input type="checkbox" checked={confirmedClose} onChange={(e) => setConfirmedClose(e.target.checked)} />
              I confirm the counted cash is accurate and I accept any variance on this Z-report.
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDlg(false)}>Cancel</Button>
            <Button className="text-white bg-slate-900" disabled={regBusy} onClick={closeShift}>
              <Lock className="h-4 w-4 mr-1" />{regBusy ? 'Closing…' : 'Post Z-report & close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POS;
