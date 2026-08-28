import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { tokensAPI, customersAPI, debugAPI } from '@/services/api';
import { notifyTokenEvent } from '@/services/notifications';
import { documentFileName } from '@/utils/printHelpers';
import { toast } from 'sonner';
import {
  Ticket, Printer, Monitor, Search, Plus, XCircle,
  Loader2, RefreshCw,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/shared/WhatsAppIcon';

const DEFAULT_SERVICES = [
  { name: 'Designing', counter: 'Table 01' },
  { name: 'Printing Services', counter: 'Table 01' },
  { name: 'NADRA Services', counter: 'Table 02' },
  { name: 'Photo Copy & Documents', counter: 'Table 03' },
  { name: 'PALS Fee & Information', counter: 'Executive Office' },
  { name: 'Payments', counter: 'Executive Office' },
  { name: 'Discussion', counter: 'Executive Office' },
  { name: 'Other Printing Services', counter: 'Executive Office' },
];

const statusClass = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'waiting') return 'bg-amber-100 text-amber-800';
  if (s === 'called' || s === 'in progress') return 'bg-blue-100 text-blue-800';
  if (s === 'completed' || s === 'ordered') return 'bg-green-100 text-green-800';
  if (s === 'cancelled' || s === 'skipped') return 'bg-red-100 text-red-800';
  return 'bg-slate-100 text-slate-700';
};

function buildWhatsAppUrl(phone, text) {
  const digits = String(phone || '').replace(/\D/g, '');
  let normalized = digits;
  if (digits.length === 10) normalized = `92${digits}`;
  if (digits.startsWith('0') && digits.length === 11) normalized = `92${digits.slice(1)}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

function printToken(token) {
  const printTitle = documentFileName({
    docType: 'Token',
    customerName: token.customerName,
    orderNumber: token.tokenNo,
  });
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${printTitle}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    body { font-family: Arial, sans-serif; width: 72mm; margin: 0; color: #000; }
    h1 { font-size: 22px; margin: 0 0 8px; text-align: center; }
    .token { font-size: 36px; font-weight: bold; text-align: center; margin: 12px 0; }
    .row { font-size: 13px; margin: 4px 0; }
    .label { color: #555; }
    hr { border: none; border-top: 1px dashed #333; margin: 10px 0; }
    .footer { text-align: center; font-size: 11px; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>AMZ Prints</h1>
  <div class="footer">Token Booking</div>
  <hr />
  <div class="token">${token.tokenNo}</div>
  <div class="row"><span class="label">Counter:</span> ${token.counterName || ''}</div>
  <div class="row"><span class="label">Customer:</span> ${token.customerName || ''}</div>
  <div class="row"><span class="label">Phone:</span> ${token.customerPhone || ''}</div>
  <div class="row"><span class="label">Service:</span> ${token.service || ''}</div>
  ${token.serviceNote ? `<div class="row"><span class="label">Note:</span> ${token.serviceNote}</div>` : ''}
  <div class="row"><span class="label">Date:</span> ${token.date || ''} ${token.time || ''}</div>
  <hr />
  <div class="footer">Please wait for your token to be called</div>
  <script>window.onload = function(){ window.print(); setTimeout(function(){ window.close(); }, 400); };</script>
</body>
</html>`;
  const win = window.open('', '_blank', 'width=320,height=480');
  if (!win) {
    toast.error('Allow popups to print token');
    return;
  }
  win.document.write(html);
  win.document.close();
}

const emptyForm = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  counterName: '',
  service: '',
  serviceNote: '',
  notes: '',
};

const TokenBooking = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [counters, setCounters] = useState([]);
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [loading, setLoading] = useState(false);
  const [lastToken, setLastToken] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [dbStatus, setDbStatus] = useState('');
  const [tokens, setTokens] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listFilter, setListFilter] = useState('today'); // today | all

  const loadMeta = useCallback(async () => {
    try {
      const res = await tokensAPI.getMeta();
      const counterList = Array.isArray(res.data?.counters) ? res.data.counters : [];
      const serviceList = Array.isArray(res.data?.services) && res.data.services.length
        ? res.data.services
        : DEFAULT_SERVICES;
      setCounters(counterList);
      setServices(serviceList);
      if (!counterList.length) {
        setDbStatus('No counters yet — first booking will auto-create Table 01–03 / Executive Office. Or click Sync Sheets.');
      } else {
        setDbStatus(`Connected · ${counterList.length} counter(s) · auto-assign by service`);
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || error.message || 'Failed to load counters/services';
      setDbStatus(msg);
      setServices(DEFAULT_SERVICES);
      toast.error(msg);
    }
  }, []);

  const loadTokens = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await tokensAPI.getAll({
        date: listFilter === 'all' ? 'all' : 'today',
        counter: 'all',
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setTokens(list);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to load token list');
      setTokens([]);
    } finally {
      setListLoading(false);
    }
  }, [listFilter]);

  const syncSheets = async () => {
    try {
      const res = await debugAPI.prepare();
      const admin = res.data?.report?.admin || res.data?.admin;
      toast.success(
        admin?.username
          ? `Sheets synced. Login: ${admin.username} / ${admin.password}`
          : 'Sheets synced — counters & columns ready'
      );
      console.log('prepareDatabase', res.data);
      await loadMeta();
      await loadTokens();
    } catch (error) {
      const msg = error.response?.data?.message || 'Sync failed — redeploy latest Code.gs first';
      toast.error(msg);
      setDbStatus(msg);
    }
  };

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    loadTokens();
    const timer = setInterval(loadTokens, 15000);
    return () => clearInterval(timer);
  }, [loadTokens]);

  const assignedCounter = useMemo(() => {
    if (!form.service) return '';
    const match = services.find((s) => s.name === form.service);
    return match?.counter || form.counterName || '';
  }, [form.service, form.counterName, services]);

  const onServiceChange = (value) => {
    const match = services.find((s) => s.name === value);
    setForm((prev) => ({
      ...prev,
      service: value,
      counterName: match?.counter || '',
    }));
  };

  const lookupCustomer = async () => {
    if (!form.customerPhone.trim()) return;
    setLookingUp(true);
    try {
      const res = await customersAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : [];
      const digits = form.customerPhone.replace(/\D/g, '');
      const match = list.find((c) => {
        const p = String(c.phone || '').replace(/\D/g, '');
        return p && (p === digits || p.slice(-10) === digits.slice(-10));
      });
      if (match) {
        setForm((prev) => ({
          ...prev,
          customerName: match.name || prev.customerName,
          customerPhone: match.phone || prev.customerPhone,
          customerEmail: match.email || prev.customerEmail,
        }));
        toast.success('Existing customer found');
      } else {
        toast.message('New customer — will be created on booking');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLookingUp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      toast.error('Customer name and phone are required');
      return;
    }
    const emailTrim = String(form.customerEmail || '').trim();
    if (emailTrim && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      toast.error('Enter a valid email address');
      return;
    }
    if (!form.service) {
      toast.error('Select a service first');
      return;
    }
    const counterName = assignedCounter
      || services.find((s) => s.name === form.service)?.counter
      || '';
    if (!counterName) {
      toast.error('No counter mapped for this service');
      return;
    }

    setLoading(true);
    try {
      const res = await tokensAPI.create({
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: emailTrim,
        email: emailTrim,
        counterName,
        service: form.service,
        serviceNote: form.serviceNote,
        notes: form.notes,
      });
      const token = res.data;
      const tokenNo = token?.tokenNo || token?.tokenno;
      if (!tokenNo) {
        throw {
          response: {
            data: {
              message: 'Book response missing token number. Redeploy latest Code.gs, then Sync Sheets.',
            },
          },
        };
      }
      const normalized = {
        ...token,
        tokenNo,
        customerEmail: token.customerEmail || form.customerEmail.trim(),
      };
      setLastToken(normalized);
      toast.success(`Token ${tokenNo} → ${token.counterName || counterName}`);
      const gasEmail = token?._notifications?.email;
      if (gasEmail?.ok) toast.success(`Token email sent to ${normalized.customerEmail}`);
      else if (gasEmail?.ok === false && gasEmail.reason !== 'missing_email') {
        // Fallback: frontend email path
        const notify = await notifyTokenEvent(normalized, { event: 'token_booked', openWhatsApp: false });
        if (notify?.emailSent) toast.success(`Token email sent to ${normalized.customerEmail}`);
        else if (notify?.emailError || gasEmail?.error) {
          toast.error(notify?.emailError || gasEmail.error || 'Token email failed');
        }
      }
      setForm((prev) => ({
        ...emptyForm,
        service: prev.service,
        counterName: prev.counterName,
      }));
      // Show new token immediately even before list refresh
      setTokens((prev) => {
        const without = prev.filter((t) => t.tokenNo !== tokenNo);
        return [normalized, ...without];
      });
      await loadTokens();
      await loadMeta();
      // If Today filter hid the row (legacy date issue), flip to All once
      if (listFilter === 'today') {
        try {
          const check = await tokensAPI.getAll({ date: 'today', counter: 'all' });
          const list = Array.isArray(check.data) ? check.data : [];
          const found = list.some((t) => t.tokenNo === tokenNo);
          if (!found) {
            setListFilter('all');
            toast.message('Token booked — switched list to All (date sync)');
          }
        } catch {
          /* ignore */
        }
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || error.message || 'Failed to book token';
      toast.error(msg);
      setDbStatus(msg);
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsApp = (token) => {
    const text = [
      `*AMZ Prints — Token Booking*`,
      `Token: *${token.tokenNo}*`,
      `Counter: ${token.counterName}`,
      `Customer: ${token.customerName}`,
      `Service: ${token.service}`,
      token.serviceNote ? `Note: ${token.serviceNote}` : null,
      `Date: ${token.date} ${token.time}`,
      ``,
      `Please wait for your token to be called.`,
    ].filter(Boolean).join('\n');
    window.open(buildWhatsAppUrl(token.customerPhone, text), '_blank');
  };

  const markProgress = async (token) => {
    try {
      const res = await tokensAPI.progress(token.tokenNo || token.id);
      setLastToken(res.data || { ...token, status: 'In Progress' });
      toast.success(`${token.tokenNo} → In Progress`);
      loadTokens();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark in progress');
    }
  };

  const cancelToken = async (token) => {
    if (!window.confirm(`Cancel token ${token.tokenNo}?`)) return;
    try {
      const res = await tokensAPI.cancel(token.tokenNo || token.id);
      if (lastToken && (lastToken.tokenNo === token.tokenNo || lastToken.id === token.id)) {
        setLastToken(res.data || { ...token, status: 'Cancelled' });
      }
      toast.message(`${token.tokenNo} cancelled`);
      loadTokens();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel');
    }
  };

  return (
    <div className="space-y-6" data-testid="token-booking">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>Token Booking</h1>
          <p className="text-sm text-gray-500 mt-1">Select service → counter auto-assigned · list · print · WhatsApp</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={syncSheets} data-testid="sync-sheets">
            Sync Sheets
          </Button>
          <Button variant="outline" onClick={loadTokens} disabled={listLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${listLoading ? 'animate-spin' : ''}`} />
            Refresh List
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/tokens/counter')}
            data-testid="open-counter-screen"
          >
            <Monitor className="h-4 w-4 mr-2" />
            Counter Screen
          </Button>
        </div>
      </div>

      {dbStatus && (
        <div className="text-sm rounded-lg border px-3 py-2 bg-gray-50 text-gray-700" data-testid="db-status">
          {dbStatus}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" style={{ color: '#F26522' }} />
              New Token
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Phone *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={form.customerPhone}
                      onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                      placeholder="03XXXXXXXXX"
                      data-testid="token-phone"
                    />
                    <Button type="button" variant="outline" onClick={lookupCustomer} disabled={lookingUp}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Customer Name *</Label>
                  <Input
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="Customer name"
                    data-testid="token-customer-name"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Customer Email (optional)</Label>
                  <Input
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                    placeholder="customer@email.com"
                    data-testid="token-customer-email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Service *</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.service}
                    onChange={(e) => onServiceChange(e.target.value)}
                    data-testid="token-service"
                    required
                  >
                    <option value="">Select service</option>
                    {services.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name} → {s.counter}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Counter (auto)</Label>
                  <Input
                    value={assignedCounter}
                    readOnly
                    className="bg-gray-50 font-semibold"
                    data-testid="token-counter"
                    placeholder="Select a service first"
                  />
                </div>
              </div>

              <div>
                <Label>Service Note</Label>
                <Textarea
                  value={form.serviceNote}
                  onChange={(e) => setForm({ ...form, serviceNote: e.target.value })}
                  rows={2}
                  placeholder="Details for the counter"
                  data-testid="token-service-note"
                />
              </div>

              <div>
                <Label>Internal Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Optional internal notes"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="text-white"
                style={{ backgroundColor: '#F26522' }}
                data-testid="token-book-submit"
              >
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Booking…' : 'Book Token'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Last Token</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!lastToken ? (
              <p className="text-sm text-gray-500">Book a token to see print / WhatsApp actions.</p>
            ) : (
              <>
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#FFF4EE' }}>
                  <div className="text-xs uppercase tracking-wide text-gray-500">Token</div>
                  <div className="text-4xl font-bold mt-1" style={{ color: '#F26522' }}>{lastToken.tokenNo}</div>
                  <div className="text-sm mt-2 text-gray-700">{lastToken.counterName}</div>
                  <div className="text-sm text-gray-600">{lastToken.customerName}</div>
                  <div className="text-sm text-gray-600">{lastToken.service}</div>
                  {lastToken.serviceNote && (
                    <div className="text-xs text-gray-500 mt-1">{lastToken.serviceNote}</div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Button variant="outline" onClick={() => printToken(lastToken)} data-testid="token-print">
                    <Printer className="h-4 w-4 mr-2" />
                    Print Token (POS)
                  </Button>
                  <Button variant="outline" className="text-green-700 border-green-200 hover:bg-green-50" onClick={() => sendWhatsApp(lastToken)} data-testid="token-whatsapp">
                    <WhatsAppIcon className="h-4 w-4 mr-2" />
                    Send WhatsApp
                  </Button>
                  <Button variant="outline" onClick={() => markProgress(lastToken)} data-testid="token-booking-progress">
                    <Loader2 className="h-4 w-4 mr-2" />
                    In Progress
                  </Button>
                  <Button variant="outline" className="text-red-600" onClick={() => cancelToken(lastToken)} data-testid="token-booking-cancel">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelled
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/tokens/counter?counter=${encodeURIComponent(lastToken.counterName)}`)}
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Open Counter Screen
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="token-list">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">
            Token List {listFilter === 'today' ? '(Today)' : '(All)'}
            <span className="ml-2 text-sm font-normal text-gray-500">{tokens.length}</span>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={listFilter === 'today' ? 'default' : 'outline'}
              style={listFilter === 'today' ? { backgroundColor: '#F26522' } : undefined}
              className={listFilter === 'today' ? 'text-white' : ''}
              onClick={() => setListFilter('today')}
            >
              Today
            </Button>
            <Button
              size="sm"
              variant={listFilter === 'all' ? 'default' : 'outline'}
              style={listFilter === 'all' ? { backgroundColor: '#F26522' } : undefined}
              className={listFilter === 'all' ? 'text-white' : ''}
              onClick={() => setListFilter('all')}
            >
              All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {listLoading && !tokens.length ? (
            <p className="text-sm text-gray-500 py-6 text-center">Loading tokens…</p>
          ) : !tokens.length ? (
            <p className="text-sm text-gray-500 py-6 text-center">
              No tokens found. Book one above, or click <strong>All</strong> / Sync Sheets.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-2 pr-3">Token</th>
                    <th className="py-2 pr-3">Customer</th>
                    <th className="py-2 pr-3">Service</th>
                    <th className="py-2 pr-3">Counter</th>
                    <th className="py-2 pr-3">Time</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((t) => (
                    <tr key={t.id || t.tokenNo} className="border-b border-gray-100 hover:bg-orange-50/40">
                      <td className="py-2.5 pr-3 font-bold" style={{ color: '#F26522' }}>{t.tokenNo}</td>
                      <td className="py-2.5 pr-3">
                        <div className="font-medium">{t.customerName}</div>
                        <div className="text-xs text-gray-500">{t.customerPhone}</div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <div>{t.service}</div>
                        {t.serviceNote && <div className="text-xs text-gray-500">{t.serviceNote}</div>}
                      </td>
                      <td className="py-2.5 pr-3">{t.counterName}</td>
                      <td className="py-2.5 pr-3 whitespace-nowrap text-xs text-gray-600">
                        {t.date} {t.time}
                      </td>
                      <td className="py-2.5 pr-3">
                        <Badge className={statusClass(t.status)}>{t.status || 'Waiting'}</Badge>
                      </td>
                      <td className="py-2.5">
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => printToken(t)} title="Print">
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 px-2 text-green-600" onClick={() => sendWhatsApp(t)} title="WhatsApp">
                            <WhatsAppIcon className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2"
                            onClick={() => navigate(`/tokens/counter?counter=${encodeURIComponent(t.counterName || '')}`)}
                            title="Counter"
                          >
                            <Monitor className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 px-2 text-red-600" onClick={() => cancelToken(t)} title="Cancel">
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenBooking;
