import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import { ordersAPI, productsAPI, purchasesAPI, invoicesAPI, customersAPI, vendorsAPI } from '@/services/api';
import { clearGasCache } from '@/services/gasClient';
import { buildPurchaseNeeds } from '@/utils/purchaseNeeds';
import {
  buildLateOrders,
  buildCustomerBalanceReminders,
  buildPurchaseDeliveryReminders,
  loadResolvedAckKeys,
  saveResolvedAckKey,
  isAckExplicitlyResolved,
  loadAckSchedule,
  markAckReminded,
  rescheduleAck,
  filterVisibleAckRows,
  todayKey,
} from '@/utils/ackAlerts';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { openUrduBalanceWhatsApp } from '@/utils/customerHelpers';
import { openWhatsAppChat, openBlankWhatsAppTab } from '@/services/notifications/whatsappChannel';
import { useBrand } from '@/context/BrandContext';
import { ClipboardCheck, ShoppingBag, Package, RefreshCw, Clock, Truck, Receipt, Bell, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';

function vendorPhone(vendors, row) {
  if (row.vendorPhone) return row.vendorPhone;
  const byId = (vendors || []).find((v) => String(v.id) === String(row.vendorId));
  if (byId?.phone) return byId.phone;
  const byName = (vendors || []).find((v) => String(v.name || '').toLowerCase() === String(row.vendorName || '').toLowerCase());
  return byName?.phone || '';
}

function poDeliveryMessage(row, companyName) {
  const items = (row.items || [])
    .slice(0, 8)
    .map((it, i) => `${i + 1}. ${it.name || 'Item'} × ${it.quantity || 0}`)
    .join('\n');
  const more = (row.items || []).length > 8 ? `\n… +${(row.items || []).length - 8} more` : '';
  return (
    `Dear ${row.vendorName || 'Vendor'},\n\n`
    + `*Reminder — Delivery*\n\n`
    + `Please deliver PO *${row.poNumber}* as per schedule.`
    + (row.expectedDeliveryDate ? `\nExpected delivery: *${formatDate(row.expectedDeliveryDate)}*` : '')
    + (row.totalAmount ? `\n\nPO total: ${formatCurrency(row.totalAmount)}` : '')
    + (items ? `\n\nItems:\n${items}${more}` : '')
    + `\n\nKindly confirm delivery status.\n\nThank you.\n${companyName}`
  );
}

const Acknowledgments = () => {
  const navigate = useNavigate();
  const { company } = useBrand();
  const [purchaseRows, setPurchaseRows] = useState([]);
  const [lateOrders, setLateOrders] = useState([]);
  const [balances, setBalances] = useState([]);
  const [poReminders, setPoReminders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [resolvedMap, setResolvedMap] = useState(() => loadResolvedAckKeys());
  const [schedule, setSchedule] = useState(() => loadAckSchedule());
  const [loading, setLoading] = useState(true);
  const [rescheduleRow, setRescheduleRow] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      clearGasCache();
      const [ordRes, prodRes, poRes, invRes, custRes, vendRes] = await Promise.all([
        ordersAPI.getAll(),
        productsAPI.getAll(),
        purchasesAPI.getAll().catch(() => ({ data: [] })),
        invoicesAPI.getAll().catch(() => ({ data: [] })),
        customersAPI.getAll().catch(() => ({ data: [] })),
        vendorsAPI.getAll().catch(() => ({ data: [] })),
      ]);
      const orders = Array.isArray(ordRes.data) ? ordRes.data : [];
      const products = Array.isArray(prodRes.data) ? prodRes.data : [];
      const purchases = Array.isArray(poRes.data) ? poRes.data : [];
      const invoices = Array.isArray(invRes.data) ? invRes.data : [];
      const customers = Array.isArray(custRes.data) ? custRes.data : [];
      setVendors(Array.isArray(vendRes.data) ? vendRes.data : []);
      setPurchaseRows(buildPurchaseNeeds({ orders, products, purchases }));
      setLateOrders(buildLateOrders(orders));
      setBalances(buildCustomerBalanceReminders({ invoices, customers }));
      setPoReminders(buildPurchaseDeliveryReminders(purchases));
      setResolvedMap(loadResolvedAckKeys());
      setSchedule(loadAckSchedule());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load acknowledgments');
      setPurchaseRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visiblePurchases = useMemo(
    () => purchaseRows.filter((row) => !isAckExplicitlyResolved(row, resolvedMap)),
    [purchaseRows, resolvedMap],
  );
  const visibleBalances = useMemo(() => filterVisibleAckRows(balances, schedule), [balances, schedule]);
  const visiblePos = useMemo(() => filterVisibleAckRows(poReminders, schedule), [poReminders, schedule]);

  const resolvePurchase = (row) => {
    saveResolvedAckKey(row.key, { required: row.required, remaining: row.remaining });
    setResolvedMap(loadResolvedAckKeys());
    toast.message('Requirement marked resolved. It will return if the shortage changes.');
  };

  const sendBalanceReminder = (row) => {
    const customer = row.customer || {
      name: row.customerName,
      phone: row.customerPhone,
      customerCode: row.customerCode,
      id: row.customerId,
    };
    if (!customer.phone) {
      toast.error('Customer phone required for WhatsApp');
      return;
    }
    const pending = openBlankWhatsAppTab();
    const result = openUrduBalanceWhatsApp(customer, { outstanding: row.outstanding, pendingWindow: pending });
    if (!result?.ok) {
      toast.error('Could not open WhatsApp — check customer phone / allow popups');
      return;
    }
    setSchedule(markAckReminded(row.key));
    toast.success('Payment reminder opened — tap Send. This acknowledgment is hidden until you reschedule it.');
  };

  const sendPoReminder = (row) => {
    const phone = vendorPhone(vendors, row);
    if (!phone) {
      toast.error('Vendor WhatsApp phone missing — add phone in Vendors');
      return;
    }
    const pending = openBlankWhatsAppTab();
    const result = openWhatsAppChat(phone, poDeliveryMessage(row, company?.name || 'Amazon Printing Services'), { pendingWindow: pending });
    if (!result?.ok) {
      toast.error('Could not open WhatsApp');
      return;
    }
    setSchedule(markAckReminded(row.key));
    toast.success('PO delivery reminder opened — tap Send. This acknowledgment is hidden until you reschedule it.');
  };

  const openReschedule = (row) => {
    setRescheduleRow(row);
    setRescheduleDate(todayKey());
  };

  const saveReschedule = () => {
    if (!rescheduleRow || !rescheduleDate) {
      toast.error('Pick a date');
      return;
    }
    setSchedule(rescheduleAck(rescheduleRow.key, rescheduleDate));
    toast.success(`Reminder will appear again on ${formatDate(rescheduleDate)}`);
    setRescheduleRow(null);
  };

  return (
    <div className="erp-page space-y-4" data-testid="acknowledgments-page">
      <PageHeader
        eyebrow="Operations"
        title="Acknowledgments"
        subtitle="Open purchase needs, late jobs, customer payment reminders, and vendor delivery reminders. Delivered orders are not listed here."
        testId="acknowledgments-header"
        actions={(
          <Button variant="outline" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-1" />Refresh
          </Button>
        )}
      />

      {loading ? (
        <p className="p-8 text-center text-slate-500">Loading…</p>
      ) : (
        <div className="space-y-6">
          <section className="space-y-2" data-testid="ack-purchase-needs">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Purchase requirements</h2>
            {!visiblePurchases.length ? (
              <div className="erp-panel p-8 text-center text-slate-500">
                <ClipboardCheck className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p>No open purchase acknowledgments. Partial coverage stays listed until the remaining quantity is zero.</p>
              </div>
            ) : visiblePurchases.map((row) => (
              <article key={row.key} className="erp-panel p-4" data-testid="ack-need-row">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-ink">{row.name}</h3>
                      <Badge className={row.status === 'Partially covered'
                        ? 'bg-sky-100 text-sky-800 border-sky-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'}
                      >
                        {row.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-sm">
                      <p>Required <strong>{row.required}</strong></p>
                      <p>Ordered <strong>{row.ordered}</strong></p>
                      <p>On-hand <strong>{row.stock}</strong></p>
                      <p>Remaining <strong className="text-amber-800">{row.remaining}</strong></p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Booked on {row.orders.map((o) => o.orderId).join(', ')}
                      {row.orders[0]?.customerName ? ` · ${row.orders[0].customerName}` : ''}
                    </p>
                  </div>
                  <Button
                    className="text-white"
                    style={{ backgroundColor: '#ff6d00' }}
                    onClick={() => navigate(`/purchases?product=${encodeURIComponent(row.productId || row.name)}&qty=${row.remaining}`)}
                  >
                    <ShoppingBag className="h-4 w-4 mr-1" />Create vendor PO
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => resolvePurchase(row)}>Resolve</Button>
                </div>
              </article>
            ))}
          </section>

          <section className="space-y-2" data-testid="ack-late-orders">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Late orders</h2>
            {!lateOrders.length ? (
              <p className="erp-panel p-4 text-sm text-slate-500">No overdue open orders.</p>
            ) : lateOrders.map((row) => (
              <article key={row.key} className="erp-panel p-4 flex flex-wrap items-start gap-3">
                <Clock className="h-5 w-5 text-rose-600 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{row.orderId} · {row.customerName || 'Customer'}</p>
                  <p className="text-sm text-slate-600">
                    Expected {formatDate(row.dueDate)} · {row.overdueDays} day{row.overdueDays === 1 ? '' : 's'} overdue · {row.status}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/orders')}>Open orders</Button>
              </article>
            ))}
          </section>

          <section className="space-y-2" data-testid="ack-customer-balances">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Payment reminders</h2>
            {!visibleBalances.length ? (
              <p className="erp-panel p-4 text-sm text-slate-500">No overdue customer balances right now.</p>
            ) : visibleBalances.map((row) => (
              <article key={row.key} className="erp-panel p-4 flex flex-wrap items-start gap-3" data-testid="ack-balance-row">
                <Receipt className="h-5 w-5 text-sky-700 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{row.customerName}</p>
                  <p className="text-sm text-slate-600">
                    Overall balance {formatCurrency(row.outstanding)}
                    {row.dueDate ? ` · oldest due ${formatDate(row.dueDate)}` : ''}
                    {row.overdueDays ? ` · ${row.overdueDays} day${row.overdueDays === 1 ? '' : 's'} overdue` : ''}
                    {row.invoiceCount ? ` · ${row.invoiceCount} open invoice${row.invoiceCount === 1 ? '' : 's'}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="text-white"
                    style={{ backgroundColor: '#25D366' }}
                    onClick={() => sendBalanceReminder(row)}
                    data-testid={`ack-balance-reminder-${row.customerId || row.key}`}
                  >
                    <Bell className="h-4 w-4 mr-1" />Reminder
                  </Button>
                  <Button variant="outline" onClick={() => openReschedule(row)}>
                    <CalendarClock className="h-4 w-4 mr-1" />Reschedule
                  </Button>
                </div>
              </article>
            ))}
          </section>

          <section className="space-y-2" data-testid="ack-po-delivery">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Purchase order reminders</h2>
            <p className="text-xs text-slate-500">Shown from 2 days before the expected delivery date until the PO is received.</p>
            {!visiblePos.length ? (
              <p className="erp-panel p-4 text-sm text-slate-500">No purchase orders due in the next 2 days.</p>
            ) : visiblePos.map((row) => (
              <article key={row.key} className="erp-panel p-4 flex flex-wrap items-start gap-3" data-testid="ack-po-row">
                <Truck className="h-5 w-5 text-amber-700 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{row.poNumber} · {row.vendorName}</p>
                  <p className="text-sm text-slate-600">
                    Expected {formatDate(row.expectedDeliveryDate)}
                    {row.daysUntil > 0 ? ` · in ${row.daysUntil} day${row.daysUntil === 1 ? '' : 's'}` : row.daysUntil === 0 ? ' · due today' : ` · ${Math.abs(row.daysUntil)} day${Math.abs(row.daysUntil) === 1 ? '' : 's'} overdue`}
                    {row.totalAmount ? ` · ${formatCurrency(row.totalAmount)}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="text-white"
                    style={{ backgroundColor: '#25D366' }}
                    onClick={() => sendPoReminder(row)}
                    data-testid={`ack-po-reminder-${row.id || row.poNumber}`}
                  >
                    <Bell className="h-4 w-4 mr-1" />Reminder
                  </Button>
                  <Button variant="outline" onClick={() => openReschedule(row)}>
                    <CalendarClock className="h-4 w-4 mr-1" />Reschedule
                  </Button>
                </div>
              </article>
            ))}
          </section>
        </div>
      )}

      <Dialog open={!!rescheduleRow} onOpenChange={(open) => { if (!open) setRescheduleRow(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reschedule reminder</DialogTitle>
            <DialogDescription>
              This acknowledgment will hide and appear again on the date you choose.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleRow(null)}>Cancel</Button>
            <Button className="text-white" style={{ backgroundColor: '#ff6d00' }} onClick={saveReschedule}>Save date</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Acknowledgments;
