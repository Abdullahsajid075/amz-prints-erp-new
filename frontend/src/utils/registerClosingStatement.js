/**
 * Builds the full closing statement for a POS cash register (Z-report),
 * including Cash In / Cash Out movements as separate line items, so it can
 * be auto-downloaded the moment a register is closed and still be re-opened
 * later from Register history for the exact same register.
 */

import { formatCurrency } from './helpers.js';
import { buildDocumentFilename } from './documentFilename.js';

function fmtDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function money(value) {
  return formatCurrency(Number(value) || 0);
}

/**
 * @param {object} closed - The `closed` register object returned by
 *   POST /pos/register/close (has totals, cashMovements, openingFloat,
 *   expectedCash, countedCash, variance, etc.)
 * @param {{name?: string}} [company]
 * @returns {{ filename: string, text: string }}
 */
export function buildRegisterClosingStatement(closed, company = {}) {
  const totals = closed?.totals || { count: 0, sales: 0, cashSales: 0, byMethod: {} };
  const cash = closed?.cashMovements || { cashIn: 0, cashOut: 0, net: 0, transactions: [] };
  const openingFloat = Number(closed?.openingFloat) || 0;
  const expectedCash = Number(closed?.expectedCash) || 0;
  const countedCash = Number(closed?.countedCash) || 0;
  const variance = Number(closed?.variance) || 0;
  const transactions = Array.isArray(cash.transactions) ? cash.transactions : [];

  const methodLines = Object.entries(totals.byMethod || {})
    .map(([method, amount]) => `    ${method.padEnd(18, ' ')} ${money(amount)}`)
    .join('\n') || '    (no sales this shift)';

  const txLines = transactions.length
    ? transactions.map((t) => {
        const kind = t.type === 'in' ? 'CASH IN ' : 'CASH OUT';
        return `    [${kind}] ${money(t.amount).padStart(14, ' ')}  ${t.reason || ''}${t.note ? ` — ${t.note}` : ''} (${fmtDateTime(t.at)}, ${t.user || ''})`;
      }).join('\n')
    : '    (no cash in/out movements this shift)';

  const lines = [
    `${company?.name || 'AMZ Prints'} — Register Closing Statement`,
    `Register: ${closed?.id || '—'}`,
    `Opened:   ${fmtDateTime(closed?.openedAt)} by ${closed?.openedBy || '—'}`,
    `Closed:   ${fmtDateTime(closed?.closedAt)} by ${closed?.closedBy || '—'}`,
    '',
    'SALES',
    `  Transactions:       ${totals.count || 0}`,
    `  Total sales:        ${money(totals.sales)}`,
    `  Cash sales:         ${money(totals.cashSales)}`,
    '  By payment method:',
    methodLines,
    '',
    'CASH IN / CASH OUT',
    `  Cash in (total):     ${money(cash.cashIn)}`,
    `  Cash out (total):    ${money(cash.cashOut)}`,
    '  Movements:',
    txLines,
    '',
    'BALANCE',
    `  Opening balance:     ${money(openingFloat)}`,
    `  + Cash sales:        ${money(totals.cashSales)}`,
    `  + Cash in:           ${money(cash.cashIn)}`,
    `  - Cash out:          ${money(cash.cashOut)}`,
    `  = Expected balance:  ${money(expectedCash)}`,
    `  Actual (counted):    ${money(countedCash)}`,
    `  Difference:          ${money(variance)}${variance === 0 ? ' (matched)' : variance > 0 ? ' (over)' : ' (short)'}`,
    '',
    closed?.closeNote ? `Note: ${closed.closeNote}` : '',
  ];

  return {
    filename: buildDocumentFilename('Register Closing', [closed?.id, (closed?.closedAt || '').slice(0, 10)], { extension: 'txt' }),
    text: lines.join('\n'),
  };
}
