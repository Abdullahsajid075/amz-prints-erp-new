function normalizeStageKey(value) {
  const s = String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
  return s || 'lead';
}

function isClosedCrmStage(stage) {
  const key = normalizeStageKey(stage);
  return key === 'won' || key === 'lost' || key === 'closed';
}

function isOpenCrmQuery(customer) {
  if (!customer || customer.inCrm !== true) return false;
  return !isClosedCrmStage(customer.stage);
}

function countOpenCrmQueries(customers = []) {
  return (Array.isArray(customers) ? customers : []).filter(isOpenCrmQuery).length;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(isOpenCrmQuery({ inCrm: true, stage: 'lead' }), 'lead is open');
assert(isOpenCrmQuery({ inCrm: true, stage: 'proposal' }), 'proposal is open');
assert(!isOpenCrmQuery({ inCrm: true, stage: 'won' }), 'won is closed');
assert(!isOpenCrmQuery({ inCrm: true, stage: 'lost' }), 'lost is closed');
assert(!isOpenCrmQuery({ inCrm: false, stage: 'lead' }), 'directory only is not a query');
assert(!isOpenCrmQuery({ stage: 'lead' }), 'missing inCrm is not a query');
assert(countOpenCrmQueries([
  { inCrm: true, stage: 'lead' },
  { inCrm: true, stage: 'won' },
  { inCrm: false, stage: 'lead' },
  { inCrm: true, stage: 'negotiation' },
]) === 2, 'count open queries');

console.log('crmQueries ok');
