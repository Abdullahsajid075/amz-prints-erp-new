import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { purchasesAPI, vendorsAPI, ordersAPI, productsAPI, paymentsAPI, expensesAPI, settingsAPI } from '@/services/api';
import { clearGasCache } from '@/services/gasClient';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { sortBy } from '@/utils/sortBy';
import SortBar from '@/components/shared/SortBar';
import { notifyPaymentEvent, openWhatsAppChat, printPaymentSlip } from '@/services/notifications';
import { useBrand } from '@/context/BrandContext';
import { Plus, Search, Eye, Edit, Trash2, ShoppingBag, PackageCheck, Paperclip, AlertTriangle, X, Save, FileText, Link2, PackagePlus, Building2, Truck, CreditCard } from 'lucide-react';
import { WhatsAppIcon } from '@/components/shared/WhatsAppIcon';
import { toast } from 'sonner';

const PO_STATUS = ['Draft', 'Ordered', 'Partial Paid', 'Fully Paid', 'Received'];

const PURCHASE_SORT_OPTS = [
  { value: 'date', label: 'Date' },
  { value: 'vendorName', label: 'Vendor' },
  { value: 'totalAmount', label: 'Amount' },
  { value: 'status', label: 'Status' },
  { value: 'poNumber', label: 'PO #' },
];

/** Closed / finished — never offered when linking a customer order on a PO */
const isOpenOrder = (order) => {
  const status = String(order?.status || '').trim().toLowerCase();
  if (!status) return true;
  if (['delivered', 'completed', 'complete', 'closed', 'cancelled', 'canceled'].includes(status)) {
    return false;
  }
  // Variants: "Order Completed", "Delivery Completed", etc. (keep "Ready")
  if (/(deliver|complet|closed|cancel)/i.test(status) && !/ready/i.test(status)) {
    return false;
  }
  return true;
};

const emptyPurchase = {
  vendorId: '', vendorInvoiceNumber: '',
  purchaseDate: new Date().toISOString().split('T')[0],
  expectedDeliveryDate: '', actualDeliveryDate: '',
  status: 'Draft',
  linkedOrderId: '',
  items: [{ _key: 'i_init', productId: '', name: '', quantity: 1, rate: 0, unit: 'piece' }],
  notes: '', totalAmount: 0, paidAmount: 0, poNumber: '',
};

/** Normalize GAS/API purchase shapes → UI fields */
const normalizePurchase = (p = {}) => {
  const total = Number(p.totalAmount ?? p.total ?? 0) || 0;
  const paid = Number(p.paidAmount ?? p.paid ?? 0) || 0;
  const po = p.poNumber || p.purchaseNo || p.purchaseno || '';
  const date = p.purchaseDate || p.date || p.purchasedate || '';
  let items = p.items;
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch { items = []; }
  }
  if (!Array.isArray(items)) items = [];
  return {
    ...p,
    id: p.id,
    poNumber: po,
    purchaseNo: po,
    purchaseDate: date,
    date,
    vendorId: p.vendorId || p.vendorid || '',
    vendorName: p.vendorName || p.vendorname || '',
    vendorInvoiceNumber: p.vendorInvoiceNumber || p.vendorinvoicenumber || '',
    expectedDeliveryDate: p.expectedDeliveryDate || p.expecteddeliverydate || '',
    actualDeliveryDate: p.actualDeliveryDate || p.actualdeliverydate || '',
    linkedOrderId: p.linkedOrderId || p.linkedorderid || '',
    items: items.map((it, i) => ({
      ...it,
      _key: it._key || it.id || `i_${i}`,
      productId: it.productId || it.productid || '',
      name: it.name || '',
      quantity: Number(it.quantity) || 0,
      rate: Number(it.rate) || 0,
      unit: it.unit || 'piece',
    })),
    totalAmount: total,
    paidAmount: paid,
    status: p.status || 'Draft',
    notes: p.notes || '',
  };
};

const Purchases = () => {
  const navigate = useNavigate();
  const { company } = useBrand();
  const [purchases, setPurchases] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ field: 'date', dir: 'desc' });
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyPurchase);
  const [saving, setSaving] = useState(false);
  const [paymentPurchase, setPaymentPurchase] = useState(null);
  const [paymentData, setPaymentData] = useState({ amount: 0, method: 'Cash', date: new Date().toISOString().split('T')[0], notes: '' });
  const [paymentMethods, setPaymentMethods] = useState(['Cash', 'Bank Transfer', 'UPI', 'Card', 'Cheque']);
  const [paying, setPaying] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, vRes, oRes, prodRes] = await Promise.all([
        purchasesAPI.getAll(),
        vendorsAPI.getAll(),
        ordersAPI.getAll(),
        productsAPI.getAll(),
      ]);
      setPurchases((Array.isArray(pRes.data) ? pRes.data : []).map(normalizePurchase));
      setVendors(vRes.data || []);
      setOrders(oRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      console.error('Failed to fetch purchases data', err);
      toast.error('Failed to load purchase data');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    settingsAPI.get().then((res) => {
      const methods = (res.data?.payments?.methods || []).filter((m) => m.enabled).map((m) => m.name);
      if (methods.length) setPaymentMethods(methods);
    }).catch(() => {});
  }, []);

  /** Only open orders for linking — keep current link visible when editing a closed one */
  const linkableOrders = useMemo(() => {
    const current = String(formData.linkedOrderId || '');
    return (orders || []).filter((o) => {
      const oid = String(o.orderId || o.id || '');
      if (current && (oid === current || String(o.id) === current)) return true;
      return isOpenOrder(o);
    });
  }, [orders, formData.linkedOrderId]);

  const filtered = purchases.filter((p) => {
    const q = search.trim().toLowerCase();
    const matchS = !q
      || String(p.poNumber || '').toLowerCase().includes(q)
      || String(p.vendorName || '').toLowerCase().includes(q)
      || String(p.vendorInvoiceNumber || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchS && matchStatus;
  });

  const sorted = useMemo(() => sortBy(filtered, sort, {
    date: (p) => p.purchaseDate || p.date || '',
    purchaseDate: (p) => p.purchaseDate || p.date || '',
    vendorName: (p) => p.vendorName || '',
    totalAmount: (p) => Number(p.totalAmount ?? p.total ?? 0) || 0,
    total: (p) => Number(p.totalAmount ?? p.total ?? 0) || 0,
    status: (p) => p.status || '',
    poNumber: (p) => p.poNumber || '',
  }), [filtered, sort]);

  const isPaidStatus = (s) => s === 'Partial Paid' || s === 'Fully Paid';
  const isUnpaidLike = (s) => !isPaidStatus(s) && s !== 'Received';

  const stats = {
    total: purchases.length,
    pending: purchases.filter(p => p.status !== 'Received').length,
    received: purchases.filter(p => p.status === 'Received').length,
    totalValue: purchases.reduce((s, p) => s + (p.totalAmount || 0), 0),
    unpaid: purchases.filter(p => isUnpaidLike(p.status) || p.status === 'Partial Paid')
      .reduce((s, p) => s + ((p.totalAmount || 0) - (p.paidAmount || 0)), 0)
  };

  const openCreate = () => { setEditing(null); setFormData(emptyPurchase); setDialogOpen(true); };
  const openEdit = (p) => {
    const row = normalizePurchase(p);
    setEditing(row);
    setFormData({
      ...emptyPurchase,
      ...row,
      items: (row.items?.length ? row.items : emptyPurchase.items).map((it, i) => ({
        ...it,
        _key: it._key || it.id || `i_${i}`,
        productId: it.productId || '',
      })),
      paidAmount: row.paidAmount || 0,
    });
    setDialogOpen(true);
  };
  const openView = (p) => { setViewData(normalizePurchase(p)); setViewOpen(true); };

  const calcTotal = () => formData.items.reduce((s, i) => s + (Number(i.quantity) * Number(i.rate)), 0);

  const updateItem = (i, field, value) => {
    const items = [...formData.items];
    items[i] = { ...items[i], [field]: value };
    setFormData({ ...formData, items });
  };

  const selectProduct = (i, productId) => {
    const product = products.find(p => p.id === productId);
    const items = [...formData.items];
    items[i] = {
      ...items[i],
      productId,
      name: product?.name || items[i].name,
      rate: product?.costPrice ?? product?.purchasePrice ?? items[i].rate,
      unit: product?.unit || items[i].unit || 'piece',
    };
    setFormData({ ...formData, items });
  };

  const addItem = () => setFormData({
    ...formData,
    items: [...formData.items, { _key: `i_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, productId: '', name: '', quantity: 1, rate: 0, unit: 'piece' }],
  });
  const removeItem = (i) => setFormData({ ...formData, items: formData.items.filter((_, x) => x !== i) });

  const applyStockIncrease = async (items) => {
    for (const item of items || []) {
      if (!item.productId) continue;
      const qty = Number(item.quantity) || 0;
      if (qty <= 0) continue;
      try {
        const res = await productsAPI.getById(item.productId);
        const product = res.data;
        if (!product) continue;
        const nextStock = (Number(product.stock) || 0) + qty;
        await productsAPI.update(item.productId, { ...product, stock: nextStock });
      } catch (err) {
        console.error('Stock update failed for', item.productId, err);
        toast.error(`Stock update failed for ${item.name || item.productId}`);
      }
    }
  };

  const vendorPhoneFor = useCallback((purchaseOrVendorId, vendorName) => {
    const id = typeof purchaseOrVendorId === 'object'
      ? (purchaseOrVendorId?.vendorId || '')
      : purchaseOrVendorId;
    const byId = vendors.find((v) => String(v.id) === String(id));
    if (byId?.phone) return byId.phone;
    if (vendorName) {
      const byName = vendors.find((v) => String(v.name || '').toLowerCase() === String(vendorName).toLowerCase());
      if (byName?.phone) return byName.phone;
    }
    if (typeof purchaseOrVendorId === 'object' && purchaseOrVendorId?.vendorPhone) {
      return purchaseOrVendorId.vendorPhone;
    }
    return '';
  }, [vendors]);

  const buildPoMessage = (purchase, type) => {
    const companyName = company?.name || 'Amazon Printing Services';
    const vendorName = purchase.vendorName || 'Vendor';
    const po = purchase.poNumber || purchase.purchaseNo || purchase.id || '';
    const date = purchase.purchaseDate || purchase.date || '';
    const delivery = purchase.expectedDeliveryDate || '';
    const total = formatCurrency(purchase.totalAmount || purchase.total || 0);
    const items = (purchase.items || [])
      .slice(0, 8)
      .map((it, i) => `${i + 1}. ${it.name || 'Item'} × ${it.quantity || 0}`)
      .join('\n');
    const more = (purchase.items || []).length > 8
      ? `\n… +${(purchase.items || []).length - 8} more`
      : '';

    if (type === 'delivery') {
      return (
        `Dear ${vendorName},\n\n`
        + `*Reminder — Delivery*\n\n`
        + `Please deliver PO *${po}* as per schedule.`
        + (delivery ? `\nExpected delivery: *${formatDate(delivery)}*` : '')
        + `\n\nPO total: ${total}`
        + (items ? `\n\nItems:\n${items}${more}` : '')
        + `\n\nKindly confirm delivery status.\n\nThank you.\n${companyName}`
      );
    }

    // Default: PO created / order placed with vendor
    return (
      `Dear ${vendorName},\n\n`
      + `*Purchase Order*\n\n`
      + `Please find our purchase order *${po}*.`
      + (date ? `\nPO date: ${formatDate(date)}` : '')
      + (delivery ? `\nExpected delivery: *${formatDate(delivery)}*` : '')
      + `\n\nTotal amount: ${total}`
      + (items ? `\n\nItems:\n${items}${more}` : '')
      + (purchase.notes ? `\n\nNotes: ${purchase.notes}` : '')
      + `\n\nPlease confirm availability and delivery.\n\nThank you.\n${companyName}`
    );
  };

  const sendVendorWhatsApp = (purchase, type = 'po') => {
    const phone = vendorPhoneFor(purchase, purchase.vendorName);
    if (!phone) {
      toast.error('Vendor WhatsApp phone missing — add phone in Vendors');
      return;
    }
    const msg = buildPoMessage(purchase, type);
    const result = openWhatsAppChat(phone, msg);
    if (!result.ok) toast.error('Could not open WhatsApp');
    else if (type === 'delivery') toast.message('Delivery reminder opened — tap Send');
    else toast.message('PO message opened — tap Send');
  };

  const createVendorPayment = async ({ vendorName, vendorPhone, amount, refId, poNumber }) => {
    if (!paymentsAPI?.create || !(Number(amount) > 0)) return;
    try {
      const payment = {
        type: 'outflow',
        amount: Number(amount),
        vendorName: vendorName || '',
        refId: refId || poNumber || '',
        date: new Date().toISOString().split('T')[0],
        category: 'Purchase Payment',
        method: 'Cash',
        party: vendorName || '',
        partyPhone: vendorPhone || '',
        phone: vendorPhone || '',
        reference: poNumber || refId || '',
        notes: `Vendor payment — PO ${poNumber || refId || ''}`,
        totalAmount: Number(amount),
        balanceDue: 0,
      };
      const res = await paymentsAPI.create(payment);
      const saved = res?.data || payment;

      if (vendorPhone) {
        try {
          await notifyPaymentEvent({
            ...saved,
            type: 'outflow',
            party: vendorName || saved.party,
            partyPhone: vendorPhone,
            amount: Number(amount),
            method: saved.method || 'Cash',
            reference: poNumber || refId || saved.reference || '',
            notes: `Payment transfer for PO ${poNumber || refId || ''}`,
          }, { openWhatsApp: true });
          toast.success('Payment saved — WhatsApp opened for vendor');
        } catch (waErr) {
          console.error('Vendor WhatsApp failed', waErr);
          toast.message('Payment saved — WhatsApp could not open');
        }
      } else {
        toast.message('Payment saved — add vendor phone to send WhatsApp');
      }
    } catch (err) {
      console.error('Payment create failed', err);
      toast.error('Purchase saved but payment record failed');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.vendorId) {
      toast.error('Vendor select karein — ya pehle Add New Vendor');
      return;
    }
    if (!formData.items.every((it) => it.productId)) {
      toast.error('Har line pe product select karein — ya Add New Product');
      return;
    }
    setSaving(true);
    const vendor = vendors.find((v) => String(v.id) === String(formData.vendorId));
    if (!vendor) {
      toast.error('Selected vendor not found — list refresh karke dubara select karein');
      setSaving(false);
      return;
    }
    const totalAmount = calcTotal();
    let paidAmount = Number(formData.paidAmount) || 0;
    if (formData.status === 'Fully Paid') paidAmount = totalAmount;
    const payload = {
      vendorId: String(vendor.id),
      vendorName: String(vendor.name || '').trim(),
      vendorInvoiceNumber: formData.vendorInvoiceNumber || '',
      purchaseDate: formData.purchaseDate || new Date().toISOString().split('T')[0],
      date: formData.purchaseDate || new Date().toISOString().split('T')[0],
      expectedDeliveryDate: formData.expectedDeliveryDate || '',
      actualDeliveryDate: formData.status === 'Received'
        ? (formData.actualDeliveryDate || new Date().toISOString().split('T')[0])
        : (formData.actualDeliveryDate || ''),
      status: formData.status || 'Draft',
      linkedOrderId: formData.linkedOrderId || '',
      items: formData.items.map(({ productId, name, quantity, rate, unit }) => ({
        productId, name, quantity: Number(quantity) || 0, rate: Number(rate) || 0, unit: unit || 'piece',
      })),
      notes: formData.notes || '',
      totalAmount,
      total: totalAmount,
      paidAmount,
      paid: paidAmount,
      poNumber: formData.poNumber || editing?.poNumber || '',
      purchaseNo: formData.poNumber || editing?.poNumber || '',
      paymentStatus: formData.status === 'Fully Paid' ? 'Paid'
        : formData.status === 'Partial Paid' ? 'Partially Paid'
          : formData.status === 'Received' && paidAmount >= totalAmount ? 'Paid'
            : paidAmount > 0 ? 'Partially Paid' : 'Unpaid',
    };
    try {
      let saved;
      const wasReceived = editing?.status === 'Received';
      if (editing) {
        const res = await purchasesAPI.update(editing.id, payload);
        saved = normalizePurchase(res.data || { ...editing, ...payload });
        toast.success('Updated');
      } else {
        const res = await purchasesAPI.create(payload);
        saved = normalizePurchase(res.data || payload);
        toast.success('Purchase order created');
        // Open WhatsApp to vendor with PO details (Ordered / any non-draft, or always on create)
        if (payload.status !== 'Draft') {
          sendVendorWhatsApp({ ...saved, vendorName: vendor?.name || payload.vendorName }, 'po');
        } else if (vendor?.phone) {
          // Still offer PO message for draft if they want — only auto-send when Ordered+
        }
      }

      // When moving Draft → Ordered (or creating as Ordered), notify vendor
      if (
        editing
        && editing.status === 'Draft'
        && payload.status !== 'Draft'
        && payload.status !== 'Received'
      ) {
        sendVendorWhatsApp({ ...saved, vendorName: vendor?.name || payload.vendorName }, 'po');
      }

      if (isPaidStatus(formData.status) && paidAmount > 0) {
        const prevPaid = Number(editing?.paidAmount) || 0;
        const paymentAmount = editing && isPaidStatus(editing.status)
          ? Math.max(0, paidAmount - prevPaid)
          : paidAmount;
        if (paymentAmount > 0) {
          await createVendorPayment({
            vendorName: vendor?.name || payload.vendorName,
            vendorPhone: vendor?.phone || '',
            amount: paymentAmount,
            refId: saved?.id || editing?.id,
            poNumber: saved?.poNumber || editing?.poNumber,
          });
        }
      }

      if (formData.status === 'Received' && !wasReceived) {
        await applyStockIncrease(payload.items);
        toast.success('Stock updated for received items');
      }

      setDialogOpen(false);
      fetchAll();
    } catch (err) {
      console.error(err);
      toast.error('Failed');
    } finally { setSaving(false); }
  };

  const markReceived = async (p) => {
    if (!window.confirm('Mark as received? This updates inventory.')) return;
    const row = normalizePurchase(p);
    try {
      await purchasesAPI.update(row.id, {
        ...row,
        vendorId: row.vendorId,
        vendorName: row.vendorName,
        purchaseDate: row.purchaseDate,
        items: row.items,
        totalAmount: row.totalAmount,
        paidAmount: row.paidAmount,
        status: 'Received',
        actualDeliveryDate: new Date().toISOString().split('T')[0],
      });
      if (row.status !== 'Received') {
        await applyStockIncrease(row.items);
      }
      toast.success('Marked received. Inventory updated.');
      if (row.linkedOrderId) toast.info(`Linked order ${row.linkedOrderId} updated to Ready for Delivery.`);
      fetchAll();
    } catch (err) {
      console.error(err);
      toast.error('Failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this purchase?')) {
      try { await purchasesAPI.delete(id); toast.success('Deleted'); fetchAll(); }
      catch (e) { toast.error('Failed'); }
    }
  };

  const openPayment = (purchase) => {
    const row = normalizePurchase(purchase);
    const outstanding = Math.max(0, row.totalAmount - row.paidAmount);
    if (!(outstanding > 0)) {
      toast.message('This vendor bill is already fully paid');
      return;
    }
    setPaymentPurchase(row);
    setPaymentData({
      amount: outstanding,
      method: paymentMethods[0] || 'Cash',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const saveVendorPayment = async (e) => {
    e.preventDefault();
    if (!paymentPurchase) return;
    const amount = Number(paymentData.amount) || 0;
    const outstanding = Math.max(0, Number(paymentPurchase.totalAmount) - Number(paymentPurchase.paidAmount));
    if (!(amount > 0)) {
      toast.error('Enter a valid payment amount');
      return;
    }
    if (amount > outstanding) {
      toast.error(`Payment cannot exceed balance due (${formatCurrency(outstanding)})`);
      return;
    }

    setPaying(true);
    try {
      const vendor = vendors.find((v) => String(v.id) === String(paymentPurchase.vendorId));
      const poNumber = paymentPurchase.poNumber || paymentPurchase.purchaseNo || paymentPurchase.id;
      const notes = paymentData.notes || `Vendor bill payment — PO ${poNumber}`;
      const payBody = {
        amount,
        date: paymentData.date,
        method: paymentData.method,
        notes,
        partyPhone: vendor?.phone || '',
        partyEmail: vendor?.email || '',
      };

      let result;
      try {
        const res = await purchasesAPI.pay(paymentPurchase.id, payBody);
        result = res?.data || {};
      } catch (atomicErr) {
        // Fallback for older GAS deploys without /purchases/:id/pay
        console.warn('Atomic pay endpoint unavailable, using fallback', atomicErr);
        const paidAmount = Number(paymentPurchase.paidAmount) + amount;
        const fullyPaid = paidAmount >= Number(paymentPurchase.totalAmount);
        const purchaseStatus = paymentPurchase.status === 'Received'
          ? 'Received'
          : (fullyPaid ? 'Fully Paid' : 'Partial Paid');
        await purchasesAPI.update(paymentPurchase.id, {
          ...paymentPurchase,
          paidAmount,
          paid: paidAmount,
          status: purchaseStatus,
          paymentStatus: fullyPaid ? 'Paid' : 'Partially Paid',
        });
        const payment = {
          date: paymentData.date,
          type: 'outflow',
          category: 'Purchase Payment',
          method: paymentData.method,
          vendorId: paymentPurchase.vendorId || '',
          vendorName: paymentPurchase.vendorName || '',
          party: paymentPurchase.vendorName || '',
          partyPhone: vendor?.phone || '',
          phone: vendor?.phone || '',
          reference: poNumber,
          refId: paymentPurchase.id,
          amount,
          totalAmount: paymentPurchase.totalAmount,
          balanceDue: Math.max(0, outstanding - amount),
          notes,
        };
        const payRes = await paymentsAPI.create(payment);
        await expensesAPI.create({
          date: paymentData.date,
          category: 'Purchase Payment',
          amount,
          description: `Vendor bill payment · ${paymentPurchase.vendorName || 'Vendor'} · PO ${poNumber}`,
          paymentMethod: paymentData.method,
        });
        result = {
          purchase: { paidAmount, outstanding: Math.max(0, outstanding - amount) },
          payment: { ...payment, ...(payRes?.data || {}) },
        };
      }

      const savedPayment = {
        type: 'outflow',
        category: 'Purchase Payment',
        party: paymentPurchase.vendorName || '',
        partyPhone: vendor?.phone || result?.payment?.partyPhone || '',
        amount,
        method: paymentData.method,
        reference: poNumber,
        date: paymentData.date,
        notes,
        totalAmount: Number(paymentPurchase.totalAmount) || 0,
        balanceDue: Number(result?.payment?.balanceDue ?? Math.max(0, outstanding - amount)) || 0,
        ...(result?.payment || {}),
      };
      try { printPaymentSlip(savedPayment, company || {}); } catch { /* optional */ }
      if (savedPayment.partyPhone) {
        try {
          await notifyPaymentEvent(savedPayment, { openWhatsApp: true });
        } catch (waErr) {
          console.warn('Vendor payment WhatsApp failed', waErr);
        }
      }

      clearGasCache();
      setPaymentPurchase(null);
      const remaining = Number(result?.purchase?.outstanding ?? Math.max(0, outstanding - amount));
      toast.success(remaining <= 0 ? 'Vendor bill paid in full' : 'Partial vendor payment recorded');
      fetchAll();
    } catch (err) {
      console.error('Vendor payment failed', err);
      toast.error(err?.response?.data?.message || err?.message || 'Payment could not be recorded');
    } finally {
      setPaying(false);
    }
  };

  const statusColor = (s) => ({
    Draft: 'bg-gray-100 text-gray-800',
    Ordered: 'bg-blue-100 text-blue-800',
    'Partial Paid': 'bg-yellow-100 text-yellow-800',
    'Fully Paid': 'bg-emerald-100 text-emerald-800',
    Received: 'bg-green-100 text-green-800',
    'Purchase Order': 'bg-blue-100 text-blue-800',
    'In Transit': 'bg-yellow-100 text-yellow-800',
  }[s] || 'bg-gray-100');

  return (
    <div className="space-y-6" data-testid="purchases-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#0747a3' }}>Purchases</h1>
          <p className="text-gray-600 mt-1">Manage purchase orders, deliveries & vendor payments</p>
        </div>
        <Button onClick={openCreate} style={{ backgroundColor: '#ff6d00' }} className="text-white" data-testid="add-purchase-button"><Plus className="h-4 w-4 mr-2" />New PO</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 uppercase font-medium mb-1">Total POs</p><p className="text-2xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 uppercase font-medium mb-1">Pending</p><p className="text-2xl font-bold text-yellow-600">{stats.pending}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 uppercase font-medium mb-1">Received</p><p className="text-2xl font-bold text-green-600">{stats.received}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 uppercase font-medium mb-1">Total Value</p><p className="text-xl font-bold" style={{ color: '#ff6d00' }}>{formatCurrency(stats.totalValue)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 uppercase font-medium mb-1">Payable</p><p className="text-xl font-bold text-red-600">{formatCurrency(stats.unpaid)}</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input placeholder="Search by PO or vendor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" data-testid="purchase-search" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'all' ? undefined : v)}>
            <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Statuses</SelectItem>{PO_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="mt-3 max-w-md">
          <SortBar value={sort} onChange={setSort} options={PURCHASE_SORT_OPTS} />
        </div>
      </CardContent></Card>

      <Card>
        <CardHeader><CardTitle>Purchase Orders</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-gray-500">Loading...</div>
            : sorted.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">No purchase orders yet.</p>
                <Button onClick={openCreate} style={{ backgroundColor: '#ff6d00' }} className="text-white"><Plus className="h-4 w-4 mr-2" />Create First PO</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-3 text-xs uppercase font-semibold text-gray-600">PO #</th>
                      <th className="text-left py-3 px-3 text-xs uppercase font-semibold text-gray-600">Vendor</th>
                      <th className="text-left py-3 px-3 text-xs uppercase font-semibold text-gray-600">Date</th>
                      <th className="text-left py-3 px-3 text-xs uppercase font-semibold text-gray-600">Delivery</th>
                      <th className="text-left py-3 px-3 text-xs uppercase font-semibold text-gray-600">Status</th>
                      <th className="text-right py-3 px-3 text-xs uppercase font-semibold text-gray-600">Paid</th>
                      <th className="text-right py-3 px-3 text-xs uppercase font-semibold text-gray-600">Amount</th>
                      <th className="text-right py-3 px-3 text-xs uppercase font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map(p => {
                      const isOverdue = p.expectedDeliveryDate && new Date(p.expectedDeliveryDate) < new Date() && p.status !== 'Received';
                      return (
                        <tr key={p.id} className="border-b hover:bg-orange-50 transition-colors" data-testid={`purchase-row-${p.id}`}>
                          <td className="py-3 px-3">
                            <p className="font-bold" style={{ color: '#0747a3' }}>{p.poNumber}</p>
                            {p.vendorInvoiceNumber && <p className="text-xs text-gray-500">Inv: {p.vendorInvoiceNumber}</p>}
                            {p.linkedOrderId && <p className="text-xs" style={{ color: '#ff6d00' }}><Link2 className="h-3 w-3 inline" /> {p.linkedOrderId}</p>}
                          </td>
                          <td className="py-3 px-3 text-sm">{p.vendorName}</td>
                          <td className="py-3 px-3 text-sm text-gray-600">{formatDate(p.purchaseDate)}</td>
                          <td className="py-3 px-3 text-sm">
                            {p.expectedDeliveryDate && (
                              <div>
                                <p className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}>{formatDate(p.expectedDeliveryDate)}</p>
                                {isOverdue && <p className="text-xs text-red-500 flex items-center gap-0.5"><AlertTriangle className="h-3 w-3" />Overdue</p>}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3"><Badge className={statusColor(p.status)}>{p.status}</Badge></td>
                          <td className="py-3 px-3 text-right text-sm">{formatCurrency(p.paidAmount || 0)}</td>
                          <td className="py-3 px-3 text-right font-bold" style={{ color: '#ff6d00' }}>{formatCurrency(p.totalAmount)}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1 justify-end">
                              {p.status !== 'Received' && (
                                <Button size="icon" variant="ghost" onClick={() => markReceived(p)} title="Mark Received"><PackageCheck className="h-4 w-4 text-green-600" /></Button>
                              )}
                              {Math.max(0, Number(p.totalAmount) - Number(p.paidAmount)) > 0 && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-emerald-700 hover:bg-emerald-50"
                                  title="Pay vendor bill"
                                  onClick={() => openPayment(p)}
                                  data-testid={`pay-vendor-bill-${p.id}`}
                                >
                                  <CreditCard className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-green-600 hover:bg-green-50"
                                title="WhatsApp PO to vendor"
                                onClick={() => sendVendorWhatsApp(p, 'po')}
                              >
                                <WhatsAppIcon className="h-4 w-4" />
                              </Button>
                              {p.status !== 'Received' && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className={isOverdue ? 'text-amber-600 hover:bg-amber-50' : 'text-sky-600 hover:bg-sky-50'}
                                  title="Delivery reminder"
                                  onClick={() => sendVendorWhatsApp(p, 'delivery')}
                                >
                                  <Truck className="h-4 w-4" />
                                </Button>
                              )}
                              <Button size="icon" variant="ghost" onClick={() => openView(p)}><Eye className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-2xl font-bold" style={{ color: '#0747a3' }}>{editing ? 'Edit PO' : 'New Purchase Order'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>Vendor *</Label>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs"
                    style={{ color: '#ff6d00' }}
                    onClick={() => navigate('/accounts/vendors?new=1')}
                  >
                    <Building2 className="h-3 w-3 mr-1" />Add New Vendor
                  </Button>
                </div>
                <Select
                  value={formData.vendorId ? String(formData.vendorId) : undefined}
                  onValueChange={(v) => {
                    const vend = vendors.find((x) => String(x.id) === String(v));
                    setFormData({
                      ...formData,
                      vendorId: String(v),
                      vendorName: vend?.name || '',
                    });
                  }}
                >
                  <SelectTrigger data-testid="vendor-select"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={String(v.id)} value={String(v.id)}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.vendorName ? (
                  <p className="text-[11px] text-gray-500 mt-1">Selected: {formData.vendorName}</p>
                ) : null}
                {!vendors.length && (
                  <p className="text-[11px] text-red-600 mt-1">
                    Koi vendor nahi —{' '}
                    <button type="button" className="underline font-medium" onClick={() => navigate('/accounts/vendors?new=1')}>
                      Add New Vendor
                    </button>
                  </p>
                )}
              </div>
              <div><Label>Vendor Invoice #</Label><Input value={formData.vendorInvoiceNumber} onChange={(e) => setFormData({ ...formData, vendorInvoiceNumber: e.target.value })} /></div>
              <div><Label>Purchase Date</Label><Input type="date" value={formData.purchaseDate} onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })} /></div>
              <div><Label>Expected Delivery</Label><Input type="date" value={formData.expectedDeliveryDate} onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })} /></div>
              <div><Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger data-testid="purchase-status"><SelectValue /></SelectTrigger>
                  <SelectContent>{PO_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Paid Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })}
                  data-testid="paid-amount"
                />
              </div>
              <div className="col-span-2"><Label>Linked Customer Order</Label>
                <Select value={formData.linkedOrderId || undefined} onValueChange={(v) => setFormData({ ...formData, linkedOrderId: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Open orders only" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {linkableOrders.map((o) => (
                      <SelectItem key={o.id || o.orderId} value={o.orderId || o.id}>
                        {o.orderId || o.id} — {o.customerName || 'Customer'} ({o.status || 'Open'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Only open orders (not Delivered / Completed / Closed / Cancelled). Auto-updates to &quot;Ready for Delivery&quot; when PO is received.
                </p>
                {!linkableOrders.length && (
                  <p className="text-[11px] text-amber-700 mt-1">No open customer orders available to link.</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Items</Label>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => navigate('/warehouse/products?new=1')}>
                    <PackagePlus className="h-3 w-3 mr-1" />Add New Product
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={addItem}><Plus className="h-3 w-3 mr-1" />Add Item</Button>
                </div>
              </div>
              {!products.length && (
                <div className="mb-2 rounded-lg border border-dashed border-orange-300 bg-orange-50/60 p-3 text-center text-sm">
                  Catalog empty —{' '}
                  <button type="button" className="underline font-medium text-orange-700" onClick={() => navigate('/warehouse/products?new=1')}>
                    Add New Product
                  </button>
                </div>
              )}
              <div className="space-y-2">
                {formData.items.map((item, i) => (
                  <div key={item._key || item.id || `item-${i}`} className="grid grid-cols-12 gap-2 items-end p-2 border rounded">
                    <div className="col-span-5">
                      <Label className="text-xs">Product *</Label>
                      <Select value={item.productId || undefined} onValueChange={(v) => selectProduct(i, v)}>
                        <SelectTrigger data-testid={`product-select-${i}`}><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>
                          {products.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2"><Label className="text-xs">Qty</Label><Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 0)} /></div>
                    <div className="col-span-2"><Label className="text-xs">Purchase Price</Label><Input type="number" step="0.01" min="0" value={item.rate} onChange={(e) => updateItem(i, 'rate', parseFloat(e.target.value) || 0)} /></div>
                    <div className="col-span-2"><Label className="text-xs">Subtotal</Label><Input disabled value={formatCurrency(item.quantity * item.rate)} /></div>
                    <div className="col-span-1"><Button type="button" size="icon" variant="ghost" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4 text-red-600" /></Button></div>
                  </div>
                ))}
              </div>
              <div className="text-right mt-3 pt-3 border-t"><span className="text-sm text-gray-500">Total: </span><span className="text-xl font-bold" style={{ color: '#ff6d00' }}>{formatCurrency(calcTotal())}</span></div>
            </div>

            <div className="p-3 bg-orange-50 rounded border border-orange-200">
              <div className="flex items-center gap-2 mb-2"><Paperclip className="h-4 w-4" style={{ color: '#ff6d00' }} /><span className="text-sm font-semibold">Attachments</span></div>
              <Input type="file" multiple accept=".pdf,.jpg,.png,.doc,.docx,.xls,.xlsx" className="text-sm" />
              <p className="text-xs text-gray-500 mt-1">Supplier invoices, bills, quotations, receipts (uploads to Google Drive)</p>
            </div>

            <div><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} /></div>

            <DialogFooter className="gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}><X className="h-4 w-4 mr-1" />Cancel</Button>
              <Button type="submit" style={{ backgroundColor: '#ff6d00' }} className="text-white" disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? 'Saving...' : editing ? 'Update' : 'Create PO'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Purchase Order Details</DialogTitle></DialogHeader>
          {viewData && (
            <div className="space-y-4">
              <div className="flex justify-between items-start p-3 rounded-lg" style={{ backgroundColor: '#FFF4EB' }}>
                <div><p className="text-xs uppercase text-gray-500">PO Number</p><p className="text-xl font-bold" style={{ color: '#ff6d00' }}>{viewData.poNumber}</p></div>
                <div className="space-y-1 text-right"><Badge className={statusColor(viewData.status)}>{viewData.status}</Badge></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-gray-500">Vendor</p><p className="font-semibold">{viewData.vendorName}</p></div>
                <div><p className="text-xs text-gray-500">Vendor Invoice</p><p className="font-semibold">{viewData.vendorInvoiceNumber || '-'}</p></div>
                <div><p className="text-xs text-gray-500">Purchase Date</p><p className="font-semibold">{formatDate(viewData.purchaseDate)}</p></div>
                <div><p className="text-xs text-gray-500">Expected Delivery</p><p className="font-semibold">{formatDate(viewData.expectedDeliveryDate)}</p></div>
                <div><p className="text-xs text-gray-500">Actual Delivery</p><p className="font-semibold">{formatDate(viewData.actualDeliveryDate) || 'Not received'}</p></div>
                <div><p className="text-xs text-gray-500">Linked Order</p><p className="font-semibold" style={{ color: '#ff6d00' }}>{viewData.linkedOrderId || 'None'}</p></div>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Items</p>
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-gray-50"><th className="text-left p-2">Item</th><th className="text-right p-2">Qty</th><th className="text-right p-2">Rate</th><th className="text-right p-2">Amount</th></tr></thead>
                  <tbody>
                    {(viewData.items || []).map((it, i) => (
                      <tr key={it.id || `${it.name}-${it.quantity}-${it.rate}-${i}`} className="border-b"><td className="p-2">{it.name}</td><td className="text-right p-2">{it.quantity}</td><td className="text-right p-2">{formatCurrency(it.rate)}</td><td className="text-right p-2 font-semibold">{formatCurrency(it.quantity * it.rate)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 rounded-lg text-white" style={{ backgroundColor: '#ff6d00' }}>
                <div className="flex justify-between"><span>Total</span><span className="text-xl font-bold">{formatCurrency(viewData.totalAmount)}</span></div>
                <div className="flex justify-between"><span>Paid</span><span>{formatCurrency(viewData.paidAmount || 0)}</span></div>
                <div className="flex justify-between border-t border-white/20 pt-2 mt-2"><span>Balance</span><span className="font-bold">{formatCurrency((viewData.totalAmount || 0) - (viewData.paidAmount || 0))}</span></div>
              </div>
              {viewData.notes && <div><p className="text-xs text-gray-500">Notes</p><p className="text-sm">{viewData.notes}</p></div>}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {Math.max(0, Number(viewData.totalAmount) - Number(viewData.paidAmount)) > 0 && (
                  <Button
                    type="button"
                    className="text-white"
                    style={{ backgroundColor: '#ff6d00' }}
                    onClick={() => openPayment(viewData)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />Pay vendor bill
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="text-green-700 border-green-200 hover:bg-green-50"
                  onClick={() => sendVendorWhatsApp(viewData, 'po')}
                >
                  <WhatsAppIcon className="h-4 w-4 mr-2" />Send PO to vendor
                </Button>
                {viewData.status !== 'Received' && (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-sky-700 border-sky-200 hover:bg-sky-50"
                    onClick={() => sendVendorWhatsApp(viewData, 'delivery')}
                  >
                    <Truck className="h-4 w-4 mr-2" />Delivery reminder
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!paymentPurchase} onOpenChange={(open) => { if (!open && !paying) setPaymentPurchase(null); }}>
        <DialogContent className="max-w-md" data-testid="vendor-payment-dialog">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Pay Vendor Bill</DialogTitle>
          </DialogHeader>
          {paymentPurchase && (
            <form onSubmit={saveVendorPayment} className="space-y-4 mt-2">
              <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-3 text-sm">
                <p className="font-semibold text-gray-900">{paymentPurchase.vendorName || 'Vendor'}</p>
                <p className="text-gray-600 mt-1">PO: {paymentPurchase.poNumber || paymentPurchase.purchaseNo || '-'}</p>
                <div className="mt-3 flex justify-between">
                  <span className="text-gray-600">Balance due</span>
                  <strong style={{ color: '#ff6d00' }}>{formatCurrency(Math.max(0, paymentPurchase.totalAmount - paymentPurchase.paidAmount))}</strong>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Payment Date</Label>
                  <Input type="date" value={paymentData.date} onChange={(e) => setPaymentData((p) => ({ ...p, date: e.target.value }))} required />
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <Select value={paymentData.method} onValueChange={(method) => setPaymentData((p) => ({ ...p, method }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{paymentMethods.map((method) => <SelectItem key={method} value={method}>{method}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Amount *</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData((p) => ({ ...p, amount: e.target.value }))}
                  required
                  autoFocus
                  data-testid="vendor-payment-amount"
                />
              </div>
              <div>
                <Label>Note</Label>
                <Textarea value={paymentData.notes} onChange={(e) => setPaymentData((p) => ({ ...p, notes: e.target.value }))} placeholder="Cheque no., transfer reference, etc." rows={2} />
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setPaymentPurchase(null)} disabled={paying}>Cancel</Button>
                <Button type="submit" style={{ backgroundColor: '#ff6d00' }} className="text-white" disabled={paying} data-testid="save-vendor-payment">
                  <CreditCard className="h-4 w-4 mr-2" />{paying ? 'Saving…' : 'Record payment'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Purchases;
