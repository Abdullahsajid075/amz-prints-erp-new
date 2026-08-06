import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trackPublic } from '@/services/api';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/helpers';
import { useBrand } from '@/context/BrandContext';
import {
  Search, Package, Calendar, CheckCircle2, Circle, Truck,
  RefreshCw, MapPin, Hash,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Public order tracking — no ERP login.
 * Links: /track  or  /track/ORD-123  or  /track/TRK-1234
 */
const PublicOrderTracking = () => {
  const { code: routeCode } = useParams();
  const navigate = useNavigate();
  const { company, primary } = useBrand();
  const accent = primary || '#F26522';

  const [query, setQuery] = useState(routeCode || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(Boolean(routeCode));
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const companyName = company?.name || 'Amazon Printing Services';
  const companyPhone = company?.phone || '';
  const companyAddress = company?.address || '';

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
                Enter Order ID, Tracking Number, or Token No.
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
            <div className="rounded-2xl border border-orange-100 bg-white shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Order</p>
                  <h3 className="text-2xl font-bold" style={{ color: '#2E2E2E' }}>{order.orderId || '—'}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Tracking: <span className="font-semibold">{order.trackingNumber || order.trackCode || '—'}</span>
                    {order.tokenNo ? <> · Token {order.tokenNo}</> : null}
                  </p>
                  {order.customerName ? (
                    <p className="text-sm text-gray-600">Customer: {order.customerName}</p>
                  ) : null}
                </div>
                <Badge className={`${getStatusColor(order.status)} text-sm px-3 py-1`}>
                  {order.status || 'Unknown'}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                  <p className="text-[10px] uppercase text-gray-500 flex items-center gap-1"><Calendar className="h-3 w-3" /> Order date</p>
                  <p className="font-semibold mt-1">{formatDate(order.date) || '—'}</p>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                  <p className="text-[10px] uppercase text-gray-500 flex items-center gap-1"><Truck className="h-3 w-3" /> Delivery</p>
                  <p className="font-semibold mt-1">{formatDate(order.deliveryDate) || '—'}</p>
                </div>
                <div className="rounded-xl bg-[#FFF9F5] border border-orange-100 p-3">
                  <p className="text-[10px] uppercase text-gray-500">Balance</p>
                  <p className="font-bold mt-1" style={{ color: accent }}>{formatCurrency(order.balanceAmount)}</p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Total</span><strong>{formatCurrency(order.totalAmount)}</strong></div>
                <div className="flex justify-between"><span className="text-gray-600">Paid / Advance</span><strong className="text-emerald-700">{formatCurrency(order.advancePayment)}</strong></div>
                <div className="flex justify-between border-t pt-2"><span className="text-gray-600">Balance due</span><strong style={{ color: accent }}>{formatCurrency(order.balanceAmount)}</strong></div>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-2xl border border-orange-100 bg-white shadow-sm p-5 sm:p-6">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-700 mb-4">Production progress</h4>
              {order.cancelled ? (
                <p className="text-rose-600 font-semibold">This order was cancelled.</p>
              ) : (
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
              )}
            </div>

            {/* Items */}
            {Array.isArray(order.products) && order.products.length > 0 && (
              <div className="rounded-2xl border border-orange-100 bg-white shadow-sm p-5 sm:p-6">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" style={{ color: accent }} /> Items
                </h4>
                <div className="space-y-2">
                  {order.products.map((p, i) => (
                    <div key={`${p.name}-${i}`} className="flex justify-between gap-3 rounded-xl bg-gray-50 border border-gray-100 p-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          {[p.size && `Size ${p.size}`, p.material].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                      <p className="font-semibold shrink-0">× {p.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center text-xs text-gray-500 pb-8 space-y-1">
              {companyAddress && (
                <p className="flex items-center justify-center gap-1"><MapPin className="h-3 w-3" />{companyAddress}</p>
              )}
              {companyPhone && <p>Contact: {companyPhone}</p>}
              <p>{order.companyNote || 'Keep this link to check status anytime.'}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicOrderTracking;
