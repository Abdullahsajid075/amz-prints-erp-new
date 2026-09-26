import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { portalAPI } from '@/services/api';
import { useBrand } from '@/context/BrandContext';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { customerPortalUrl, downloadDataUrl, canvasPngDataUrl, printCustomerCard } from '@/utils/customerDocuments';
import { IdCard, QrCode, LogOut, Download, BookOpen, Shield, Package } from 'lucide-react';
import { INVOICE_REQUIRED_MESSAGE } from '@/utils/deliveryRules';
import { toast } from 'sonner';

const TOKEN_KEY = 'amz_customer_portal_token';

export default function CustomerPortal() {
  const { company, primary } = useBrand();
  const accent = primary || '#ff6d00';
  const [params] = useSearchParams();
  const qrCustomerId = params.get('c') || params.get('cid') || '';
  const qrRef = useRef(null);

  const [mode, setMode] = useState('login');
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });

  const loadMe = useCallback(async (tok) => {
    if (!tok) return;
    setLoading(true);
    try {
      const res = await portalAPI.me(tok, qrCustomerId);
      setData(res.data);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        setToken('');
        setData(null);
      } else {
        toast.error(err.response?.data?.message || 'Could not load portal');
      }
    } finally {
      setLoading(false);
    }
  }, [qrCustomerId]);

  useEffect(() => {
    if (token) loadMe(token);
  }, [token, loadMe]);

  const onAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = mode === 'register'
        ? await portalAPI.register(form)
        : await portalAPI.login({ email: form.email, phone: form.phone, password: form.password });
      const tok = res.data?.token;
      if (!tok) throw new Error('No token');
      localStorage.setItem(TOKEN_KEY, tok);
      setToken(tok);
      toast.success('Welcome to your customer portal');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setData(null);
  };

  const customer = data?.customer;
  const portalLink = customer ? customerPortalUrl(customer.id) : customerPortalUrl(qrCustomerId);

  const downloadCard = async () => {
    const canvas = qrRef.current?.querySelector('canvas');
    const qrUrl = canvasPngDataUrl(canvas);
    await printCustomerCard({
      customer,
      company,
      qrUrl,
      outstanding: formatCurrency(customer?.outstanding),
      creditBalance: formatCurrency(customer?.creditBalance),
    });
  };

  const downloadQr = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    const png = canvasPngDataUrl(canvas);
    if (!png) {
      toast.error('QR not ready');
      return;
    }
    downloadDataUrl(png, `${customer?.customerCode || customer?.id || 'customer'}-qr.png`);
    toast.success('QR code downloaded');
  };

  const payments = useMemo(() => data?.payments || [], [data]);
  const statement = data?.ledger?.statement || [];

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-100 py-10 px-4" data-testid="customer-portal">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-6">
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold" style={{ color: accent }}>Customer portal</p>
            <h1 className="text-2xl font-bold mt-1" style={{ color: '#0747a3' }}>{company?.name || 'AMZ Prints'}</h1>
            <p className="text-sm text-slate-500 mt-1">Login required to view ledger, card, and QR profile.</p>
            {qrCustomerId && (
              <p className="text-xs text-amber-700 mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                QR scanned. Sign in with the matching customer account to continue.
              </p>
            )}
          </div>
          <Card>
            <CardHeader>
              <div className="flex gap-2">
                <Button type="button" variant={mode === 'login' ? 'default' : 'outline'} size="sm" onClick={() => setMode('login')}>Login</Button>
                <Button type="button" variant={mode === 'register' ? 'default' : 'outline'} size="sm" onClick={() => setMode('register')}>Register</Button>
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={onAuth}>
                {mode === 'register' && (
                  <div><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                )}
                <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>Password</Label><Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
                <Button type="submit" className="w-full text-white" style={{ backgroundColor: accent }} disabled={loading}>
                  {loading ? 'Please wait…' : (mode === 'register' ? 'Create account' : 'Sign in')}
                </Button>
              </form>
              <p className="text-center text-xs text-slate-500 mt-4">
                Staff? <Link className="underline" to="/login">ERP login</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4" data-testid="customer-portal-home">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] font-bold" style={{ color: accent }}>Verified account</p>
            <h1 className="text-2xl font-bold" style={{ color: '#0747a3' }}>{customer?.name || 'Customer'}</h1>
            <p className="text-sm text-slate-500">ID {customer?.customerCode || customer?.id}</p>
          </div>
          <Button variant="outline" onClick={logout}><LogOut className="h-4 w-4 mr-1" />Logout</Button>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading…</p>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Outstanding</p><p className="text-xl font-bold text-rose-600">{formatCurrency(customer?.outstanding)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Advance</p><p className="text-xl font-bold text-emerald-700">{formatCurrency(customer?.creditBalance)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Orders</p><p className="text-xl font-bold">{(data?.orders || []).length}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><IdCard className="h-4 w-4" />Customer card &amp; QR</CardTitle></CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-6 items-start">
            <div ref={qrRef} className="bg-white p-3 border rounded-xl">
              <QRCodeCanvas value={portalLink} size={148} level="M" includeMargin fgColor="#0747a3" bgColor="#ffffff" />
            </div>
            <div className="space-y-2 text-sm">
              <p>QR opens this portal. A matching login is required — private balances are never public.</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" className="text-white" style={{ backgroundColor: accent }} onClick={downloadCard}>
                  <Download className="h-4 w-4 mr-1" />Download Customer Card
                </Button>
                <Button type="button" variant="outline" onClick={downloadQr}>
                  <QrCode className="h-4 w-4 mr-1" />Download QR Code
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" />Ledger</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase text-slate-500 border-b">
                  <th className="py-2">Date</th><th>Particular</th><th className="text-right">Debit</th><th className="text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {statement.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-slate-400">No ledger lines yet.</td></tr>
                )}
                {statement.map((row, i) => (
                  <tr key={`${row.date}-${i}`} className="border-b border-slate-100">
                    <td className="py-2">{formatDate(row.date)}</td>
                    <td>{row.particular}</td>
                    <td className="text-right">{row.debit ? formatCurrency(row.debit) : ''}</td>
                    <td className="text-right text-emerald-700">{row.credit ? formatCurrency(row.credit) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" />Orders</CardTitle></CardHeader>
          <CardContent>
            {(data?.orders || []).length === 0 ? (
              <p className="text-sm text-slate-500">No orders yet.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {(data.orders || []).map((o) => (
                  <li key={o.id || o.orderId} className="border-b border-slate-100 pb-3" data-testid="portal-order-row">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-semibold">{o.orderId || o.id}</p>
                        <p className="text-xs text-slate-500">{formatDate(o.date)} · {o.status || '—'}</p>
                      </div>
                      <Badge className="shrink-0">{o.status || 'Open'}</Badge>
                    </div>
                    {o.invoiceRequired && (
                      <p className="text-xs text-amber-800 mt-1">{INVOICE_REQUIRED_MESSAGE}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Payment history</CardTitle></CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-sm text-slate-500">No payments recorded.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="flex justify-between gap-3 border-b border-slate-100 pb-2">
                    <div>
                      <p className="font-semibold">{p.category || p.type} · {p.method || '—'}</p>
                      <p className="text-xs text-slate-500">{formatDate(p.date)} · {p.notes || p.refId || ''}</p>
                    </div>
                    <p className="font-bold">{formatCurrency(p.amount)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-slate-400 flex items-center gap-1"><Shield className="h-3 w-3" />Authenticated session · 7 day token</p>
      </div>
    </div>
  );
}
