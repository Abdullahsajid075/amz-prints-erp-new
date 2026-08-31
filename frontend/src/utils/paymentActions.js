import { printPaymentSlip, notifyPaymentEvent } from '@/services/notifications';
import { toast } from 'sonner';

/** Normalize GAS payment row for slip + notifications. */
export function normalizeSlipPayment(payment, extras = {}) {
  const p = payment || {};
  return {
    id: p.id,
    date: p.date || new Date().toISOString().slice(0, 10),
    type: p.type || 'inflow',
    category: p.category || extras.category || 'Invoice Payment',
    party: p.customerName || p.customername || p.party || extras.customerName || '',
    customerName: p.customerName || p.customername || p.party || extras.customerName || '',
    partyPhone: p.partyPhone || p.partyphone || p.customerPhone || extras.customerPhone || '',
    partyEmail: p.partyEmail || p.partyemail || p.customerEmail || extras.customerEmail || '',
    reference: p.refId || p.refid || p.reference || extras.reference || '',
    amount: Number(p.amount || 0),
    method: p.method || 'Cash',
    notes: p.notes || extras.notes || '',
    balanceDue: Number(p.balanceDue ?? p.balancedue ?? extras.balanceDue ?? 0),
    totalAmount: Number(p.totalAmount ?? p.totalamount ?? extras.totalAmount ?? 0),
  };
}

/** Print receipt + optional WhatsApp/email notification after recording payment. */
export async function finishPaymentRecording(payment, { company, extras = {}, notify = true, sendEmail = false } = {}) {
  const slip = normalizeSlipPayment(payment, extras);
  const printed = printPaymentSlip(slip, company || {});
  if (!printed.ok) {
    toast.error('Could not print payment receipt');
  } else {
    toast.message('Payment receipt opened — print or save');
  }
  if (notify && slip.partyPhone) {
    try {
      await notifyPaymentEvent(slip, { openWhatsApp: true, sendEmail });
    } catch (err) {
      console.error(err);
    }
  }
  return slip;
}
