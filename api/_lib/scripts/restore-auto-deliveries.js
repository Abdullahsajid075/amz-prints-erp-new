/**
 * Restore orders auto-marked Delivered when an invoice was linked.
 * Dry-run by default. Pass --apply to write status changes.
 * Always writes a JSON backup before applying.
 *
 * Usage:
 *   node api/_lib/scripts/restore-auto-deliveries.js
 *   node api/_lib/scripts/restore-auto-deliveries.js --apply
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { supabase } = require('../db');
const {
  classifyIncorrectDelivery,
  buildHistoryEntry,
  appendAdminReviewRemark,
  RESTORE_NOTE,
  REOPEN_NOTE,
} = require('../lib/deliveryWorkflow');
const { collectOrderIds } = require('../lib/helpers');

const APPLY = process.argv.includes('--apply');

function stamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function main() {
  const { data: orders, error } = await supabase.from('orders').select('*');
  if (error) throw error;
  const { data: invoices } = await supabase.from('invoices').select('id,order_id,order_ids');
  const decisions = [];
  for (const order of orders || []) {
    const keys = [order.order_id, order.id].filter(Boolean).map(String);
    const hasInvoice = (invoices || []).some((inv) => {
      const ids = collectOrderIds({}, inv).map(String);
      return keys.some((k) => ids.includes(k) || String(inv.order_id) === k);
    });
    const decision = classifyIncorrectDelivery(order, { hasInvoice });
    if (decision.action === 'skip') continue;
    decisions.push({
      id: order.id,
      orderId: order.order_id,
      status: order.status,
      remarks: order.remarks || '',
      status_history: order.status_history,
      hasInvoice,
      decision,
    });
  }

  const backupDir = path.join(__dirname, '../../../.restore-backups');
  fs.mkdirSync(backupDir, { recursive: true });
  const backupFile = path.join(backupDir, `orders-delivery-${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify({ at: new Date().toISOString(), apply: APPLY, decisions }, null, 2));

  const summary = { restore: 0, 'reopen-ready': 0, flag: 0, keep: 0 };
  for (const row of decisions) {
    summary[row.decision.action] = (summary[row.decision.action] || 0) + 1;
    console.log(`${row.orderId || row.id}\t${row.status}\t${row.decision.action}\t${row.decision.reason}\t${row.decision.restoreTo || ''}`);
  }
  console.log(JSON.stringify({ backupFile, apply: APPLY, summary, count: decisions.length }));

  if (!APPLY) return;

  const at = stamp();
  for (const row of decisions) {
    const { decision } = row;
    const order = (orders || []).find((o) => o.id === row.id);
    if (!order) continue;
    const hist = Array.isArray(order.status_history) ? [...order.status_history] : [];
    if (decision.action === 'restore' || decision.action === 'reopen-ready') {
      const nextStatus = decision.restoreTo || 'Ready';
      hist.push(buildHistoryEntry({
        status: nextStatus,
        at,
        note: decision.action === 'reopen-ready' ? REOPEN_NOTE : RESTORE_NOTE,
        previousStatus: order.status,
        by: 'system',
        process: 'restore-auto-delivery',
      }));
      const { error: updErr } = await supabase.from('orders').update({
        status: nextStatus,
        status_history: hist,
      }).eq('id', order.id);
      if (updErr) throw updErr;
    } else if (decision.action === 'flag') {
      const remarks = appendAdminReviewRemark(order.remarks, decision.reason);
      hist.push(buildHistoryEntry({
        status: order.status,
        at,
        note: `ADMIN REVIEW: ${decision.reason}`,
        previousStatus: order.status,
        by: 'system',
        process: 'restore-auto-delivery',
      }));
      const { error: updErr } = await supabase.from('orders').update({ remarks, status_history: hist }).eq('id', order.id);
      if (updErr) throw updErr;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
