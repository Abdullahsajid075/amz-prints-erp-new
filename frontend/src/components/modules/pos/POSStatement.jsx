import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ordersAPI } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { useBrand } from '@/context/BrandContext';
import { ArrowLeft, Printer, Store, DollarSign, ShoppingBag, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

function isPosOrder(o) {
  const dt = String(o.docType || o.doctype || '').toLowerCase();
  if (dt === 'pos') return true;
  return /pos\s*sale/i.test(String(o.remarks || o.notes || ''));
}

function orderAmount(o) {
  const direct = Number(o.totalAmount || o.total || 0);
  if (direct > 0) return direct;
  return (o.products || []).reduce((s, p) => s + (Number(p.quantity) || 0) * (Number(p.rate) || 0), 0);
}

const POSStatement = () => {
  const navigate = useNavigate();
  const { primary, company } = useBrand();
  const accent = primary || '#F26522';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getAll();
      setOrders((res.data || []).filter(isPosOrder));
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
      const d = String(o.date || '').slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    }).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  }, [orders, from, to]);

  const totals = useMemo(() => {
    const sales = filtered.reduce((s, o) => s + orderAmount(o), 0);
    const paid = filtered.reduce((s, o) => s + Number(o.advancePayment || o.paidAmount || orderAmount(o)), 0);
    return { count: filtered.length, sales, paid };
  }, [filtered]);

  const exportCsv = () => {
    const rows = [
      ['POS #', 'Date', 'Customer', 'Phone', 'Method', 'Total', 'Paid', 'Status'].join(','),
      ...filtered.map((o) => [
        o.orderId || o.id,
        o.date,
        `"${String(o.customerName || '').replace(/"/g, '""')}"`,
        o.customerPhone || '',
        o.paymentMethod || (String(o.remarks || '').split('·')[1] || '').trim(),
        orderAmount(o),
        o.advancePayment ?? orderAmount(o),
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
        <td>${o.customerName || 'Walk-in'}</td>
        <td>${o.customerPhone || '—'}</td>
        <td>${o.paymentMethod || '—'}</td>
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
        <thead><tr><th>POS #</th><th>Date</th><th>Customer</th><th>Phone</th><th>Method</th><th>Total</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="6">No POS sales</td></tr>'}</tbody>
      </table>
      <div class="totals">Sales: ${filtered.length} · Total: ${formatCurrency(totals.sales)}</div>
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

  return (
    <div className="space-y-5" data-testid="pos-statement-page">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/pos')}>
            <ArrowLeft className="h-4 w-4 mr-1" />POS
          </Button>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: '#1F2937' }}>POS Statement</h1>
            <p className="text-gray-600 mt-1">Separate sales register for counter / POS orders only</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCsv}><FileSpreadsheet className="h-4 w-4 mr-1" />CSV</Button>
          <Button className="text-white" style={{ backgroundColor: accent }} onClick={printStatement}>
            <Printer className="h-4 w-4 mr-1" />Print
          </Button>
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
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: accent }}>
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">POS sales</p>
              <p className="text-lg font-bold">{totals.count}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500 text-white">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Total sales</p>
              <p className="text-lg font-bold text-emerald-700">{formatCurrency(totals.sales)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500 text-white">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Collected</p>
              <p className="text-lg font-bold">{formatCurrency(totals.paid)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading POS statement…</div>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="p-3">POS #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-400">No POS orders in this period</td></tr>
                ) : filtered.map((o) => (
                  <tr key={o.id || o.orderId} className="border-b last:border-0 hover:bg-orange-50/40">
                    <td className="p-3 font-semibold">{o.orderId || o.id}</td>
                    <td className="p-3">{formatDate(o.date)}</td>
                    <td className="p-3">{o.customerName || 'Walk-in'}</td>
                    <td className="p-3 text-gray-600">{o.customerPhone || '—'}</td>
                    <td className="p-3"><Badge variant="outline">{o.status || 'Delivered'}</Badge></td>
                    <td className="p-3 text-right font-bold" style={{ color: accent }}>{formatCurrency(orderAmount(o))}</td>
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
