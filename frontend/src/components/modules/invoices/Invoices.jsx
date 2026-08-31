import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { invoicesAPI } from '@/services/api';
import { notifyOrderEvent } from '@/services/notifications';
import { finishPaymentRecording } from '@/utils/paymentActions';
import { useBrand } from '@/context/BrandContext';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { sortBy } from '@/utils/sortBy';
import SortBar from '@/components/shared/SortBar';
import { Plus, Search, Eye, Edit, FileText, Copy as CopyIcon, Wallet } from 'lucide-react';
import ReceivablesDialog from '@/components/shared/ReceivablesDialog';
import { toast } from 'sonner';

const INVOICE_SORT_OPTS = [
  { value: 'date', label: 'Date' },
  { value: 'invoiceNumber', label: 'Invoice #' },
  { value: 'customerName', label: 'Customer' },
  { value: 'totalAmount', label: 'Amount' },
  { value: 'status', label: 'Status' },
];

const invoiceBalance = (invoice) =>
  Math.max(0, Number(invoice.totalAmount || 0) + Number(invoice.previousBalance || 0) - Number(invoice.paidAmount || 0));

const Invoices = () => {
  const navigate = useNavigate();
  const { company } = useBrand();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ field: 'date', dir: 'desc' });
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [paymentData, setPaymentData] = useState({ amount: '', method: 'Cash', notes: '', date: new Date().toISOString().slice(0, 10) });
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [receivablesOpen, setReceivablesOpen] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await invoicesAPI.getAll();
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filtered = invoices.filter(inv =>
    !search ||
    inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
    inv.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    inv.orderId?.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = useMemo(() => sortBy(filtered, sort, {
    date: (inv) => inv.date || '',
    invoiceNumber: (inv) => inv.invoiceNumber || '',
    customerName: (inv) => inv.customerName || '',
    totalAmount: (inv) => Number(inv.totalAmount ?? inv.total ?? 0) || 0,
    total: (inv) => Number(inv.totalAmount ?? inv.total ?? 0) || 0,
    status: (inv) => inv.status || '',
  }), [filtered, sort]);

  const copyShareLink = (invoice) => {
    if (!invoice.shareToken) {
      toast.error('Share link not ready yet');
      return;
    }
    const link = `${window.location.origin}/invoice/${invoice.shareToken}`;
    navigator.clipboard.writeText(link);
    toast.success('Shareable link copied to clipboard!');
  };

  const shareOnWhatsApp = async (invoice) => {
    const bal = invoiceBalance(invoice);
    try {
      await notifyOrderEvent({
        event: 'invoice_generated',
        order: {
          customerName: invoice.customerName,
          customerPhone: invoice.customerPhone,
          orderId: invoice.orderId,
          totalAmount: invoice.totalAmount,
          balanceAmount: bal,
        },
        invoice: {
          ...invoice,
          balanceAmount: bal,
          paidAmount: invoice.paidAmount || 0,
        },
        openWhatsApp: true,
        sendEmail: false,
      });
      toast.message('WhatsApp opened — invoice link + pending payment');
    } catch (err) {
      console.error(err);
      toast.error('Failed to open WhatsApp');
    }
  };

  const sendPaymentReminder = async (invoice) => {
    const bal = invoiceBalance(invoice);
    if (!(bal > 0)) {
      toast.error('No pending balance on this invoice');
      return;
    }
    if (!invoice.customerPhone) {
      toast.error('Customer phone missing');
      return;
    }
    try {
      await notifyOrderEvent({
        event: 'payment_reminder',
        order: {
          customerName: invoice.customerName,
          customerPhone: invoice.customerPhone,
          orderId: invoice.orderId,
          totalAmount: invoice.totalAmount,
          balanceAmount: bal,
        },
        invoice: {
          ...invoice,
          balanceAmount: bal,
          paidAmount: invoice.paidAmount || 0,
        },
        openWhatsApp: true,
        sendEmail: false,
      });
      toast.success('Payment reminder WhatsApp opened');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send reminder');
    }
  };

  const openInvoicePayment = (invoice) => {
    const bal = invoiceBalance(invoice);
    setPaymentInvoice(invoice);
    setPaymentData({
      amount: bal > 0 ? bal : '',
      method: 'Cash',
      notes: '',
      date: new Date().toISOString().slice(0, 10),
    });
  };

  const saveInvoicePayment = async (e) => {
    e.preventDefault();
    if (!paymentInvoice) return;
    const amount = Number(paymentData.amount) || 0;
    if (!(amount > 0)) {
      toast.error('Enter a valid amount');
      return;
    }
    setPaymentSaving(true);
    try {
      const res = await invoicesAPI.pay(paymentInvoice.id, {
        amount,
        method: paymentData.method,
        notes: paymentData.notes,
        date: paymentData.date,
      });
      const data = res.data || {};
      await finishPaymentRecording(data.payment || data, {
        company,
        extras: {
          customerName: paymentInvoice.customerName,
          customerPhone: paymentInvoice.customerPhone,
          customerEmail: paymentInvoice.customerEmail,
          reference: paymentInvoice.invoiceNumber,
          balanceDue: data.invoice?.balanceAmount,
          totalAmount: paymentInvoice.totalAmount,
        },
        notify: true,
        sendEmail: false,
      });
      if (Number(data.extra) > 0) {
        toast.message(`Extra ${formatCurrency(data.extra)} saved as customer credit`);
      }
      toast.success('Payment recorded');
      setPaymentInvoice(null);
      fetchInvoices();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Payment failed');
    } finally {
      setPaymentSaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'Paid': 'bg-green-100 text-green-800',
      'Partial': 'bg-yellow-100 text-yellow-800',
      'Unpaid': 'bg-red-100 text-red-800',
      'Overdue': 'bg-red-200 text-red-900'
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'Paid').length,
    unpaid: invoices.filter(i => i.status === 'Unpaid' || i.status === 'Partial').length,
    totalAmount: invoices.reduce((s, i) => s + (i.totalAmount || 0), 0),
    receivable: invoices.reduce((s, i) => s + invoiceBalance(i), 0)
  };

  return (
    <div className="space-y-6" data-testid="invoices-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>Invoices</h1>
          <p className="text-gray-600 mt-1">Create, manage & share professional invoices</p>
        </div>
        <Button
          onClick={() => navigate('/invoices/new')}
          style={{ backgroundColor: '#F26522' }}
          className="text-white"
          data-testid="create-invoice-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase font-medium mb-1">Total</p>
            <p className="text-2xl font-bold" style={{ color: '#2E2E2E' }}>{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase font-medium mb-1">Paid</p>
            <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase font-medium mb-1">Pending</p>
            <p className="text-2xl font-bold text-red-600">{stats.unpaid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase font-medium mb-1">Total Value</p>
            <p className="text-xl font-bold" style={{ color: '#F26522' }}>{formatCurrency(stats.totalAmount)}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-orange-200" onClick={() => setReceivablesOpen(true)}>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500 uppercase font-medium mb-1">Receivable</p>
            <p className="text-xl font-bold text-orange-700">{formatCurrency(stats.receivable)}</p>
            <p className="text-[10px] text-gray-400 mt-1">Click for unpaid list</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by invoice number, order ID, or customer name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                data-testid="invoice-search"
              />
            </div>
            <SortBar value={sort} onChange={setSort} options={INVOICE_SORT_OPTS} className="w-full sm:w-auto sm:min-w-[280px]" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading invoices...</div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">No invoices found. Create your first invoice from an order.</p>
              <Button onClick={() => navigate('/invoices/new')} style={{ backgroundColor: '#F26522' }} className="text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {sorted.map(invoice => (
                <div
                  key={invoice.id}
                  className="group relative bg-white border border-gray-100 rounded-xl p-3.5 hover:shadow-md hover:border-orange-200 transition-all"
                  data-testid={`invoice-card-${invoice.id}`}
                >
                  <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: 'linear-gradient(90deg, #F26522, #FF8A50)' }} />
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0">
                      <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Invoice</p>
                      <h3 className="text-sm font-bold truncate" style={{ color: '#1F2937' }}>{invoice.invoiceNumber}</h3>
                      {invoice.orderId && <p className="text-[10px] text-orange-600 truncate">Ord: {invoice.orderId}</p>}
                    </div>
                    <Badge className={`${getStatusBadge(invoice.status)} text-[9px] shrink-0`}>{invoice.status}</Badge>
                  </div>

                  <div className="pb-2 mb-2 border-b border-gray-100">
                    <p className="text-xs font-semibold truncate" style={{ color: '#1F2937' }}>{invoice.customerName}</p>
                    <p className="text-[10px] text-gray-500">{formatDate(invoice.date)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div><p className="text-[9px] text-gray-500 uppercase">Total</p><p className="text-sm font-bold" style={{ color: '#F26522' }}>{formatCurrency(invoice.totalAmount)}</p></div>
                    <div><p className="text-[9px] text-gray-500 uppercase">Balance</p><p className="text-sm font-bold text-gray-700">{formatCurrency(invoiceBalance(invoice))}</p></div>
                  </div>

                  <div className="flex gap-1 flex-wrap">
                    <Button size="sm" className="flex-1 text-white h-7 text-[11px] px-2" style={{ backgroundColor: '#F26522' }} onClick={() => navigate(`/invoices/${invoice.id}`)} data-testid={`view-invoice-${invoice.id}`}>
                      <Eye className="h-3 w-3 mr-1" />View
                    </Button>
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => navigate(`/invoices/${invoice.id}/edit`)} title="Edit" data-testid={`edit-invoice-${invoice.id}`}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => copyShareLink(invoice)} title="Copy link" data-testid={`share-invoice-${invoice.id}`}>
                      <CopyIcon className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-7 w-7 text-green-600 hover:bg-green-50" onClick={() => shareOnWhatsApp(invoice)} title="WhatsApp" data-testid={`whatsapp-invoice-${invoice.id}`}>
                      <WhatsAppIcon className="h-3 w-3" />
                    </Button>
                    {invoiceBalance(invoice) > 0 && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                          onClick={() => openInvoicePayment(invoice)}
                          title="Record payment"
                          data-testid={`pay-invoice-${invoice.id}`}
                        >
                          <Wallet className="h-3 w-3 mr-1" />Pay
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] px-2 text-amber-700 border-amber-300 hover:bg-amber-50"
                          onClick={() => sendPaymentReminder(invoice)}
                          title="Payment reminder"
                          data-testid={`remind-invoice-${invoice.id}`}
                        >
                          <WhatsAppIcon className="h-3 w-3 mr-1" />Remind
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!paymentInvoice} onOpenChange={(open) => { if (!open && !paymentSaving) setPaymentInvoice(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Invoice Payment</DialogTitle>
            <DialogDescription>
              {paymentInvoice?.invoiceNumber} · {paymentInvoice?.customerName}
              {paymentInvoice?.orderId ? ` · Order ${paymentInvoice.orderId}` : ''}
            </DialogDescription>
          </DialogHeader>
          {paymentInvoice && (
            <form onSubmit={saveInvoicePayment} className="space-y-3 mt-2">
              <div className="text-sm rounded-lg bg-gray-50 p-3">
                <div className="flex justify-between"><span>Balance due</span><strong>{formatCurrency(invoiceBalance(paymentInvoice))}</strong></div>
                {(paymentInvoice.paymentHistory?.length > 0) && (
                  <p className="text-xs text-gray-500 mt-2">{paymentInvoice.paymentHistory.length} previous payment(s) — locked</p>
                )}
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={paymentData.date} onChange={(e) => setPaymentData((p) => ({ ...p, date: e.target.value }))} required />
              </div>
              <div>
                <Label>Amount *</Label>
                <Input type="number" min="0.01" step="0.01" value={paymentData.amount} onChange={(e) => setPaymentData((p) => ({ ...p, amount: e.target.value }))} required autoFocus />
              </div>
              <div>
                <Label>Method</Label>
                <Select value={paymentData.method} onValueChange={(method) => setPaymentData((p) => ({ ...p, method }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Cash', 'Bank Transfer', 'UPI', 'Card', 'Cheque'].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={paymentData.notes} onChange={(e) => setPaymentData((p) => ({ ...p, notes: e.target.value }))} placeholder="Receipt / reference" />
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setPaymentInvoice(null)} disabled={paymentSaving}>Cancel</Button>
                <Button type="submit" className="text-white" style={{ backgroundColor: '#F26522' }} disabled={paymentSaving}>
                  <Wallet className="h-4 w-4 mr-1" />{paymentSaving ? 'Saving…' : 'Record & print receipt'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <ReceivablesDialog open={receivablesOpen} onOpenChange={setReceivablesOpen} />
    </div>
  );
};

export default Invoices;
