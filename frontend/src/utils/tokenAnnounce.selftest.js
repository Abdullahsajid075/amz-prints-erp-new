function tokenStatusOf(token) {
  return String(token?.status || token?.tokenStatus || 'Waiting').trim() || 'Waiting';
}

function isWaitingToken(token) {
  return tokenStatusOf(token).toLowerCase() === 'waiting';
}

function isActiveToken(token) {
  return ['called', 'in progress'].includes(tokenStatusOf(token).toLowerCase());
}

function tokenAnnouncePhrase(tokenNo, counterName) {
  const token = String(tokenNo || '').trim() || 'TOKEN';
  const counter = String(counterName || '').trim() || 'COUNTER';
  return `${token} PLEASE PROCEED TO THE ${counter}`;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(tokenStatusOf({ tokenStatus: 'Called' }) === 'Called', 'alias tokenStatus');
assert(tokenStatusOf({ status: 'In Progress' }) === 'In Progress', 'status field');
assert(tokenStatusOf({}) === 'Waiting', 'default waiting');
assert(isWaitingToken({ tokenStatus: 'Waiting' }), 'waiting');
assert(isActiveToken({ status: 'Called' }), 'called is active');
assert(isActiveToken({ tokenStatus: 'In Progress' }), 'in progress is active');
assert(!isActiveToken({ status: 'Waiting' }), 'waiting is not active');
assert(
  tokenAnnouncePhrase('A012', 'Table 01') === 'A012 PLEASE PROCEED TO THE Table 01',
  'announce phrase'
);
assert(
  tokenAnnouncePhrase('E003', 'Executive Office') === 'E003 PLEASE PROCEED TO THE Executive Office',
  'executive phrase'
);

console.log('tokenAnnounce ok');
