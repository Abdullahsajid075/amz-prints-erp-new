import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { invoicesAPI, customersAPI } from '@/services/api';
import { notifyOrderEvent, openBlankWhatsAppTab } from '@/services/notifications';
import { lookupCustomerPhone, firstPhone } from '@/utils/notifyPhone';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { WhatsAppIcon } from '@/components/shared/WhatsAppIcon';
import { toast } from 'sonner';

const invoiceBalance = (invoice) =>
  Math.max(0, Number(invoice.totalAmount || 0) + Number(invoice.previousBalance || 0) - Number(invoice.paidAmount || 0));

export default function ReceivablesDialog({ open, onOpenChange }) {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [remindingId, setRemindingId] = useState('');
  const [tab, setTab] = useState('customers');

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      invoicesAPI.getAll().catch(() => ({ data: [] })),
      customersAPI.getAll().catch(() => ({ data: [] })),
    ])
      .then(([invRes, custRes]) => {
        if (cancelled) return;
        const list = (Array.isArray(invRes.data) ? invRes.data : []).filter((inv) => invoiceBalance(inv) > 0.009);
        list.sort((a, b) => invoiceBalance(b) - invoiceBalance(a));
        setInvoices(list);
        const cust = (Array.isArray(custRes.data) ? custRes.data : [])
          .filter((c) => Number(c.outstanding) > 0.009)
          .sort((a, b) => Number(b.outstanding) - Number(a.outstanding));
        setCustomers(cust);
      })
      .catch(() => toast.error('Failed to load receivables'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open]);

  const invoiceTotal = useMemo(() => invoices.reduce((s, inv) => s + invoiceBalance(inv), 0), [invoices]);
  const customerTotal = useMemo(() => customers.reduce((s, c) => s + Number(c.outstanding || 0), 0), [customers]);

  const sendReminder = async (party, amount, extra = {}) => {
    const id = party.id;
    setRemindingId(id);
    const pendingWindow = openBlankWhatsAppTab();
    try {
      const phone = await lookupCustomerPhone({
        phone: firstPhone(party.customerPhone, party.phone),
        customerId: party.customerId || party.id,
        customerName: party.customerName || party.name,
      });
      if (!phone) {
        if (pendingWindow && !pendingWindow.closed) {
          try { pendingWindow.close(); } catch { /* ignore */ }
        }
        toast.error('Customer phone missing');
        return;
      }
      const result = await notifyOrderEvent({
        event: 'payment_reminder',
        order: {
          customerName: party.customerName || party.name,
          customerPhone: phone,
          orderId: extra.orderId || '',
          totalAmount: amount,
          balanceAmount: amount,
        },
        invoice: { ...party, customerPhone: phone, balanceAmount: amount },
        openWhatsApp: true,
        forceWhatsApp: true,
        sendEmail: false,
        pendingWindow,
      });
      if (result?.whatsappOpened) toast.message('Reminder opened — tap Send on WhatsApp');
      else toast.error('WhatsApp did not open — allow popups and check the phone number');
    } catch (err) {
      console.error(err);
      toast.error('Failed to open reminder');
    } finally {
      setRemindingId('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receivables</DialogTitle>
          <DialogDescription>
            Customer outstanding {formatCurrency(customerTotal)} · Open invoices {formatCurrency(invoiceTotal)}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 mb-3">
          <Button type="button" size="sm" variant={tab === 'customers' ? 'default' : 'outline'} onClick={() => setTab('customers')}>
            Customers ({customers.length})
          </Button>
          <Button type="button" size="sm" variant={tab === 'invoices' ? 'default' : 'outline'} onClick={() => setTab('invoices')}>
            Invoices ({invoices.length})
          </Button>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500 py-8 text-center">Loading…</p>
        ) : tab === 'customers' ? (
          customers.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">No outstanding customer balances.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="text-left py-2">Customer</th>
                  <th className="text-right py-2">Outstanding</th>
                  <th className="text-right py-2"> </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2.5 pr-2">
                      <p className="font-semibold truncate max-w-[220px]">{c.name}</p>
                      <p className="text-[11px] text-gray-500">{c.phone || '—'}</p>
                    </td>
                    <td className="py-2.5 text-right font-bold text-rose-600">{formatCurrency(c.outstanding)}</td>
                    <td className="py-2.5 pl-2 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] text-green-700 border-green-200"
                        disabled={remindingId === c.id}
                        onClick={() => sendReminder(c, Number(c.outstanding))}
                      >
                        <WhatsAppIcon className="h-3 w-3 mr-1" />Remind
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : invoices.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No outstanding invoices.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-[10px] uppercase tracking-wider text-gray-500">
                <th className="text-left py-2">Invoice</th>
                <th className="text-left py-2">Customer</th>
                <th className="text-right py-2">Due</th>
                <th className="text-right py-2"> </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b last:border-0">
                  <td className="py-2.5 pr-2">
                    <p className="font-semibold" style={{ color: '#ff6d00' }}>{inv.invoiceNumber}</p>
                    <p className="text-[11px] text-gray-500">{formatDate(inv.date)}{inv.orderId ? ` · ${inv.orderId}` : ''}</p>
                  </td>
                  <td className="py-2.5 pr-2">
                    <p className="truncate max-w-[160px]">{inv.customerName}</p>
                    <p className="text-[11px] text-gray-500">{inv.customerPhone || '—'}</p>
                  </td>
                  <td className="py-2.5 text-right font-bold text-rose-600">{formatCurrency(invoiceBalance(inv))}</td>
                  <td className="py-2.5 pl-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[11px] text-green-700 border-green-200"
                      disabled={remindingId === inv.id}
                      onClick={() => sendReminder(inv, invoiceBalance(inv), { orderId: inv.orderId })}
                    >
                      <WhatsAppIcon className="h-3 w-3 mr-1" />Remind
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DialogContent>
    </Dialog>
  );
}
