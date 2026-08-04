import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { countersAPI, tokensAPI, customersAPI, debugAPI } from '@/services/api';
import { toast } from 'sonner';
import { Ticket, Printer, MessageCircle, Monitor, Search, Plus } from 'lucide-react';

function buildWhatsAppUrl(phone, text) {
  const digits = String(phone || '').replace(/\D/g, '');
  let normalized = digits;
  if (digits.length === 10) normalized = `92${digits}`;
  if (digits.startsWith('0') && digits.length === 11) normalized = `92${digits.slice(1)}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

function printToken(token) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Token ${token.tokenNo}</title>
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
  counterName: '',
  service: '',
  notes: '',
};

const TokenBooking = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [counters, setCounters] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastToken, setLastToken] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);

  const [dbStatus, setDbStatus] = useState('');

  const loadMeta = useCallback(async () => {
    try {
      const res = await tokensAPI.getMeta();
      const counterList = Array.isArray(res.data?.counters) ? res.data.counters : [];
      const productList = Array.isArray(res.data?.products) ? res.data.products : [];
      setCounters(counterList);
      setProducts(productList);
      if (!counterList.length) {
        setDbStatus('No counters in sheet. Click “Sync Sheets” then redeploy Code.gs if needed.');
      } else {
        setDbStatus(`Connected · ${counterList.length} counter(s) loaded from Google Sheets`);
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || error.message || 'Failed to load counters/services';
      setDbStatus(msg);
      toast.error(msg);
    }
  }, []);

  const syncSheets = async () => {
    try {
      const res = await debugAPI.prepare();
      toast.success('Sheets synced — required columns ensured');
      console.log('prepareDatabase', res.data);
      await loadMeta();
    } catch (error) {
      const msg = error.response?.data?.message || 'Sync failed — redeploy latest Code.gs first';
      toast.error(msg);
      setDbStatus(msg);
    }
  };

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

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
    if (!form.counterName) {
      toast.error('Select a counter');
      return;
    }
    if (!form.service) {
      toast.error('Select a service');
      return;
    }

    setLoading(true);
    try {
      const res = await tokensAPI.create({
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        counterName: form.counterName,
        service: form.service,
        notes: form.notes,
      });
      const token = res.data;
      setLastToken(token);
      toast.success(`Token ${token.tokenNo} booked`);
      setForm((prev) => ({ ...emptyForm, counterName: prev.counterName }));
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to book token');
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
      `Date: ${token.date} ${token.time}`,
      ``,
      `Please wait for your token to be called.`,
    ].join('\n');
    window.open(buildWhatsAppUrl(token.customerPhone, text), '_blank');
  };

  return (
    <div className="space-y-6" data-testid="token-booking">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>Token Booking</h1>
          <p className="text-sm text-gray-500 mt-1">Book walk-in tokens · auto customer · POS print · WhatsApp</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={syncSheets} data-testid="sync-sheets">
            Sync Sheets
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Counter *</Label>
                  <Select
                    value={form.counterName || undefined}
                    onValueChange={(value) => setForm({ ...form, counterName: value })}
                  >
                    <SelectTrigger data-testid="token-counter">
                      <SelectValue placeholder="Select counter" />
                    </SelectTrigger>
                    <SelectContent>
                      {counters
                        .filter((c) => String(c.status || 'Active').toLowerCase() === 'active')
                        .map((c) => (
                          <SelectItem key={c.counterName} value={c.counterName}>
                            {c.counterName}{c.accessHolder ? ` · ${c.accessHolder}` : ''}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Service *</Label>
                  {products.length > 0 ? (
                    <Select
                      value={form.service || undefined}
                      onValueChange={(value) => setForm({ ...form, service: value })}
                    >
                      <SelectTrigger data-testid="token-service">
                        <SelectValue placeholder="Select service / product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id || p.name} value={p.name}>
                            {p.name}{p.rate ? ` · Rs ${p.rate}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={form.service}
                      onChange={(e) => setForm({ ...form, service: e.target.value })}
                      placeholder="e.g. Business Cards, Banner"
                      data-testid="token-service"
                    />
                  )}
                  {products.length > 0 && (
                    <Input
                      className="mt-2"
                      value={form.service}
                      onChange={(e) => setForm({ ...form, service: e.target.value })}
                      placeholder="Or type service manually"
                    />
                  )}
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Optional notes"
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
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Button variant="outline" onClick={() => printToken(lastToken)} data-testid="token-print">
                    <Printer className="h-4 w-4 mr-2" />
                    Print Token (POS)
                  </Button>
                  <Button variant="outline" onClick={() => sendWhatsApp(lastToken)} data-testid="token-whatsapp">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Send WhatsApp
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
    </div>
  );
};

export default TokenBooking;
