import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ordersAPI, invoicesAPI, settingsAPI } from '@/services/api';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/helpers';
import { ORDER_STATUS } from '@/utils/constants';
import { sortBy } from '@/utils/sortBy';
import SortBar from '@/components/shared/SortBar';
import { openWhatsAppChat, fillTemplate, buildTemplateVars, resolveWhatsAppTemplate } from '@/services/notifications';
import { Plus, Search, Eye, Edit, Copy, Trash2, User, Phone, Mail, MapPin, Calendar, Package, FileText, X, Printer, MessageCircle, Receipt, Truck, Link2 } from 'lucide-react';
import { toast } from 'sonner';

const ORDER_SORT_OPTS = [
  { value: 'date', label: 'Date' },
  { value: 'orderId', label: 'Order ID' },
  { value: 'customerName', label: 'Customer' },
  { value: 'status', label: 'Status' },
  { value: 'totalAmount', label: 'Amount' },
];

const IN_PROGRESS_STATUSES = ['Order Received', 'Designing', 'Proof Approval', 'Printing', 'Finishing', 'Packing', 'Ready'];
const COMPLETED_STATUSES = ['Delivered', 'Cancelled'];

function orderDisplayTotal(order) {
  const direct = Number(order?.totalAmount);
  if (direct > 0) return direct;
  const fromProducts = (Array.isArray(order?.products) ? order.products : [])
    .reduce((s, p) => s + (Number(p.quantity) || 0) * (Number(p.rate) || 0), 0);
  return fromProducts || 0;
}

function trackingLinkFor(order) {
  const code = order?.trackingNumber || order?.orderId || order?.id || '';
  return `${window.location.origin}/track/${encodeURIComponent(String(code).trim())}`;
}

const OrdersList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [filters, setFilters] = useState({ search: '', status: undefined });
  const [sort, setSort] = useState({ field: 'date', dir: 'desc' });
  const [company, setCompany] = useState({});

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      const response = await ordersAPI.getAll(params);
      // POS sales have a separate statement — keep Orders list for booking jobs only
      const list = (response.data || []).filter((o) => {
        const dt = String(o.docType || o.doctype || 'Order').toLowerCase();
        if (dt === 'pos') return false;
        return !/pos\s*sale/i.test(String(o.remarks || ''));
      });
      setOrders(list);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.status]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    settingsAPI.get().then(res => setCompany(res.data?.company || {})).catch(() => {});
  }, []);

  const sortedOrders = useMemo(() => sortBy(orders, sort, {
    date: (o) => o.date || o.orderDate || '',
    orderId: (o) => o.orderId || o.id || '',
    customerName: (o) => o.customerName || '',
    status: (o) => o.status || '',
    totalAmount: (o) => orderDisplayTotal(o),
  }), [orders, sort]);

  const { inProgress, completed } = useMemo(() => {
    const ip = sortedOrders.filter(o => IN_PROGRESS_STATUSES.includes(o.status));
    const co = sortedOrders.filter(o => COMPLETED_STATUSES.includes(o.status));
    return { inProgress: ip, completed: co };
  }, [sortedOrders]);

  const handleView = async (orderId) => {
    try {
      const response = await ordersAPI.getById(orderId);
      setViewOrder(response.data);
      setViewOpen(true);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
    }
  };

  const handleDuplicate = async (orderId) => {
    try {
      await ordersAPI.duplicate(orderId);
      toast.success('Order duplicated successfully');
      fetchOrders();
    } catch { toast.error('Failed to duplicate order'); }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      await ordersAPI.delete(orderId);
      toast.success('Order deleted successfully');
      fetchOrders();
    } catch { toast.error('Failed to delete order'); }
  };

  const handleWhatsApp = async (order) => {
    try {
      const full = order.customerPhone ? order : (await ordersAPI.getById(order.id)).data;
      if (!full.customerPhone) { toast.error('Customer phone not available'); return; }
      const trackUrl = trackingLinkFor(full);
      const vars = buildTemplateVars(
        { ...full, trackingNumber: full.trackingNumber || full.orderId },
        company,
        { trackUrl, TrackUrl: trackUrl, trackingNumber: full.trackingNumber || full.orderId }
      );
      let templates = null;
      try {
        const settingsRes = await settingsAPI.get();
        templates = settingsRes.data?.notifications?.whatsappTemplates || null;
      } catch { /* use defaults */ }
      const template = resolveWhatsAppTemplate(templates, 'status', full.status);
      let msg = fillTemplate(template, vars);
      // Only append track link if template didn't already include it
      if (trackUrl && !String(msg || '').includes(trackUrl) && !/Track your order/i.test(msg)) {
        msg = `${msg}\n\nTrack your order : ${trackUrl}`;
      }
      const result = openWhatsAppChat(full.customerPhone, msg);
      if (!result.ok) toast.error('Could not open WhatsApp');
      else toast.message('WhatsApp opened — tap Send');
    } catch (err) { console.error(err); toast.error('Failed to open WhatsApp'); }
  };

  const copyTrackingLink = (order) => {
    const link = trackingLinkFor(order);
    if (!order?.trackingNumber && !order?.orderId && !order?.id) {
      toast.error('No tracking / order id');
      return;
    }
    navigator.clipboard.writeText(link).then(() => {
      toast.success('Customer tracking link copied (no login)');
    }).catch(() => toast.message(link));
  };

  const handlePrint = async (order) => {
    try {
      const res = await ordersAPI.getById(order.id);
      const full = res.data;
      const productRows = (full.products || []).map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${p.name}${p.size ? ` <small>(${p.size})</small>` : ''}${p.material ? ` <small>· ${p.material}</small>` : ''}</td>
          <td style="text-align:right">${p.quantity}</td>
          <td style="text-align:right">${formatCurrency(p.rate)}</td>
          <td style="text-align:right">${formatCurrency((p.quantity || 0) * (p.rate || 0))}</td>
        </tr>`).join('');
      const win = window.open('', '_blank', 'width=900,height=1100');
      if (!win) { toast.error('Popup blocked — please allow popups to print'); return; }
      win.document.write(`<!doctype html><html><head><title>Order ${full.orderId}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { font-family: 'Poppins', system-ui, sans-serif; color: #1F2937; margin: 0; }
          .head { display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #ff6d00; padding-bottom:12px; margin-bottom:16px; }
          .brand { font-size: 22px; font-weight: 800; color:#ff6d00; }
          .tag { font-size: 11px; color:#6B7280; }
          .meta { text-align:right; font-size:12px; }
          .meta .id { font-size:18px; font-weight:700; color:#1F2937; }
          .grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
          .box { border:1px solid #E5E7EB; border-radius:8px; padding:10px 12px; font-size:12px; }
          .box h4 { margin:0 0 6px; font-size:10px; text-transform:uppercase; letter-spacing:.08em; color:#ff6d00; }
          table { width:100%; border-collapse:collapse; margin-top:8px; font-size:12px; }
          th { background:#1F2937; color:#fff; padding:8px; text-align:left; text-transform:uppercase; font-size:10px; letter-spacing:.06em; }
          td { padding:8px; border-bottom:1px solid #E5E7EB; }
          .totals { margin-top:12px; margin-left:auto; width:280px; font-size:12px; }
          .totals div { display:flex; justify-content:space-between; padding:4px 8px; }
          .totals .grand { background:#ff6d00; color:white; border-radius:6px; padding:8px; font-weight:700; font-size:14px; }
          .footer { margin-top:24px; text-align:center; font-size:10px; color:#6B7280; border-top:1px solid #E5E7EB; padding-top:10px; }
          @media print { .no-print { display:none } }
        </style></head><body>
        <div class="head">
          <div>
            <div class="brand">${company.name || 'AMZ Prints'}</div>
            <div class="tag">${company.tagline || 'Professional Printing & Advertising'}</div>
            <div class="tag">${[company.address, company.phone, company.email].filter(Boolean).join(' · ')}</div>
          </div>
          <div class="meta">
            <div>ORDER</div>
            <div class="id">${full.orderId}</div>
            <div>Date: ${formatDate(full.date)}</div>
            <div>Delivery: ${formatDate(full.deliveryDate)}</div>
          </div>
        </div>
        <div class="grid">
          <div class="box">
            <h4>Bill To</h4>
            <strong>${full.customerName || ''}</strong><br/>
            ${full.customerAddress || ''}<br/>
            ${full.customerPhone ? '📞 ' + full.customerPhone : ''}<br/>
            ${full.customerEmail ? '✉ ' + full.customerEmail : ''}
          </div>
          <div class="box">
            <h4>Order Info</h4>
            Status: <strong>${full.status}</strong><br/>
            Designer: ${full.assignedDesigner || '—'}<br/>
            ${full.remarks ? 'Remarks: ' + full.remarks : ''}
          </div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>${productRows || '<tr><td colspan="5" style="text-align:center; color:#6B7280">No products listed</td></tr>'}</tbody>
        </table>
        <div class="totals">
          <div><span>Subtotal</span><span>${formatCurrency(full.totalAmount || 0)}</span></div>
          <div><span>Advance</span><span>${formatCurrency(full.advancePayment || 0)}</span></div>
          <div class="grand"><span>Balance Due</span><span>${formatCurrency((full.totalAmount || 0) - (full.advancePayment || 0))}</span></div>
        </div>
        <div class="footer">Thank you for your business! · ${company.name || 'AMZ Prints'} · ${company.website || ''}</div>
        <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };</script>
      </body></html>`);
      win.document.close();
    } catch (err) { console.error(err); toast.error('Failed to print order'); }
  };

  const handleGenerateInvoice = async (order) => {
    try {
      const res = await ordersAPI.getById(order.id);
      const full = res.data;
      const items = (full.products || []).map(p => ({
        name: p.name, quantity: p.quantity, rate: p.rate, size: p.size, material: p.material
      }));
      const subtotal = items.reduce((s, i) => s + (i.quantity * i.rate), 0);
      const inv = {
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        orderId: full.orderId,
        customerName: full.customerName,
        customerEmail: full.customerEmail,
        customerPhone: full.customerPhone,
        customerAddress: full.customerAddress,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        items,
        subtotal,
        tax: 0, taxRate: 0, discount: 0, previousBalance: 0,
        totalAmount: subtotal,
        paidAmount: full.advancePayment || 0,
        status: (full.advancePayment || 0) >= subtotal ? 'Paid' : (full.advancePayment || 0) > 0 ? 'Partial' : 'Unpaid',
        notes: `Auto-generated from order ${full.orderId}`
      };
      const created = await invoicesAPI.create(inv);
      toast.success(`Invoice ${inv.invoiceNumber} generated`);
      navigate(`/invoices/${created.data.id}`);
    } catch (err) { console.error(err); toast.error('Failed to generate invoice'); }
  };

  const renderCard = (order) => (
    <div key={order.id} className="group relative overflow-hidden rounded-xl bg-white border border-gray-100 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300" data-testid={`order-card-${order.id}`}>
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #ff6d00, #FF8A50)' }} />
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Order</p>
          <h3 className="text-lg font-bold truncate" style={{ color: '#1F2937' }}>{order.orderId}</h3>
        </div>
        <Badge className={`${getStatusColor(order.status)} text-[10px] shrink-0`}>{order.status}</Badge>
      </div>
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="font-semibold truncate" style={{ color: '#1F2937' }}>{order.customerName}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatDate(order.date)}</span>
          <span>Due {formatDate(order.deliveryDate)}</span>
        </div>
      </div>
      <div className="flex items-end justify-between pt-2 border-t border-gray-100 mb-2">
        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Total</span>
        <span className="text-lg font-bold" style={{ color: '#ff6d00' }}>{formatCurrency(orderDisplayTotal(order))}</span>
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" className="flex-1 text-white text-xs h-8" style={{ backgroundColor: '#ff6d00' }} onClick={() => handleView(order.id)} data-testid={`view-order-${order.id}`}>
          <Eye className="h-3 w-3 mr-1" />View
        </Button>
        {order.status === 'Ready' && (
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            title="Delivery Slip"
            onClick={() => navigate(`/orders/${order.id}/delivery-slip`)}
            data-testid={`delivery-slip-${order.id}`}
          >
            <Truck className="h-3.5 w-3.5" style={{ color: '#ff6d00' }} />
          </Button>
        )}
        <Button size="icon" variant="outline" className="h-8 w-8" title="Generate Invoice" onClick={() => handleGenerateInvoice(order)} data-testid={`invoice-order-${order.id}`}>
          <Receipt className="h-3.5 w-3.5" style={{ color: '#ff6d00' }} />
        </Button>
        <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 hover:bg-green-50" title="WhatsApp" onClick={() => handleWhatsApp(order)} data-testid={`whatsapp-order-${order.id}`}>
          <MessageCircle className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="outline" className="h-8 w-8" title="Copy tracking link" onClick={() => copyTrackingLink(order)} data-testid={`track-link-${order.id}`}>
          <Link2 className="h-3.5 w-3.5" style={{ color: '#ff6d00' }} />
        </Button>
        <Button size="icon" variant="outline" className="h-8 w-8" title="Print" onClick={() => handlePrint(order)} data-testid={`print-order-${order.id}`}>
          <Printer className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit" onClick={() => navigate(`/orders/${order.id}/edit`)} data-testid={`edit-order-${order.id}`}>
          <Edit className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6" data-testid="orders-list">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#1F2937' }}>Orders</h1>
          <p className="text-gray-600 mt-1">In-process orders as cards · completed orders in the list below</p>
        </div>
        <Button onClick={() => navigate('/orders/new')} style={{ backgroundColor: '#ff6d00' }} className="text-white" data-testid="create-order-button">
          <Plus className="h-4 w-4 mr-2" />Create Order
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by order ID or customer..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && fetchOrders()} className="pl-10" data-testid="search-input" />
            </div>
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? undefined : v })}>
              <SelectTrigger data-testid="status-filter"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.values(ORDER_STATUS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={fetchOrders} style={{ backgroundColor: '#ff6d00' }} className="text-white" data-testid="search-button">
              <Search className="h-4 w-4 mr-2" />Search
            </Button>
          </div>
          <div className="mt-3 max-w-md">
            <SortBar value={sort} onChange={setSort} options={ORDER_SORT_OPTS} />
          </div>
        </CardContent>
      </Card>

      {/* In-progress orders as cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700">In Progress ({inProgress.length})</h2>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : inProgress.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-gray-500 text-sm">No in-progress orders.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {inProgress.map(renderCard)}
          </div>
        )}
      </div>

      {/* Completed / cancelled orders as list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-sm uppercase tracking-wider text-gray-700 font-semibold">Completed & Cancelled ({completed.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {completed.length === 0 ? (
            <p className="text-center py-6 text-gray-500 text-sm">No completed orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-2 px-3 text-xs uppercase font-semibold text-gray-600">Order</th>
                    <th className="text-left py-2 px-3 text-xs uppercase font-semibold text-gray-600">Customer</th>
                    <th className="text-left py-2 px-3 text-xs uppercase font-semibold text-gray-600 hidden md:table-cell">Date</th>
                    <th className="text-left py-2 px-3 text-xs uppercase font-semibold text-gray-600 hidden md:table-cell">Delivery</th>
                    <th className="text-right py-2 px-3 text-xs uppercase font-semibold text-gray-600">Amount</th>
                    <th className="text-left py-2 px-3 text-xs uppercase font-semibold text-gray-600">Status</th>
                    <th className="text-right py-2 px-3 text-xs uppercase font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {completed.map(order => (
                    <tr key={order.id} className="border-b hover:bg-orange-50/40" data-testid={`order-row-${order.id}`}>
                      <td className="py-2.5 px-3 font-semibold" style={{ color: '#1F2937' }}>{order.orderId}</td>
                      <td className="py-2.5 px-3 truncate max-w-[180px]">{order.customerName}</td>
                      <td className="py-2.5 px-3 text-gray-600 hidden md:table-cell">{formatDate(order.date)}</td>
                      <td className="py-2.5 px-3 text-gray-600 hidden md:table-cell">{formatDate(order.deliveryDate)}</td>
                      <td className="py-2.5 px-3 text-right font-bold" style={{ color: '#ff6d00' }}>{formatCurrency(orderDisplayTotal(order))}</td>
                      <td className="py-2.5 px-3"><Badge className={`${getStatusColor(order.status)} text-[10px]`}>{order.status}</Badge></td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleView(order.id)} title="View"><Eye className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleGenerateInvoice(order)} title="Invoice"><Receipt className="h-4 w-4" style={{ color: '#ff6d00' }} /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleWhatsApp(order)} title="WhatsApp"><MessageCircle className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyTrackingLink(order)} title="Copy tracking link"><Link2 className="h-4 w-4" style={{ color: '#ff6d00' }} /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handlePrint(order)} title="Print"><Printer className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDuplicate(order.id)} title="Duplicate"><Copy className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(order.id)} title="Delete"><Trash2 className="h-4 w-4 text-red-600" /></Button>
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

      {/* View dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="view-order-dialog">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-3" style={{ color: '#1F2937' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#ff6d00' }}>
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  Order Details
                </DialogTitle>
                <DialogDescription className="mt-2">{viewOrder?.orderId} — Complete order information</DialogDescription>
              </div>
              {viewOrder && <Badge className={`${getStatusColor(viewOrder.status)} text-sm px-3 py-1`}>{viewOrder.status}</Badge>}
            </div>
          </DialogHeader>

          {viewOrder && (
            <div className="space-y-4 mt-4">
              <div className="rounded-lg p-4" style={{ backgroundColor: '#FFF3ED' }}>
                <h4 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: '#ff6d00' }}>
                  <User className="h-4 w-4" />Customer Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><p className="text-xs text-gray-500 mb-1">Name</p><p className="font-semibold" style={{ color: '#1F2937' }}>{viewOrder.customerName}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</p><p className="font-semibold" style={{ color: '#1F2937' }}>{viewOrder.customerPhone || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Mail className="h-3 w-3" /> Email</p><p className="font-semibold" style={{ color: '#1F2937' }}>{viewOrder.customerEmail || 'N/A'}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</p><p className="font-semibold" style={{ color: '#1F2937' }}>{viewOrder.customerAddress || 'N/A'}</p></div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 text-gray-700">
                  <Calendar className="h-4 w-4" />Order Timeline
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><p className="text-xs text-gray-500 mb-1">Order Date</p><p className="font-semibold">{formatDate(viewOrder.date)}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Delivery Date</p><p className="font-semibold">{formatDate(viewOrder.deliveryDate)}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Assigned Designer</p><p className="font-semibold">{viewOrder.assignedDesigner || 'Not assigned'}</p></div>
                </div>
              </div>

              {viewOrder.products?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2 text-gray-700">
                    <Package className="h-4 w-4" />Products ({viewOrder.products.length})
                  </h4>
                  <div className="space-y-3">
                    {viewOrder.products.map((product) => (
                      <div key={product.id || `${product.name}-${product.quantity}-${product.rate}`} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate" style={{ color: '#1F2937' }}>{product.name}</p>
                          <div className="flex gap-4 mt-1 text-xs text-gray-600">
                            {product.size && <span>Size: {product.size}</span>}
                            {product.material && <span>Material: {product.material}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm text-gray-600">{product.quantity} × {formatCurrency(product.rate)}</p>
                          <p className="font-bold" style={{ color: '#ff6d00' }}>{formatCurrency(product.quantity * product.rate)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg p-4" style={{ background: 'linear-gradient(135deg, #ff6d00 0%, #E55511 100%)' }}>
                <h4 className="text-sm font-semibold uppercase tracking-wider mb-3 text-white/90">Payment Summary</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div><p className="text-xs text-white/80 mb-1">Total</p><p className="text-xl font-bold text-white">{formatCurrency(viewOrder.totalAmount || 0)}</p></div>
                  <div><p className="text-xs text-white/80 mb-1">Advance</p><p className="text-xl font-bold text-white">{formatCurrency(viewOrder.advancePayment || 0)}</p></div>
                  <div><p className="text-xs text-white/80 mb-1">Balance</p><p className="text-xl font-bold text-white">{formatCurrency((viewOrder.totalAmount || 0) - (viewOrder.advancePayment || 0))}</p></div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setViewOpen(false)} data-testid="close-dialog-button">
              <X className="h-4 w-4 mr-1" />Close
            </Button>
            {viewOrder && (
              <>
                <Button variant="outline" onClick={() => copyTrackingLink(viewOrder)}>
                  <Link2 className="h-4 w-4 mr-1" />Copy Track Link
                </Button>
                <Button variant="outline" onClick={() => handlePrint(viewOrder)}><Printer className="h-4 w-4 mr-1" />Print</Button>
                {viewOrder.status === 'Ready' && (
                  <Button variant="outline" onClick={() => { setViewOpen(false); navigate(`/orders/${viewOrder.id}/delivery-slip`); }}>
                    <Truck className="h-4 w-4 mr-1" />Delivery Slip
                  </Button>
                )}
                <Button variant="outline" className="text-green-700" onClick={() => handleWhatsApp(viewOrder)}><MessageCircle className="h-4 w-4 mr-1" />WhatsApp</Button>
                <Button variant="outline" onClick={() => handleGenerateInvoice(viewOrder)}><Receipt className="h-4 w-4 mr-1" style={{ color: '#ff6d00' }} />Invoice</Button>
                <Button style={{ backgroundColor: '#ff6d00' }} className="text-white" onClick={() => { setViewOpen(false); navigate(`/orders/${viewOrder.id}/edit`); }} data-testid="edit-from-dialog-button">
                  <Edit className="h-4 w-4 mr-1" />Edit
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersList;
