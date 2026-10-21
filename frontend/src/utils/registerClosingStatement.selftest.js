import { buildRegisterClosingStatement } from './registerClosingStatement.js';

function assert(cond, label) {
  if (!cond) throw new Error(`registerClosingStatement.selftest: ${label}`);
}

const closed = {
  id: 'posreg_abc123',
  status: 'closed',
  openedAt: '2026-10-21T08:00:00.000Z',
  openedBy: 'Bilal',
  closedAt: '2026-10-21T18:00:00.000Z',
  closedBy: 'Bilal',
  openingFloat: 5000,
  countedCash: 11800,
  expectedCash: 11800,
  variance: 0,
  totals: {
    count: 4,
    sales: 9000,
    cashSales: 6000,
    byMethod: { Cash: 6000, Card: 3000 },
  },
  cashMovements: {
    cashIn: 1000,
    cashOut: 200,
    net: 800,
    transactions: [
      { id: 'postx_1', type: 'in', amount: 1000, reason: 'Float top-up', note: '', at: '2026-10-21T10:00:00.000Z', user: 'Bilal' },
      { id: 'postx_2', type: 'out', amount: 200, reason: 'Courier payment', note: 'Urgent parcel', at: '2026-10-21T12:00:00.000Z', user: 'Bilal' },
    ],
  },
  closeNote: 'All matched',
};

const { filename, text } = buildRegisterClosingStatement(closed, { name: 'AMZ Prints' });

assert(filename.includes('Register Closing'), 'filename names the document type');
assert(filename.includes('posreg_abc123'), 'filename includes the register id so it is findable later');
assert(filename.endsWith('.txt'), 'filename has a .txt extension');

assert(text.includes('Register: posreg_abc123'), 'statement names the specific register');
assert(text.includes('Cash in (total):'), 'statement shows cash-in total as its own line');
assert(text.includes('Cash out (total):'), 'statement shows cash-out total as its own line');
assert(text.includes('Float top-up'), 'statement lists individual cash-in movement detail');
assert(text.includes('Courier payment'), 'statement lists individual cash-out movement detail');
assert(text.includes('Expected balance:'), 'statement shows the expected balance line');
assert(text.includes('Actual (counted):'), 'statement shows the counted/actual balance line');
assert(text.includes('Difference:'), 'statement shows the variance/difference line');
assert(text.includes('(matched)'), 'zero variance is labeled as matched');
assert(text.includes('All matched'), 'statement includes the close note');

// A register with no cash movements still renders cleanly (no crash, clear placeholder text).
const noMovements = buildRegisterClosingStatement({
  id: 'posreg_xyz',
  totals: { count: 0, sales: 0, cashSales: 0, byMethod: {} },
  cashMovements: { cashIn: 0, cashOut: 0, net: 0, transactions: [] },
  openingFloat: 1000,
  countedCash: 1000,
  expectedCash: 1000,
  variance: 0,
}, {});
assert(noMovements.text.includes('no cash in/out movements'), 'empty movement list shows a clear placeholder instead of breaking');
assert(noMovements.text.includes('no sales this shift'), 'empty sales list shows a clear placeholder instead of breaking');

console.log('registerClosingStatement ok');
