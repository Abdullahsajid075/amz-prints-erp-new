import { sanitizeFilenamePart, formatDateRangeForFilename, buildDocumentFilename } from './documentFilename.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(sanitizeFilenamePart('Ali/Hassan:Test?') === 'AliHassanTest', 'strips invalid chars');
assert(sanitizeFilenamePart('  multiple   spaces  ') === 'multiple spaces', 'collapses whitespace');
assert(sanitizeFilenamePart(null) === '', 'handles null');

assert(formatDateRangeForFilename('2026-01-01', '2026-01-31') === '2026-01-01 to 2026-01-31', 'date range');
assert(formatDateRangeForFilename('2026-01-01', '2026-01-01') === '2026-01-01', 'same date collapses');
assert(formatDateRangeForFilename('2026-01-01', '') === '2026-01-01', 'single date');
assert(formatDateRangeForFilename('', '') === '', 'empty range');

assert(
  buildDocumentFilename('Customer Ledger', ['Customer Name'], { extension: 'pdf' }) === 'Customer Ledger - Customer Name.pdf',
  'customer ledger'
);
assert(
  buildDocumentFilename('Invoice', ['INV-00125'], { extension: 'pdf' }) === 'Invoice - INV-00125.pdf',
  'invoice'
);
assert(
  buildDocumentFilename('Order', ['Order Name', 'ORD-00125'], { extension: 'pdf' }) === 'Order - Order Name - ORD-00125.pdf',
  'order'
);
assert(
  buildDocumentFilename('Purchase Order', ['PO-00125', 'Vendor Name'], { extension: 'pdf' }) === 'Purchase Order - PO-00125 - Vendor Name.pdf',
  'purchase order'
);
assert(
  buildDocumentFilename('POS Statement', ['2026-10-16'], { extension: 'pdf' }) === 'POS Statement - 2026-10-16.pdf',
  'pos statement'
);
assert(
  buildDocumentFilename('Register Closing', ['2026-10-16', 'Register 01'], { extension: 'pdf' }) === 'Register Closing - 2026-10-16 - Register 01.pdf',
  'register closing'
);
assert(
  buildDocumentFilename('Reseller Statement', ['RS-001', formatDateRangeForFilename('2026-01-01', '2026-01-31')], { extension: 'pdf' })
    === 'Reseller Statement - RS-001 - 2026-01-01 to 2026-01-31.pdf',
  'reseller statement'
);
assert(buildDocumentFilename('', []) === 'Document', 'falls back to Document when empty');
assert(buildDocumentFilename('Invoice', ['bad/name:here']) === 'Invoice - badnamehere', 'sanitizes parts');

const long = buildDocumentFilename('Invoice', ['x'.repeat(300)], { extension: 'pdf', maxLength: 20 });
assert(long.length <= 24, 'respects maxLength plus extension');

console.log('documentFilename ok');
