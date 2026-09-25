import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';
import { ordersAPI, productsAPI, purchasesAPI } from '@/services/api';
import { clearGasCache } from '@/services/gasClient';
import { buildPurchaseNeeds } from '@/utils/purchaseNeeds';
import { ClipboardCheck, ShoppingBag, Package, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const Acknowledgments = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      clearGasCache();
      const [ordRes, prodRes, poRes] = await Promise.all([
        ordersAPI.getAll(),
        productsAPI.getAll(),
        purchasesAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setRows(buildPurchaseNeeds({
        orders: Array.isArray(ordRes.data) ? ordRes.data : [],
        products: Array.isArray(prodRes.data) ? prodRes.data : [],
        purchases: Array.isArray(poRes.data) ? poRes.data : [],
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load acknowledgments');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="erp-page space-y-4" data-testid="acknowledgments-page">
      <PageHeader
        eyebrow="Operations"
        title="Acknowledgments"
        subtitle="Zero-stock booked items that still need a vendor purchase. Rows disappear when stock arrives or a matching PO is placed."
        testId="acknowledgments-header"
        actions={(
          <Button variant="outline" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-1" />Refresh
          </Button>
        )}
      />

      {loading ? (
        <p className="p-8 text-center text-slate-500">Loading…</p>
      ) : !rows.length ? (
        <div className="erp-panel p-10 text-center text-slate-500">
          <ClipboardCheck className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>No purchase acknowledgments. All booked items are covered by stock or a vendor order.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <article key={row.key} className="erp-panel p-4" data-testid="ack-need-row">
              <div className="flex flex-wrap items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-ink">{row.name}</h3>
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200">Need to purchase</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    Required <strong>{row.remaining}</strong>
                    {row.incoming ? ` · vendor PO covers ${row.incoming}` : ''}
                    {` · on-hand ${row.stock}`}
                  </p>
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
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Acknowledgments;
