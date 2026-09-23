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
import { Search, Plus, Minus, Trash2, Printer, ShoppingCart, FileSpreadsheet, PackagePlus, UserPlus, Package, Wrench, Store, Expand, Lock, Unlock, BookOpen, Settings, Clock } from 'lucide-react';
import { WhatsAppIcon } from '@/components/shared/WhatsAppIcon';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth, getUserDisplayName } from '@/context/AuthContext';
import { openPosCounterOrFallback } from '@/utils/posWindow';
import POSCalculator from '@/components/modules/pos/POSCalculator';
import { productImageSrc } from '@/utils/productImage';
import { isServiceItem, tracksInventory } from '@/utils/inventoryTrack';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const WALK_IN = { id: 'cust_walkin', name: 'Walk-in', phone: '' };

const POS = ({ kiosk = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isKiosk = kiosk || (typeof window !== 'undefined' && window.location.pathname.startsWith('/pos/counter'));
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

  useEffect(() => {
    if (!isKiosk) return undefined;
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, [isKiosk]);

  const loadRegister = useCallback(async () => {
    try {
      const res = await posRegisterAPI.get();
      setRegister(res.data || { current: null, history: [], totals: {} });
    } catch {
      setRegister({ current: null, history: [], totals: {} });
    }
  }, []);

  useEffect(() => { loadRegister(); }, [loadRegister]);

  useEffect(() => {
    settingsAPI.get().then((res) => {
      const data = res.data || {};
      const nextPos = mergePosSettings(data);
      setPosCfg(nextPos);
      setInvCfg(mergeInventorySettings(data));
      if (nextPos.defaultPayment) setPaymentMethod(nextPos.defaultPayment);
    }).catch(() => {});
  }, []);

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
    const tracking = tracksInventory(p);
    const img = productImageSrc(p);
    return (
      <button
        key={p.id}
        type="button"
        onClick={() => addToCart(p)}
        className="text-left rounded-2xl border border-amber-200/10 bg-gradient-to-b from-[#24182a] to-[#140c1c] overflow-hidden hover:border-amber-400/70 hover:shadow-[0_10px_28px_rgba(232,184,74,0.18)] transition-all group"
        data-testid={`pos-product-${p.id}`}
      >
        <div className="relative h-24 bg-[#0d0814]">
          {img ? (
            <img src={img} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/25">
              {service ? <Wrench className="h-7 w-7" /> : <Package className="h-7 w-7" />}
            </div>
          )}
          <span className={`absolute top-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${service ? 'bg-sky-500 text-white' : 'bg-white/90 text-slate-800'}`}>
            {service ? 'Service' : 'Product'}
          </span>
          {tracking ? (
            <span className="absolute top-1.5 right-1.5 min-w-[1.75rem] h-7 px-1.5 rounded-md bg-gradient-to-br from-amber-300 to-orange-500 text-[#1a0f08] text-sm font-black leading-none flex items-center justify-center shadow" title="On-hand quantity">
              {Number(p.stock ?? 0) || 0}
            </span>
          ) : null}
        </div>
        <div className="p-2.5">
          <div className="text-[13px] font-semibold leading-snug line-clamp-2 min-h-[2.4rem] text-white">
            {p.name}
          </div>
          <div className="text-sm font-bold mt-1" style={{ color: primary || '#ff6d00' }}>
            {formatCurrency(p.rate || p.basePrice)}
          </div>
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
    const rate = Number(product.rate || product.basePrice || 0);
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.productId === product.id);
      const nextQty = idx >= 0 ? prev[idx].quantity + 1 : 1;
      if (!stockGuard(product, nextQty)) return prev;
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: nextQty };
        return next;
      }
      return [
        ...prev,
        {
          productId: product.id,
          productType: product.productType,
          trackInventory: tracksInventory(product),
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
        .map((c) => {
          if (c.productId !== productId) return c;
          const nextQty = c.quantity + delta;
          const catalog = products.find((p) => p.id === productId);
          if (delta > 0 && catalog && !stockGuard(catalog, nextQty)) return c;
          return { ...c, quantity: nextQty };
        })
        .filter((c) => c.quantity > 0)
    );
  };

  const setQtyManual = (productId, raw) => {
    const n = Math.floor(Number(raw));
    if (!Number.isFinite(n)) return;
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.productId !== productId) return c;
          const catalog = products.find((p) => p.id === productId);
          if (catalog && n > c.quantity && !stockGuard(catalog, n)) return c;
          return { ...c, quantity: n };
        })
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

  const printReceipt = async (sale) => {
    const res = await printPosSlip({
      ...sale,
      paymentMethod: sale.paymentMethod || paymentMethod,
    }, { company, posCfg });
    if (!res.ok) toast.error('Allow popups to print receipt');
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
        discountType,
        discountValue: Number(discountValue) || 0,
        receivedAmount: cashReceived,
        changeBack,
        shareToken: created.data?.shareToken || '',
        invoiceUrl: created.data?.invoiceId
          ? `${window.location.origin}/invoices/${created.data.invoiceId}`
          : '',
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
      loadProducts();
      loadRegister();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const cashier = getUserDisplayName(user) || 'Cashier';
  const registerOpen = !!register.current;

  useEffect(() => {
    if (!isKiosk || registerOpen) return undefined;
    setOpenDlg(true);
    return undefined;
  }, [isKiosk, registerOpen]);

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

  const registerDialogs = (
    <>
      <Dialog open={openDlg} onOpenChange={setOpenDlg}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Open cash register</DialogTitle>
            <DialogDescription>
              International cash control: declare opening float before the first sale. Drawer cash is then reconcilable at close (Z-report).
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
            <Button className="text-white" style={{ backgroundColor: primary || '#ff6d00' }} disabled={regBusy} onClick={openShift}>
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
              Count drawer cash. Expected = opening float + cash sales this shift. Variance must be recorded (cannot be hidden).
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
    </>
  );

  if (!isKiosk) {
    return (
      <div className="erp-page space-y-5" data-testid="pos-page">
        <div
          className="relative overflow-hidden rounded-[28px] text-white shadow-[0_24px_60px_rgba(20,12,28,0.28)] min-h-[320px] flex flex-col justify-end"
          style={{
            background: `
              radial-gradient(720px 280px at 8% 0%, rgba(244,197,106,0.38), transparent 58%),
              radial-gradient(640px 260px at 92% 20%, rgba(255,109,0,0.28), transparent 52%),
              linear-gradient(145deg, #1a1024 0%, #2a1840 42%, #141022 100%)
            `,
          }}
        >
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #f4c56a22 0, transparent 40%), radial-gradient(circle at 80% 30%, #ff8a3d18 0, transparent 35%)' }} />
          <div className="relative p-7 sm:p-10 space-y-4 max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.28em] font-bold text-amber-200/80">Amazon Printing · Point of sale</p>
            <h1 className="text-4xl sm:text-5xl font-black leading-[1.05] tracking-tight">POS desk</h1>
            <p className="text-white/78 text-[15px] max-w-lg">
              Yeh tab till nahi kholta. Till sirf <strong className="text-amber-200">POS Counter</strong> se alag window mein khulta hai.
              Register open kiye baghair koi sale nahi ho sakti.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                className="h-11 px-5 text-white font-bold shadow-lg"
                style={{ background: 'linear-gradient(135deg,#f4c56a,#ff6d00)' }}
                onClick={() => {
                  const w = openPosCounterOrFallback();
                  if (!w) toast.error('Allow popups to open the POS Counter');
                }}
              >
                <Expand className="h-4 w-4 mr-2" />POS Counter
              </Button>
              <Button variant="secondary" className="h-11" onClick={() => navigate('/accounts/pos-statement')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />POS statement
              </Button>
              <Button variant="outline" className="h-11 bg-white/10 text-white border-white/25" onClick={() => navigate('/pos/settings')}>
                <Settings className="h-4 w-4 mr-2" />POS settings
              </Button>
            </div>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className={`rounded-2xl border p-4 ${registerOpen ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Register</p>
            <p className={`font-black mt-1 text-lg ${registerOpen ? 'text-emerald-700' : 'text-rose-600'}`}>{registerOpen ? 'OPEN' : 'CLOSED'}</p>
            <p className="text-xs text-slate-500 mt-1">
              {registerOpen
                ? `Float ${formatCurrency(register.current.openingFloat)} · ${register.current.openedBy || cashier}`
                : 'POS Counter kholo aur pehle register open karo'}
            </p>
          </div>
          <div className="rounded-2xl border p-4 bg-white">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">This shift</p>
            <p className="font-black mt-1 text-lg">{register.totals?.count || 0} sales</p>
            <p className="text-xs text-slate-500 mt-1">{formatCurrency(register.totals?.sales)}</p>
          </div>
          <div className="rounded-2xl border p-4 bg-white">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Audit</p>
            <p className="font-black mt-1 text-lg">Z-report</p>
            <p className="text-xs text-slate-500 mt-1">Shift close POS Counter se — counted cash vs expected</p>
          </div>
        </div>
      </div>
    );
  }


  const clockLabel = clock.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateLabel = clock.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div
      className="h-screen overflow-hidden flex flex-col text-white"
      data-testid="pos-kiosk"
      style={{
        background: 'radial-gradient(1200px 500px at 10% -10%, rgba(244,197,106,0.16), transparent 50%), radial-gradient(900px 420px at 100% 0%, rgba(255,109,0,0.12), transparent 46%), #120a18',
      }}
    >
      <header className="shrink-0 px-4 py-3 flex flex-wrap items-center gap-3 border-b border-amber-200/15 bg-[#1a1024]/90 backdrop-blur">
        <div className="flex items-center gap-2.5 min-w-0">
          {company.logo ? (
            <img src={company.logo} alt="" className="h-10 w-10 rounded-xl object-contain bg-white/10 ring-1 ring-amber-200/20" />
          ) : (
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f4c56a,#ff6d00)' }}>
              <Store className="h-5 w-5 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-amber-200/70">POS Counter</p>
            <h1 className="text-lg font-black leading-tight truncate">{company.name || 'AMZ Prints'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
          <Clock className="h-4 w-4 text-amber-300" />
          <div>
            <p className="text-sm font-bold leading-none tabular-nums">{clockLabel}</p>
            <p className="text-[10px] text-white/55">{dateLabel} · {cashier}</p>
          </div>
        </div>
        <div className={`rounded-2xl px-3 py-1.5 text-xs font-black tracking-wide ${registerOpen ? 'bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/30' : 'bg-rose-500/20 text-rose-200 ring-1 ring-rose-300/30'}`}>
          {registerOpen
            ? `OPEN · float ${formatCurrency(register.current.openingFloat)} · ${register.totals?.count || 0} sales`
            : 'REGISTER CLOSED'}
        </div>
        <div className="ml-auto flex flex-wrap gap-1.5">
          {registerOpen ? (
            <Button size="sm" variant="secondary" className="h-8" onClick={() => { setCountedCash(''); setCloseDlg(true); }}>
              <Lock className="h-3.5 w-3.5 mr-1" />Close (Z)
            </Button>
          ) : (
            <Button size="sm" className="h-8 text-[#1a0f08] font-bold" style={{ background: 'linear-gradient(135deg,#f4c56a,#ff6d00)' }} onClick={() => setOpenDlg(true)}>
              <Unlock className="h-3.5 w-3.5 mr-1" />Open register
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-8 text-white border-white/20" onClick={() => window.open(`${window.location.origin}/accounts/pos-statement`, '_blank')}>
            <BookOpen className="h-3.5 w-3.5 mr-1" />Statement
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-white border-white/20" onClick={() => window.open(`${window.location.origin}/pos/settings`, '_blank')}>
            <Settings className="h-3.5 w-3.5 mr-1" />Settings
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-white border-white/20" onClick={() => window.open(`${window.location.origin}/warehouse/products?new=1`, '_blank')} data-testid="pos-add-product">
            <PackagePlus className="h-3.5 w-3.5 mr-1" />Product
          </Button>
        </div>
      </header>

      {lastSale ? (
        <div className="shrink-0 px-4 py-2 flex flex-wrap gap-2 bg-[#24182f] border-b border-amber-200/10">
          <span className="text-xs text-white/70 self-center">Last sale <strong className="text-white">{lastSale.orderId}</strong></span>
          <Button size="sm" variant="outline" className="h-8 rounded-lg bg-white text-slate-800" onClick={() => printReceipt(lastSale)} data-testid="pos-reprint">
            <Printer className="h-3.5 w-3.5 mr-1" />Reprint
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg text-green-300 border-green-700 hover:bg-green-900/40"
            onClick={() => sendPosWhatsApp(lastSale, waPhone || lastSale.customerPhone)}
            data-testid="pos-whatsapp-last"
          >
            <WhatsAppIcon className="h-3.5 w-3.5 mr-1" />WhatsApp
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg text-white border-white/20"
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
                window.open(`${window.location.origin}/invoices/${created.data?.id || ''}`, '_blank');
              } catch (err) {
                console.error(err);
                toast.error('Failed to convert to invoice');
              }
            }}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />Invoice
          </Button>
        </div>
      ) : null}

      <div className="flex-1 min-h-0 relative grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px]">
        {!registerOpen && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#120a18]/80 backdrop-blur-sm p-6" data-testid="pos-register-lock">
            <div className="max-w-md w-full rounded-3xl border border-amber-200/20 bg-gradient-to-b from-[#2a1a36] to-[#160e20] p-8 text-center shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
              <div className="mx-auto mb-4 h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f4c56a,#ff6d00)' }}>
                <Lock className="h-7 w-7 text-[#1a0f08]" />
              </div>
              <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-amber-200/70">Cash control</p>
              <h2 className="text-2xl font-black mt-1">Register band hai</h2>
              <p className="text-sm text-white/65 mt-2">
                Jab tak cash register open nahi hoga, POS sale, cart, aur pay lock rahenge. Opening float declare karein.
              </p>
              <Button
                className="mt-5 h-11 px-6 text-[#1a0f08] font-bold"
                style={{ background: 'linear-gradient(135deg,#f4c56a,#ff6d00)' }}
                onClick={() => setOpenDlg(true)}
              >
                <Unlock className="h-4 w-4 mr-2" />Open register
              </Button>
            </div>
          </div>
        )}
        <section className="min-h-0 flex flex-col p-3 gap-3 border-r border-amber-200/10">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-amber-200/50" />
              <Input
                className="pl-10 h-10 bg-[#1d1328] border-amber-200/15 text-white placeholder:text-white/35"
                placeholder="Search products or services…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {['all', 'product', 'service'].map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'default' : 'outline'}
                style={filter === f ? { backgroundColor: primary || '#ff6d00' } : undefined}
                className={filter === f ? 'text-white h-10' : 'h-10 text-white border-white/20 bg-transparent'}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f === 'product' ? 'Products' : 'Services'}
              </Button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
            {!filtered.length && (
              <div className="text-center text-white/50 py-10 space-y-3 border border-dashed border-white/15 rounded-2xl">
                <p>No items in catalog</p>
                <Button size="sm" style={{ backgroundColor: primary || '#ff6d00' }} className="text-white" onClick={() => window.open(`${window.location.origin}/warehouse/products?new=1`, '_blank')}>
                  <PackagePlus className="h-4 w-4 mr-2" />Add product
                </Button>
              </div>
            )}

            {(filter === 'all' || filter === 'product') && productItems.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-wide text-amber-200/60 sticky top-0 bg-[#120a18]/90 py-1">
                  Products ({productItems.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {productItems.map(renderPosCard)}
                </div>
              </div>
            )}

            {(filter === 'all' || filter === 'service') && serviceItems.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-wide text-sky-200/80 sticky top-0 bg-[#120a18]/90 py-1 border-t border-white/10 pt-3">
                  Services — no stock quantity ({serviceItems.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {serviceItems.map(renderPosCard)}
                </div>
              </div>
            )}
          </div>

          {posCfg.showCalculator !== false && (
            <div className="shrink-0">
              <POSCalculator
                accent={primary || '#ff6d00'}
                onAdd={(line) => {
                  if (!registerOpen) {
                    toast.error('Pehle cash register open karein');
                    setOpenDlg(true);
                    return;
                  }
                  setCart((prev) => [...prev, { ...line, trackInventory: false, productType: 'Service' }]);
                  toast.success('Added from calculator');
                }}
              />
            </div>
          )}
        </section>

        <aside className="min-h-0 flex flex-col bg-[#fff8f0] text-slate-900 shadow-[-18px_0_40px_rgba(20,12,28,0.18)]">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" style={{ color: primary || '#ff6d00' }} />
              <h2 className="font-bold">Ticket</h2>
              <span className="text-xs text-slate-500">{cart.length} lines</span>
            </div>
            {!!cart.length && (
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200" onClick={clearCart} data-testid="pos-clear-cart">
                Clear
              </Button>
            )}
          </div>

          <div className="px-4 py-3 space-y-2 border-b">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-slate-700">Customer</Label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => window.open(`${window.location.origin}/customers?new=1`, '_blank')}
              >
                <UserPlus className="h-3.5 w-3.5 mr-1" />Add
              </Button>
            </div>
            <div className="relative">
              <div className="rounded-md border bg-white px-3 py-2 text-sm mb-1">
                <span className="font-medium">{selectedCustomer?.name || 'Walk-in'}</span>
                {selectedCustomer?.phone ? (
                  <span className="text-slate-500 text-xs"> · {selectedCustomer.phone}</span>
                ) : null}
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  className="pl-8 h-9 text-sm bg-white"
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
                      {c.phone ? <span className="text-slate-500"> · {c.phone}</span> : null}
                    </button>
                  ))}
                  {!filteredCustomers.length && (
                    <p className="px-3 py-2 text-xs text-slate-500">No match — add customer in Customers</p>
                  )}
                </div>
              )}
            </div>
            <div>
              <Label className="text-slate-700">Payment</Label>
              <div className="flex gap-2 mt-1">
                {['Cash', 'Card'].map((m) => (
                  <Button
                    key={m}
                    type="button"
                    size="sm"
                    variant={paymentMethod === m ? 'default' : 'outline'}
                    style={paymentMethod === m ? { backgroundColor: primary || '#ff6d00' } : undefined}
                    className={paymentMethod === m ? 'text-white' : ''}
                    onClick={() => setPaymentMethod(m)}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2">
            {!cart.length && <p className="text-sm text-slate-500 text-center py-8">Tap a product or service to add</p>}
            {cart.map((item) => {
              const serviceLine = isServiceItem(item) || String(item.productId || '').startsWith('calc_');
              return (
                <div key={item.productId} className="flex items-center gap-2 border rounded-lg p-2 bg-white">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.name}</div>
                    <div className="text-xs text-slate-500">
                      {formatCurrency(item.rate)} each
                      {serviceLine ? ' · Service' : item.trackInventory === false ? ' · No stock' : ''}
                    </div>
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
                      className="h-7 w-14 text-center text-sm font-semibold px-1 bg-white"
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
              );
            })}
          </div>

          <div className="shrink-0 border-t bg-white px-4 py-3 space-y-2">
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
                      style={discountType === m.key ? { backgroundColor: primary || '#ff6d00' } : undefined}
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
                  placeholder={discountType === 'percent' ? '0%' : '0'}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="h-9 bg-white"
                  data-testid="pos-discount-input"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600">
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
              <span className="text-2xl font-black" style={{ color: primary || '#ff6d00' }}>{formatCurrency(payable)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Received</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder={String(payable || 0)}
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="h-9 bg-white"
                  data-testid="pos-received-amount"
                />
              </div>
              <div>
                <Label className="text-xs">Change</Label>
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
                className="h-9 bg-white"
                placeholder="03XXXXXXXXX"
                value={waPhone}
                onChange={(e) => setWaPhone(e.target.value)}
                data-testid="pos-wa-phone"
              />
            </div>
            <Button
              className="w-full h-12 text-[#1a0f08] text-base font-black"
              style={{ background: 'linear-gradient(135deg,#f4c56a,#ff6d00)' }}
              disabled={checkingOut || !cart.length || !registerOpen}
              onClick={checkout}
              data-testid="pos-checkout"
            >
              {checkingOut ? 'Processing…' : 'Pay & print'}
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
          </div>
        </aside>
      </div>
      {registerDialogs}
    </div>
  );
};

export default POS;
