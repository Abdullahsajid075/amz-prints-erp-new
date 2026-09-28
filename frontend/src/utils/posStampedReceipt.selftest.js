function isReceiptUploadFile(file) {
  if (!file) return false;
  const type = String(file.type || '').toLowerCase();
  const name = String(file.name || '').toLowerCase();
  if (type === 'application/pdf' || name.endsWith('.pdf')) return true;
  if (type.startsWith('image/')) return true;
  return /\.(png|jpe?g|webp)$/i.test(name);
}

function websiteWatermarkText(company = {}) {
  const site = String(company.website || 'amzprints.com').replace(/^https?:\/\//i, '').replace(/\/$/, '');
  return `WR · ${site || 'amzprints.com'}`;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(isReceiptUploadFile({ name: 'bank.pdf', type: 'application/pdf' }), 'pdf ok');
assert(isReceiptUploadFile({ name: 'scan.jpg', type: 'image/jpeg' }), 'jpg ok');
assert(!isReceiptUploadFile({ name: 'notes.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), 'reject docx');
assert(websiteWatermarkText({}).includes('WR ·'), 'wr prefix');
assert(websiteWatermarkText({ website: 'https://amzprints.com' }) === 'WR · amzprints.com', 'strip protocol');
assert(websiteWatermarkText({ website: 'amzprints.com/' }) === 'WR · amzprints.com', 'strip slash');

console.log('posStampedReceipt ok');
