import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ordersAPI, posRegisterAPI, settingsAPI } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { useBrand } from '@/context/BrandContext';
import { mergePosSettings } from '@/utils/moduleSettings';
import { printPosSlip, saleFromPosOrder } from '@/utils/posSlip';
import { isPosOrder, orderAmount, parsePosCashier, parsePosMethod, posItemSummary } from '@/utils/posSale';
import { ArrowLeft, Printer, Store, DollarSign, ShoppingBag, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const POSStatement = () => {
  const navigate = useNavigate();
  const { primary, company } = useBrand();
  const accent = primary || '#ff6d00';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [zReports, setZReports] = useState([]);
  const [posCfg, setPosCfg] = useState(mergePosSettings({}));
  const [reprintingId, setReprintingId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getAll();
      setOrders((res.data || []).filter(isPosOrder));
      try {
        const reg = await posRegisterAPI.get();
        setZReports(Array.isArray(reg.data?.history) ? reg.data.history : []);
      } catch {
        setZReports([]);
      }
      try {
        const settings = await settingsAPI.get();
        setPosCfg(mergePosSettings(settings.data || {}));
      } catch {
        setPosCfg(mergePosSettings({}));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load POS statement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const d = String(o.date || o.createdAt || '').slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    }).sort((a, b) => {
      const ta = String(b.createdAt || b.date || '');
      const tb = String(a.createdAt || a.date || '');
      return ta.localeCompare(tb);
    });
  }, [orders, from, to]);

  const totals = useMemo(() => {
    const sales = filtered.reduce((s, o) => s + orderAmount(o), 0);
    const paid = filtered.reduce((s, o) => s + Number(o.advancePayment || o.paidAmount || orderAmount(o)), 0);
    return { count: filtered.length, sales, paid };
  }, [filtered]);

  const exportCsv = () => {
    const rows = [
      ['POS #', 'Date', 'Cashier', 'Customer', 'Items', 'Method', 'Total', 'Status'].join(','),
      ...filtered.map((o) => [
        o.orderId || o.id,
        o.date,
        `"${String(parsePosCashier(o) || '').replace(/"/g, '""')}"`,
        `"${String(o.customerName || 'Walk-in').replace(/"/g, '""')}"`,
        `"${String(posItemSummary(o, 8)).replace(/"/g, '""')}"`,
        parsePosMethod(o),
        orderAmount(o),
        o.status || '',
      ].join(',')),
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pos-statement-${from || 'all'}-${to || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printStatement = () => {
    const rows = filtered.map((o) => `
      <tr>
        <td>${o.orderId || o.id || ''}</td>
        <td>${formatDate(o.date)}</td>
        <td>${parsePosCashier(o) || '—'}</td>
        <td>${o.customerName || 'Walk-in'}</td>
        <td>${posItemSummary(o)}</td>
        <td>${parsePosMethod(o)}</td>
        <td style="text-align:right">${formatCurrency(orderAmount(o))}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><title>POS Statement</title>
      <style>
        body{font-family:Arial,sans-serif;padding:24px;color:#111}
        h1{margin:0 0 4px;font-size:20px}
        .meta{color:#666;font-size:12px;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{border-bottom:1px solid #ddd;padding:8px 6px;text-align:left}
        th{background:#f5f5f5}
        .totals{margin-top:16px;font-weight:700}
        @media print{button{display:none}}
      </style></head><body>
      <h1>${company?.name || 'AMZ Prints'} — POS Statement</h1>
      <div class="meta">Period: ${from || 'All'} → ${to || 'All'} · Printed ${new Date().toLocaleString()}</div>
      <table>
        <thead><tr><th>POS #</th><th>Date</th><th>Cashier</th><th>Customer</th><th>Items</th><th>Method</th><th>Total</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="7">No POS sales</td></tr>'}</tbody>
      </table>
      <div class="totals">Transactions: ${filtered.length} · Total: ${formatCurrency(totals.sales)}</div>
      <script>window.onload=function(){window.print()}</script>
      </body></html>`;
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) {
      toast.error('Allow popups to print');
      return;
    }
    w.document.write(html);
    w.document.close();
  };

  const reprintSlip = async (order) => {
    const key = order.id || order.orderId;
    setReprintingId(key);
    try {
      const res = await printPosSlip(saleFromPosOrder(order), { company, posCfg });
      if (!res.ok) toast.error('Allow popups to reprint the POS slip');
      else toast.message('POS slip opened — print or save');
    } catch (err) {
      console.error(err);
      toast.error('Could not reprint POS slip');
    } finally {
      setReprintingId('');
    }
  };

  return (
    <div className="space-y-5" data-testid="pos-statement-page">
      <div
        className="relative overflow-hidden rounded-3xl text-white p-6 sm:p-8"
        style={{
          background: 'radial-gradient(700px 220px at 90% 0%, rgba(244,197,106,0.35), transparent 55%), linear-gradient(135deg,#1a1024 0%,#2a1840 55%,#141022 100%)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-start gap-3">
            <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/25" onClick={() => navigate('/accounts')}>
              <ArrowLeft className="h-4 w-4 mr-1" />Accounts
            </Button>
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-amber-200/80">Counter register</p>
              <h1 className="text-3xl font-black">POS Statement</h1>
              <p className="text-white/70 mt-1">Har POS sale — cashier name, customer, items, amount</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportCsv}><FileSpreadsheet className="h-4 w-4 mr-1" />CSV</Button>
            <Button className="text-[#1a0f08] font-bold" style={{ background: 'linear-gradient(135deg,#f4c56a,#ff6d00)' }} onClick={printStatement}>
              <Printer className="h-4 w-4 mr-1" />Print
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <p className="text-xs text-gray-500 mb-1">From</p>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">To</p>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
        <Button variant="outline" onClick={() => { setFrom(''); setTo(''); }}>Clear dates</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg,#f4c56a,#ff6d00)' }}>
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Transactions</p>
              <p className="text-lg font-black">{totals.count}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500 text-white">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Total sales</p>
              <p className="text-lg font-black text-emerald-700">{formatCurrency(totals.sales)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500 text-white">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Collected</p>
              <p className="text-lg font-black">{formatCurrency(totals.paid)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {zReports.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0 overflow-x-auto">
            <div className="px-4 pt-4 pb-2 font-semibold text-sm">Closed registers (Z-reports)</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <th className="p-3">Closed</th>
                  <th className="p-3">Cashier</th>
                  <th className="p-3 text-right">Float</th>
                  <th className="p-3 text-right">Expected</th>
                  <th className="p-3 text-right">Counted</th>
                  <th className="p-3 text-right">Variance</th>
                </tr>
              </thead>
              <tbody>
                {zReports.map((z) => (
                  <tr key={z.id} className="border-b last:border-0">
                    <td className="p-3">{z.closedAt ? new Date(z.closedAt).toLocaleString() : '—'}</td>
                    <td className="p-3 font-semibold">{z.closedBy || z.openedBy || '—'}</td>
                    <td className="p-3 text-right">{formatCurrency(z.openingFloat)}</td>
                    <td className="p-3 text-right">{formatCurrency(z.expectedCash)}</td>
                    <td className="p-3 text-right">{formatCurrency(z.countedCash)}</td>
                    <td className={`p-3 text-right font-bold ${Number(z.variance) === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{formatCurrency(z.variance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading POS statement…</div>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-[#1a1024] text-left text-[11px] uppercase tracking-wider text-amber-100/80">
                  <th className="p-3">POS #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Cashier</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Pay</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-right">Slip</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-gray-400">No POS transactions in this period</td></tr>
                ) : filtered.map((o) => (
                  <tr key={o.id || o.orderId} className="border-b last:border-0 hover:bg-amber-50/50">
                    <td className="p-3 font-bold text-slate-800">{o.orderId || o.id}</td>
                    <td className="p-3 whitespace-nowrap">
                      <div>{formatDate(o.date)}</div>
                      {o.createdAt ? (
                        <div className="text-[11px] text-slate-400">{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      ) : null}
                    </td>
                    <td className="p-3 font-semibold text-[#2a1840]">{parsePosCashier(o) || '—'}</td>
                    <td className="p-3">
                      <div className="font-medium">{o.customerName || 'Walk-in'}</div>
                      <div className="text-[11px] text-slate-400">{o.customerPhone || ''}</div>
                    </td>
                    <td className="p-3 text-slate-600 max-w-[220px] truncate" title={posItemSummary(o, 12)}>{posItemSummary(o)}</td>
                    <td className="p-3"><Badge variant="outline">{parsePosMethod(o)}</Badge></td>
                    <td className="p-3 text-right font-black" style={{ color: accent }}>{formatCurrency(orderAmount(o))}</td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        disabled={reprintingId === (o.id || o.orderId)}
                        onClick={() => reprintSlip(o)}
                        data-testid={`pos-reprint-${o.id || o.orderId}`}
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Reprint
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default POSStatement;
