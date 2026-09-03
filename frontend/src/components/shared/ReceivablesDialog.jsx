import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { invoicesAPI } from '@/services/api';
import { notifyOrderEvent } from '@/services/notifications';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { WhatsAppIcon } from '@/components/shared/WhatsAppIcon';
import { toast } from 'sonner';

const invoiceBalance = (invoice) =>
  Math.max(0, Number(invoice.totalAmount || 0) + Number(invoice.previousBalance || 0) - Number(invoice.paidAmount || 0));

export default function ReceivablesDialog({ open, onOpenChange }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [remindingId, setRemindingId] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    invoicesAPI.getAll()
      .then((res) => {
        if (cancelled) return;
        const list = (Array.isArray(res.data) ? res.data : []).filter((inv) => invoiceBalance(inv) > 0);
        list.sort((a, b) => invoiceBalance(b) - invoiceBalance(a));
        setRows(list);
      })
      .catch(() => toast.error('Failed to load receivables'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open]);

  const total = useMemo(() => rows.reduce((s, inv) => s + invoiceBalance(inv), 0), [rows]);

  const sendReminder = async (invoice) => {
    if (!invoice.customerPhone) {
      toast.error('Customer phone missing');
      return;
    }
    setRemindingId(invoice.id);
    try {
      await notifyOrderEvent({
        event: 'payment_reminder',
        order: {
          customerName: invoice.customerName,
          customerPhone: invoice.customerPhone,
          orderId: invoice.orderId,
          totalAmount: invoice.totalAmount,
          balanceAmount: invoiceBalance(invoice),
        },
        invoice: { ...invoice, balanceAmount: invoiceBalance(invoice) },
        openWhatsApp: true,
        sendEmail: false,
      });
      toast.message('Reminder opened — tap Send on WhatsApp');
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
            Unpaid invoices · {formatCurrency(total)} pending
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-gray-500 py-8 text-center">Loading…</p>
        ) : rows.length === 0 ? (
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
              {rows.map((inv) => (
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
                      onClick={() => sendReminder(inv)}
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
