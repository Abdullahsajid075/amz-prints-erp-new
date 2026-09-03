import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trackPublic } from '@/services/api';
import { getStatusColor } from '@/utils/helpers';
import { useBrand } from '@/context/BrandContext';
import {
  Search, Package, CheckCircle2, Circle, RefreshCw, Hash, User,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Public order tracking — no ERP login.
 * Shows only: customer name, order status, item names (no prices / balance).
 */
const PublicOrderTracking = () => {
  const { code: routeCode } = useParams();
  const navigate = useNavigate();
  const { company, primary } = useBrand();
  const accent = primary || '#ff6d00';

  const [query, setQuery] = useState(routeCode || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(routeCode));
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const companyName = company?.name || 'Amazon Printing Services';

  const lookup = useCallback(async (raw) => {
    const code = String(raw || '').trim();
    if (!code) {
      setError('Enter Order ID or Tracking Number');
      setOrder(null);
      return;
    }
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await trackPublic(code);
      const data = res?.data || res;
      if (!data || (!data.orderId && !data.trackingNumber && !data.status)) {
        throw new Error('Order not found');
      }
      setOrder(data);
      const trackCode = data.trackCode || data.trackingNumber || data.orderId || code;
      if (String(routeCode || '') !== String(trackCode)) {
        navigate(`/track/${encodeURIComponent(trackCode)}`, { replace: true });
      }
    } catch (err) {
      console.error(err);
      setOrder(null);
      setError(err?.response?.data?.message || err?.message || 'Order not found. Check your Order ID / Tracking Number.');
    } finally {
      setLoading(false);
    }
  }, [navigate, routeCode]);

  useEffect(() => {
    if (routeCode) {
      setQuery(routeCode);
      lookup(routeCode);
    }
  }, [routeCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = (e) => {
    e.preventDefault();
    const code = String(query || '').trim();
    if (!code) {
      toast.error('Enter Order ID or Tracking Number');
      return;
    }
    navigate(`/track/${encodeURIComponent(code)}`);
  };

  const timeline = useMemo(() => {
    if (Array.isArray(order?.timeline) && order.timeline.length) return order.timeline;
    return [];
  }, [order]);

  const itemNames = useMemo(() => {
    if (!Array.isArray(order?.products)) return [];
    return order.products
      .map((p) => String(p?.name || '').trim())
      .filter(Boolean);
  }, [order]);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFF7F2 0%, #F5F7FB 38%, #F5F7FB 100%)' }} data-testid="public-order-tracking">
      <header className="border-b border-orange-100/80 bg-white/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          {company?.logo ? (
            <img src={company.logo} alt="" className="h-10 w-10 object-contain rounded-lg" />
          ) : (
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: accent }}>
              {(companyName || 'A').charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-bold truncate" style={{ color: '#2E2E2E' }}>{companyName}</h1>
            <p className="text-xs text-gray-500">Order Tracking · No login required</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="rounded-2xl border border-orange-100 bg-white shadow-sm overflow-hidden">
          <div className="h-1.5" style={{ backgroundColor: accent }} />
          <div className="p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#2E2E2E' }}>Track your order</h2>
              <p className="text-sm text-gray-600 mt-1">
                Enter Order ID or Tracking Number.
              </p>
            </div>
            <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  className="pl-9 h-11"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. ORD-2026-001 or TRK-4821"
                  data-testid="track-input"
                />
              </div>
              <Button type="submit" className="h-11 text-white px-6" style={{ backgroundColor: accent }} disabled={loading} data-testid="track-submit">
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                Track
              </Button>
            </form>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl bg-white border border-gray-100 p-10 text-center text-gray-500">
            Looking up your order…
          </div>
        )}

        {!loading && error && searched && (
          <div className="rounded-2xl bg-white border border-rose-100 p-6 text-center">
            <Package className="h-10 w-10 mx-auto text-rose-300 mb-2" />
            <p className="font-semibold text-rose-700">Order not found</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
        )}

        {!loading && order && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-orange-100 bg-white shadow-sm p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <User className="h-5 w-5 shrink-0" style={{ color: accent }} />
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Customer</p>
                    <p className="text-xl font-bold truncate" style={{ color: '#2E2E2E' }}>
                      {order.customerName || '—'}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Order status</p>
                  <Badge className={`${getStatusColor(order.status)} text-sm px-3 py-1`}>
                    {order.status || 'Unknown'}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-2 flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" style={{ color: accent }} /> Items
                </p>
                {itemNames.length === 0 ? (
                  <p className="text-sm text-gray-400">No items listed</p>
                ) : (
                  <ul className="space-y-2">
                    {itemNames.map((name, i) => (
                      <li
                        key={`${name}-${i}`}
                        className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm font-semibold"
                        style={{ color: '#2E2E2E' }}
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {!order.cancelled && timeline.length > 0 && (
              <div className="rounded-2xl border border-orange-100 bg-white shadow-sm p-5 sm:p-6">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-700 mb-4">Progress</h4>
                <ol className="space-y-0">
                  {timeline.map((step, i) => {
                    const done = step.done;
                    const current = step.current;
                    return (
                      <li key={step.status} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                              current ? 'text-white' : done ? 'bg-emerald-50 border-emerald-400 text-emerald-600' : 'bg-gray-50 border-gray-200 text-gray-400'
                            }`}
                            style={current ? { backgroundColor: accent, borderColor: accent } : undefined}
                          >
                            {done && !current ? <CheckCircle2 className="h-4 w-4" /> : current ? <Package className="h-4 w-4" /> : <Circle className="h-3.5 w-3.5" />}
                          </div>
                          {i < timeline.length - 1 && (
                            <div className={`w-0.5 flex-1 min-h-[18px] ${done ? 'bg-emerald-300' : 'bg-gray-200'}`} />
                          )}
                        </div>
                        <div className={`pb-4 ${current ? 'font-bold' : ''}`} style={current ? { color: accent } : undefined}>
                          <p className={`text-sm ${current ? '' : done ? 'text-gray-800' : 'text-gray-400'}`}>{step.status}</p>
                          {current && <p className="text-xs text-gray-500 font-normal">Current stage</p>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {order.cancelled && (
              <div className="rounded-2xl border border-rose-100 bg-white p-5 text-rose-600 font-semibold">
                This order was cancelled.
              </div>
            )}

            <p className="text-center text-xs text-gray-500 pb-8">
              {order.companyNote || 'Keep this link to check status anytime.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicOrderTracking;
