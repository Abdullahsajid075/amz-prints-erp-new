const { mapToken } = require('./mappers');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const mapped = mapToken({
  id: 'tok_1',
  token_no: 'A012',
  date: '2026-09-26',
  time: '13:00:00',
  customer_name: 'Ali',
  customer_phone: '03001234567',
  service: 'Designing',
  token_status: 'Called',
  counter_name: 'Table 01',
});

assert(mapped.status === 'Called', 'status alias');
assert(mapped.tokenStatus === 'Called', 'tokenStatus kept');
assert(mapped.tokenNo === 'A012', 'tokenNo');
assert(mapped.counterName === 'Table 01', 'counter');
assert(mapToken({ token_status: 'Waiting' }).status === 'Waiting', 'waiting');

console.log('mapToken ok');
