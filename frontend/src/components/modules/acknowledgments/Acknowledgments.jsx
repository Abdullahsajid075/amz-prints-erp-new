import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';
import { ordersAPI, productsAPI, purchasesAPI, invoicesAPI } from '@/services/api';
import { clearGasCache } from '@/services/gasClient';
import { buildPurchaseNeeds } from '@/utils/purchaseNeeds';
import {
  buildLateOrders,
  buildOverduePayables,
  buildOverdueReceivables,
  buildAdminReviewOrders,
  loadResolvedAckKeys,
  saveResolvedAckKey,
  isAckExplicitlyResolved,
} from '@/utils/ackAlerts';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { useAuth } from '@/context/AuthContext';
import { hasFullAccess } from '@/utils/permissions';
import { ClipboardCheck, ShoppingBag, Package, RefreshCw, Clock, Wallet, Receipt, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

const Acknowledgments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const admin = hasFullAccess(user);
  const [purchaseRows, setPurchaseRows] = useState([]);
  const [lateOrders, setLateOrders] = useState([]);
  const [payables, setPayables] = useState([]);
  const [receivables, setReceivables] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [resolvedMap, setResolvedMap] = useState(() => loadResolvedAckKeys());
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      clearGasCache();
      const [ordRes, prodRes, poRes, invRes] = await Promise.all([
        ordersAPI.getAll(),
        productsAPI.getAll(),
        purchasesAPI.getAll().catch(() => ({ data: [] })),
        invoicesAPI.getAll().catch(() => ({ data: [] })),
      ]);
      const orders = Array.isArray(ordRes.data) ? ordRes.data : [];
      const products = Array.isArray(prodRes.data) ? prodRes.data : [];
      const purchases = Array.isArray(poRes.data) ? poRes.data : [];
      const invoices = Array.isArray(invRes.data) ? invRes.data : [];
      setPurchaseRows(buildPurchaseNeeds({ orders, products, purchases }));
      setLateOrders(buildLateOrders(orders));
      setPayables(buildOverduePayables(purchases));
      setReceivables(buildOverdueReceivables(invoices));
      setReviews(buildAdminReviewOrders(orders));
      setResolvedMap(loadResolvedAckKeys());
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

  const resolvePurchase = (row) => {
    saveResolvedAckKey(row.key, { required: row.required, remaining: row.remaining });
    setResolvedMap(loadResolvedAckKeys());
    toast.message('Requirement marked resolved. It will return if the shortage changes.');
  };

  const restoreAuto = async () => {
    if (!admin) return;
    setRestoring(true);
    try {
      const res = await ordersAPI.restoreAutoDeliveries();
      const data = res.data || {};
      toast.success(`Restore complete: ${data.restored?.length || 0} restored, ${data.flagged?.length || 0} flagged for review`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not restore auto-delivered orders');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="erp-page space-y-4" data-testid="acknowledgments-page">
      <PageHeader
        eyebrow="Operations"
        title="Acknowledgments"
        subtitle="Open requirements stay visible until they are fully covered or an authorized user resolves them. Dismissing a popup does not close these items."
        testId="acknowledgments-header"
        actions={(
          <div className="flex gap-2">
            {admin && (
              <Button variant="outline" onClick={restoreAuto} disabled={restoring}>
                <ShieldAlert className="h-4 w-4 mr-1" />{restoring ? 'Restoring…' : 'Restore auto-deliveries'}
              </Button>
            )}
            <Button variant="outline" onClick={load}>
              <RefreshCw className="h-4 w-4 mr-1" />Refresh
            </Button>
          </div>
        )}
      />

      {loading ? (
        <p className="p-8 text-center text-slate-500">Loading…</p>
      ) : (
        <div className="space-y-6">
          {reviews.length > 0 && (
            <section className="space-y-2" data-testid="ack-admin-review">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-rose-800">Administrator review</h2>
              {reviews.map((row) => (
                <article key={row.key} className="erp-panel p-4 border border-rose-100">
                  <p className="font-semibold">{row.orderId} · {row.customerName || 'Customer'}</p>
                  <p className="text-sm text-slate-600 mt-1">Status {row.status}. Genuine delivery history was preserved. Review before changing this job.</p>
                </article>
              ))}
            </section>
          )}

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
                  <div className="flex flex-col gap-2">
                    <Button
                      className="text-white"
                      style={{ backgroundColor: '#ff6d00' }}
                      onClick={() => navigate(`/purchases?product=${encodeURIComponent(row.productId || row.name)}&qty=${row.remaining}`)}
                    >
                      <ShoppingBag className="h-4 w-4 mr-1" />Create vendor PO
                    </Button>
                    {admin && (
                      <Button variant="outline" size="sm" onClick={() => resolvePurchase(row)}>
                        Resolve
                      </Button>
                    )}
                  </div>
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
                <Button variant="outline" size="sm" onClick={() => navigate(`/orders`)}>Open orders</Button>
              </article>
            ))}
          </section>

          <section className="space-y-2" data-testid="ack-overdue-payables">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Overdue payables</h2>
            {!payables.length ? (
              <p className="erp-panel p-4 text-sm text-slate-500">No overdue supplier invoices.</p>
            ) : payables.map((row) => (
              <article key={row.key} className="erp-panel p-4 flex flex-wrap items-start gap-3">
                <Wallet className="h-5 w-5 text-amber-700 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{row.supplierName} · {row.invoiceRef}</p>
                  <p className="text-sm text-slate-600">
                    Outstanding {formatCurrency(row.outstanding)} · due {formatDate(row.dueDate)} · {row.overdueDays} day{row.overdueDays === 1 ? '' : 's'} overdue
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/purchases')}>Open purchases</Button>
              </article>
            ))}
          </section>

          <section className="space-y-2" data-testid="ack-overdue-receivables">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">Overdue receivables</h2>
            {!receivables.length ? (
              <p className="erp-panel p-4 text-sm text-slate-500">No overdue customer invoices.</p>
            ) : receivables.map((row) => (
              <article key={row.key} className="erp-panel p-4 flex flex-wrap items-start gap-3">
                <Receipt className="h-5 w-5 text-sky-700 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{row.customerName || 'Customer'} · {row.invoiceNumber}</p>
                  <p className="text-sm text-slate-600">
                    Outstanding {formatCurrency(row.outstanding)} · due {formatDate(row.dueDate)} · {row.overdueDays} day{row.overdueDays === 1 ? '' : 's'} overdue
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate(row.id ? `/invoices/${row.id}` : '/invoices')}>Open invoice</Button>
              </article>
            ))}
          </section>
        </div>
      )}
    </div>
  );
};

export default Acknowledgments;
