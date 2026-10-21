const assert = require('assert');
const { findDuplicateContact, duplicateContactMessage } = require('./duplicateGuard');

const rows = [
  { id: 'cust_1', name: 'Bilal Traders', phone: '0300-1234567' },
  { id: 'cust_2', name: 'Sana Prints', phone: '03007654321' },
];

// Exact name match (case/whitespace-insensitive).
assert.deepStrictEqual(
  findDuplicateContact(rows, { name: '  bilal   traders', phone: '0321-0000000' }).fields,
  ['Name'],
  'matches on normalized name'
);

// Exact phone match regardless of formatting (dashes/spaces).
assert.deepStrictEqual(
  findDuplicateContact(rows, { name: 'Someone Else', phone: '0300 1234567' }).fields,
  ['Number'],
  'matches on normalized phone, ignoring punctuation'
);

// Both fields collide with the same row.
assert.deepStrictEqual(
  findDuplicateContact(rows, { name: 'Sana Prints', phone: '03007654321' }).fields,
  ['Name', 'Number'],
  'reports both matched fields when both collide'
);

// No collision for a genuinely new contact.
assert.strictEqual(
  findDuplicateContact(rows, { name: 'Fawad Mart', phone: '03009998887' }),
  null,
  'returns null when nothing collides'
);

// Empty candidate fields never cause a false match.
assert.strictEqual(
  findDuplicateContact(rows, { name: '', phone: '' }),
  null,
  'blank name/phone never match an existing row'
);

assert.strictEqual(
  duplicateContactMessage('Customer', ['Name']),
  'Customer already exists by: Name'
);
assert.strictEqual(
  duplicateContactMessage('Vendor', ['Name', 'Number']),
  'Vendor already exists by: Name / Number'
);

console.log('duplicateGuard ok');
