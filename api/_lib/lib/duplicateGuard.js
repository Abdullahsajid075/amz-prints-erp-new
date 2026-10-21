/**
 * Blocks duplicate Customer/Vendor registration by Name or Phone Number,
 * instead of silently creating (or merging into) a second record for what
 * is really the same person/business.
 */

function normName(v) {
  return String(v || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function normPhone(v) {
  return String(v || '').replace(/\D/g, '');
}

/**
 * Looks for an existing row that collides with a candidate's name or phone.
 * Returns { row, fields } where `fields` lists which of Name/Number matched
 * (used to build a precise "already exists by: ..." message), or null when
 * there is no collision.
 */
function findDuplicateContact(rows, candidate, opts = {}) {
  const nameField = opts.nameField || 'name';
  const phoneField = opts.phoneField || 'phone';
  const candName = normName(candidate && candidate.name);
  const candPhone = normPhone(candidate && candidate.phone);
  for (const row of rows || []) {
    if (!row) continue;
    const fields = [];
    if (candName && normName(row[nameField]) === candName) fields.push('Name');
    if (candPhone && normPhone(row[phoneField]) === candPhone) fields.push('Number');
    if (fields.length) return { row, fields };
  }
  return null;
}

function duplicateContactMessage(label, fields) {
  return `${label} already exists by: ${fields.join(' / ')}`;
}

module.exports = { findDuplicateContact, duplicateContactMessage, normName, normPhone };
