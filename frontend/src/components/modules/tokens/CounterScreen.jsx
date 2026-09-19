import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { countersAPI, tokensAPI } from '@/services/api';
import { toast } from 'sonner';
import { ArrowLeft, Bell, CheckCircle2, ShoppingCart, SkipForward, RefreshCw, Loader2, XCircle } from 'lucide-react';

const TOKEN_STATUSES = [
  { key: 'waiting', label: 'Waiting', className: 'bg-amber-100 text-amber-800' },
  { key: 'called', label: 'Called', className: 'bg-orange-100 text-orange-800' },
  { key: 'in progress', label: 'In Progress', className: 'bg-blue-100 text-blue-800' },
  { key: 'completed', label: 'Completed', className: 'bg-green-100 text-green-800' },
  { key: 'cancelled', label: 'Cancelled', className: 'bg-red-100 text-red-800' },
];

const statusMeta = (status) => {
  const s = String(status || '').toLowerCase();
  const known = TOKEN_STATUSES.find((t) => t.key === s);
  if (known) return known;
  if (s === 'ordered') return { label: 'Completed', className: 'bg-green-100 text-green-800' };
  if (s === 'skipped') return { label: status || 'Skipped', className: 'bg-gray-100 text-gray-700' };
  return { label: status || 'Unknown', className: 'bg-slate-100 text-slate-700' };
};

const statusColor = (status) => statusMeta(status).className;
const statusLabel = (status) => statusMeta(status).label;

const CounterScreen = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [counters, setCounters] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [counterName, setCounterName] = useState(searchParams.get('counter') || '');
  const [loading, setLoading] = useState(false);

  const loadCounters = useCallback(async () => {
    try {
      const res = await countersAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : [];
      setCounters(list);
      if (!counterName) {
        setCounterName(list.length ? list[0].counterName : '__all__');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load counters');
    }
  }, [counterName]);

  const loadTokens = useCallback(async () => {
    try {
      const params = { date: 'today' };
      if (counterName && counterName !== '__all__') {
        params.counter = counterName;
      } else {
        params.counter = 'all';
      }
      const res = await tokensAPI.getAll(params);
      let list = Array.isArray(res.data) ? res.data : [];
      // Fallback: if Today is empty, show recent open tokens so counter never looks broken
      if (!list.length) {
        const allRes = await tokensAPI.getAll({ date: 'all', counter: params.counter });
        const all = Array.isArray(allRes.data) ? allRes.data : [];
        list = all.filter((t) =>
          ['waiting', 'called', 'in progress'].includes(String(t.status || '').toLowerCase())
        ).slice(0, 40);
      }
      setTokens(list);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to load tokens');
      setTokens([]);
    }
  }, [counterName]);

  useEffect(() => {
    loadCounters();
  }, [loadCounters]);

  useEffect(() => {
    if (!counterName) return;
    if (counterName !== '__all__') {
      setSearchParams({ counter: counterName });
    } else {
      setSearchParams({});
    }
    loadTokens();
    const timer = setInterval(loadTokens, 12000);
    return () => clearInterval(timer);
  }, [counterName, loadTokens, setSearchParams]);

  const waiting = useMemo(
    () => tokens.filter((t) => String(t.status).toLowerCase() === 'waiting'),
    [tokens]
  );
  const active = useMemo(
    () => tokens.filter((t) => ['called', 'in progress'].includes(String(t.status).toLowerCase())),
    [tokens]
  );
  const current = active[0] || null;
  const nextWaiting = waiting[0] || null;

  const callToken = async (token) => {
    setLoading(true);
    try {
      await tokensAPI.call(token.tokenNo || token.id);
      toast.success(`Calling ${token.tokenNo}`);
      await loadTokens();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to call token');
    } finally {
      setLoading(false);
    }
  };

  const skipToken = async (token) => {
    setLoading(true);
    try {
      await tokensAPI.skip(token.tokenNo || token.id);
      toast.message(`${token.tokenNo} skipped`);
      await loadTokens();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to skip token');
    } finally {
      setLoading(false);
    }
  };

  const completeToken = async (token) => {
    setLoading(true);
    try {
      await tokensAPI.complete(token.tokenNo || token.id);
      toast.success(`${token.tokenNo} completed`);
      await loadTokens();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete');
    } finally {
      setLoading(false);
    }
  };

  const progressToken = async (token) => {
    setLoading(true);
    try {
      await tokensAPI.progress(token.tokenNo || token.id);
      toast.success(`${token.tokenNo} → In Progress`);
      await loadTokens();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark in progress');
    } finally {
      setLoading(false);
    }
  };

  const cancelToken = async (token) => {
    if (!window.confirm(`Cancel token ${token.tokenNo}?`)) return;
    setLoading(true);
    try {
      await tokensAPI.cancel(token.tokenNo || token.id);
      toast.message(`${token.tokenNo} cancelled`);
      await loadTokens();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = (token) => {
    const params = new URLSearchParams({
      customerName: token.customerName || '',
      customerPhone: token.customerPhone || '',
      customerId: token.customerId || '',
      service: token.service || '',
      tokenNo: token.tokenNo || '',
    });
    navigate(`/orders/new?${params.toString()}`);
  };

  return (
    <div className="space-y-6" data-testid="counter-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/tokens')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Booking
          </Button>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>Counter Screen</h1>
            <p className="text-sm text-gray-500">Live queue · auto-refresh every 12s</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={counterName || undefined} onValueChange={setCounterName}>
            <SelectTrigger className="w-[240px]" data-testid="counter-select">
              <SelectValue placeholder="Select counter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All counters</SelectItem>
              {counters.map((c) => (
                <SelectItem key={c.counterName} value={c.counterName}>
                  {c.counterName}{c.accessHolder ? ` · ${c.accessHolder}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadTokens}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2" data-testid="token-status-legend">
        <span className="text-xs text-gray-500 uppercase font-medium mr-1">Statuses</span>
        {TOKEN_STATUSES.map((s) => (
          <Badge key={s.key} className={s.className}>{s.label}</Badge>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden">
          <CardContent className="p-0">
            <div
              className="min-h-[260px] flex flex-col items-center justify-center text-white p-8"
              style={{ background: 'linear-gradient(135deg, #ff6d00 0%, #d4541a 100%)' }}
            >
              <div className="text-sm uppercase tracking-[0.2em] opacity-90">Now Serving</div>
              <div className="text-7xl font-bold mt-3" data-testid="now-serving">
                {current?.tokenNo || '—'}
              </div>
              {current && (
                <div className="mt-4 text-center space-y-1">
                  <div className="text-lg">{current.customerName}</div>
                  <div className="opacity-90">{current.service}</div>
                  <div className="opacity-80 text-sm">{current.customerPhone}</div>
                </div>
              )}
              {!current && (
                <div className="mt-4 opacity-90">No token called yet</div>
              )}
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              <Button
                disabled={!nextWaiting || loading}
                onClick={() => callToken(nextWaiting)}
                className="text-white"
                style={{ backgroundColor: '#ff6d00' }}
                data-testid="call-next"
              >
                <Bell className="h-4 w-4 mr-2" />
                Call Next {nextWaiting ? `(${nextWaiting.tokenNo})` : ''}
              </Button>
              {current && (
                <>
                  <Button variant="outline" disabled={loading} onClick={() => progressToken(current)} data-testid="token-in-progress">
                    <Loader2 className="h-4 w-4 mr-2" />
                    In Progress
                  </Button>
                  <Button variant="outline" disabled={loading} onClick={() => completeToken(current)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                  <Button variant="outline" disabled={loading} onClick={() => skipToken(current)}>
                    <SkipForward className="h-4 w-4 mr-2" />
                    Skip
                  </Button>
                  <Button variant="outline" disabled={loading} className="text-red-600" onClick={() => cancelToken(current)} data-testid="token-cancel">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    disabled={loading}
                    onClick={() => createOrder(current)}
                    className="text-white"
                    style={{ backgroundColor: '#2E2E2E' }}
                    data-testid="create-order-from-token"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Create Order
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Waiting ({waiting.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[360px] overflow-auto">
            {!waiting.length && <p className="text-sm text-gray-500">Queue empty</p>}
            {waiting.map((t) => (
              <div key={t.tokenNo} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-semibold">{t.tokenNo}</div>
                  <div className="text-sm text-gray-600">{t.customerName}</div>
                  <div className="text-xs text-gray-500">{t.service}</div>
                </div>
                <Button size="sm" variant="outline" disabled={loading} onClick={() => callToken(t)}>
                  Call
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today — {counterName === '__all__' || !counterName ? 'All counters' : counterName}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tokens.map((t) => (
              <div key={`${t.tokenNo}-${t.status}`} className="flex items-center justify-between border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="font-bold w-20">{t.tokenNo}</div>
                  <div>
                    <div className="text-sm font-medium">{t.customerName}</div>
                    <div className="text-xs text-gray-500">{t.service} · {t.time}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColor(t.status)}>{statusLabel(t.status)}</Badge>
                  {['called', 'waiting', 'in progress'].includes(String(t.status).toLowerCase()) && (
                    <>
                      <Button size="sm" variant="outline" disabled={loading} onClick={() => progressToken(t)}>
                        In Progress
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600" disabled={loading} onClick={() => cancelToken(t)}>
                        Cancel
                      </Button>
                    </>
                  )}
                  {String(t.status).toLowerCase() === 'called' && (
                    <Button size="sm" onClick={() => createOrder(t)}>
                      Create Order
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {!tokens.length && <p className="text-sm text-gray-500">No tokens for this counter today.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CounterScreen;
