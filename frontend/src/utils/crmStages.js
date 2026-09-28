/** Default CRM pipeline stages (overridable via Settings → CRM). */
export const DEFAULT_CRM_STAGES = [
  { key: 'lead', label: 'Lead', color: '#3B82F6' },
  { key: 'contacted', label: 'Contacted', color: '#8B5CF6' },
  { key: 'qualified', label: 'Qualified', color: '#F59E0B' },
  { key: 'proposal', label: 'Proposal', color: '#ff6d00' },
  { key: 'negotiation', label: 'Negotiation', color: '#06B6D4' },
  { key: 'won', label: 'Won', color: '#10B981' },
  { key: 'lost', label: 'Lost', color: '#EF4444' },
];

export function normalizeStageKey(value) {
  const s = String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
  return s || 'lead';
}

export function resolveCrmStages(settingsCrm) {
  const raw = settingsCrm?.stages;
  if (!Array.isArray(raw) || !raw.length) return DEFAULT_CRM_STAGES;
  return raw
    .map((s) => ({
      key: normalizeStageKey(s.key || s.label),
      label: String(s.label || s.key || 'Stage').trim() || 'Stage',
      color: s.color || '#6B7280',
    }))
    .filter((s) => s.key);
}

export function isClosedCrmStage(stage) {
  const key = normalizeStageKey(stage);
  return key === 'won' || key === 'lost' || key === 'closed';
}

/** Open CRM queries — in the pipeline, not won/lost. */
export function isOpenCrmQuery(customer) {
  if (!customer || customer.inCrm !== true) return false;
  return !isClosedCrmStage(customer.stage);
}

export function countOpenCrmQueries(customers = []) {
  return (Array.isArray(customers) ? customers : []).filter(isOpenCrmQuery).length;
}
