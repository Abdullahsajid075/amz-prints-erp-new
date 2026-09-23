import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { verifyPublic } from '@/services/api';
import { formatCurrency } from '@/utils/helpers';
import { useBrand } from '@/context/BrandContext';
import { BadgeCheck, BadgeX, Hash, Loader2, Search } from 'lucide-react';

const KIND_LABEL = {
  invoice: 'Invoice',
  order: 'Order',
  pos: 'POS receipt',
  payment: 'Payment slip',
};

const PublicSlipVerify = () => {
  const { code: routeCode } = useParams();
  const navigate = useNavigate();
  const { company, primary } = useBrand();
  const accent = primary || '#ff6d00';
  const companyName = company?.name || 'Amazon Printing Services';

  const [query, setQuery] = useState(routeCode || '');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(routeCode));

  useEffect(() => {
    let cancelled = false;
    const code = String(routeCode || '').trim();
    if (!code) {
      setLoading(false);
      setData(null);
      return undefined;
    }
    setQuery(code);
    setLoading(true);
    setError('');
    (async () => {
      try {
        const res = await verifyPublic(code);
        if (!cancelled) setData(res?.data || res);
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(err?.response?.data?.message || err?.message || 'Document not found');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [routeCode]);

  const onSubmit = (e) => {
    e.preventDefault();
    const code = String(query || '').trim();
    if (!code) return;
    navigate(`/verify/${encodeURIComponent(code)}`);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FFF7F2 0%, #F5F7FB 38%, #F5F7FB 100%)' }} data-testid="public-slip-verify">
      <header className="border-b border-orange-100/80 bg-white/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          {company?.logo ? (
            <img src={company.logo} alt="" className="h-10 w-10 object-contain rounded-lg" />
          ) : (
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ backgroundColor: accent }}>
              {(companyName || 'A').charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold truncate" style={{ color: '#0747a3' }}>{companyName}</h1>
            <p className="text-xs text-gray-500">Document verification · No login required</p>
          </div>
          <Link to="/login" className="text-xs font-semibold text-gray-500 hover:text-gray-800 shrink-0">Staff login</Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 space-y-5">
        <form onSubmit={onSubmit} className="rounded-2xl border border-orange-100 bg-white shadow-sm p-4 flex gap-2">
          <div className="relative flex-1">
            <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9 h-11"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="POS / Invoice / Payment / Tracking code"
              data-testid="verify-input"
            />
          </div>
          <Button type="submit" className="h-11 text-white px-5" style={{ backgroundColor: accent }} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>

        {loading && (
          <div className="rounded-2xl bg-white border border-gray-100 p-10 text-center text-gray-500">
            <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
            Verifying document…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl bg-white border border-rose-100 p-6 text-center">
            <BadgeX className="h-10 w-10 mx-auto text-rose-400 mb-2" />
            <p className="font-semibold text-rose-700">Not verified</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
        )}

        {!loading && data?.verified && (
          <div className="rounded-2xl border border-emerald-200 bg-white shadow-sm p-6 space-y-4" data-testid="verify-result">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <BadgeCheck className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-emerald-700 font-bold">Verified</p>
                <h2 className="text-xl font-black" style={{ color: '#0747a3' }}>
                  {KIND_LABEL[data.kind] || 'Document'}
                </h2>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500 text-xs uppercase font-semibold">Code</dt>
                <dd className="font-bold">{data.invoiceNumber || data.orderId || data.reference || data.code}</dd>
              </div>
              {data.date ? (
                <div>
                  <dt className="text-gray-500 text-xs uppercase font-semibold">Date</dt>
                  <dd className="font-bold">{data.date}</dd>
                </div>
              ) : null}
              {(data.customerName || data.party) ? (
                <div>
                  <dt className="text-gray-500 text-xs uppercase font-semibold">Party</dt>
                  <dd className="font-bold">{data.customerName || data.party}</dd>
                </div>
              ) : null}
              {data.status ? (
                <div>
                  <dt className="text-gray-500 text-xs uppercase font-semibold">Status</dt>
                  <dd className="font-bold">{data.status}</dd>
                </div>
              ) : null}
              {data.amount != null && data.amount !== '' ? (
                <div>
                  <dt className="text-gray-500 text-xs uppercase font-semibold">Amount</dt>
                  <dd className="font-bold">{formatCurrency(data.amount)}</dd>
                </div>
              ) : null}
              {data.totalAmount != null && data.kind !== 'payment' ? (
                <div>
                  <dt className="text-gray-500 text-xs uppercase font-semibold">Total</dt>
                  <dd className="font-bold">{formatCurrency(data.totalAmount)}</dd>
                </div>
              ) : null}
              {data.method ? (
                <div>
                  <dt className="text-gray-500 text-xs uppercase font-semibold">Method</dt>
                  <dd className="font-bold">{data.method}</dd>
                </div>
              ) : null}
            </dl>
            {Array.isArray(data.items) && data.items.length > 0 && (
              <div>
                <p className="text-xs uppercase text-gray-500 font-semibold mb-1">Items</p>
                <ul className="text-sm font-semibold space-y-1">
                  {data.items.map((name, i) => <li key={`${name}-${i}`}>{name}</li>)}
                </ul>
              </div>
            )}
            <p className="text-xs text-gray-500">This document was issued by {companyName}.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicSlipVerify;
