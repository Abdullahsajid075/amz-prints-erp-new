import { formatCurrency } from '@/utils/helpers';
import { openWhatsAppChat } from '@/services/notifications/whatsappChannel';
import { canAccessModule } from '@/utils/permissions';

export function isCustomerBlocked(customer) {
  if (!customer) return false;
  const v = customer.blocked ?? customer.isBlocked;
  if (v === true || v === 1) return true;
  const s = String(v || '').trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'blocked';
}

export function getBlockMessage(customer) {
  const reason = String(customer?.blockReason || customer?.blockreason || '').trim();
  const code = customer?.customerCode || customer?.customercode || customer?.id || '';
  const base = 'This customer is blocked and cannot receive office services.';
  const admin = ' Contact Admin to unblock.';
  const parts = [base];
  if (reason) parts.push(`Reason: ${reason}`);
  if (code) parts.push(`Customer ID: ${code}`);
  parts.push(admin);
  return parts.join(' ');
}

export function isAdminUser(user) {
  const role = String(user?.role || '').trim().toLowerCase();
  return ['super admin', 'admin', 'administrator', 'owner'].includes(role);
}

/** Unblock is Settings-admin only. */
export function canUnblockCustomer(user) {
  return canAccessModule(user, 'settings');
}

export function customerDisplayCode(customer) {
  return customer?.customerCode || customer?.customercode || customer?.id || '—';
}

export function buildUrduBalanceMessage({ customerName, customerCode, outstanding, orderId, invoiceNumber } = {}) {
  const name = customerName || 'Customer';
  const code = customerCode || '';
  const amount = formatCurrency(outstanding || 0);
  const ref = orderId || invoiceNumber || '';
  return (
    `Assalam-o-Alaikum ${name},\n\n`
    + `Amazon Printing Services ki taraf se narm reminder hai ke aap ka *baqi balance ${amount}* abhi tak wajib-ul-ada hai.\n\n`
    + `Baraye meharbani jald az jald payment arrange karein.\n\n`
    + (ref ? `Order / Invoice: ${ref}\n` : '')
    + (code ? `Customer ID: ${code}\n` : '')
    + `\nShukriya!\nAmazon Printing Services\n📍 King Road, Mandi Bahauddin`
  );
}

export function openUrduBalanceWhatsApp(customer, { outstanding, orderId, invoiceNumber } = {}) {
  const phone = customer?.phone || customer?.customerPhone;
  if (!phone) return { ok: false, reason: 'no_phone' };
  const text = buildUrduBalanceMessage({
    customerName: customer?.name || customer?.customerName,
    customerCode: customerDisplayCode(customer),
    outstanding,
    orderId,
    invoiceNumber,
  });
  return openWhatsAppChat(phone, text);
}

export function buildWelcomeMessage(customer) {
  const name = customer?.name || 'Customer';
  const code = customerDisplayCode(customer);
  return (
    `Assalam-o-Alaikum ${name}!\n\n`
    + `Amazon Printing Services mein *khush amdeed*.\n\n`
    + `Aap ka Customer ID: *${code}*\n`
    + `Is number ko office tracking ke liye save rakhein.\n\n`
    + `Shukriya!\n📍 King Road, Mandi Bahauddin\n🌐 amzprints.com`
  );
}

export function openCustomerWelcomeWhatsApp(customer) {
  const phone = customer?.phone;
  if (!phone) return { ok: false, reason: 'no_phone' };
  return openWhatsAppChat(phone, buildWelcomeMessage(customer));
}

export function orderIsDeliveredWithBalance(order) {
  if (!order) return false;
  const status = String(order.status || '').toLowerCase();
  const delivered = status.includes('delivered') || status.includes('completed') || status.includes('complete');
  const total = Number(order.totalAmount || order.total || 0);
  const paid = Number(order.advancePayment || order.paidAmount || 0);
  const balance = Number(order.balanceAmount ?? Math.max(0, total - paid));
  return delivered && balance > 0;
}
