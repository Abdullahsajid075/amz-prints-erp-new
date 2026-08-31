/**
 * Urdu WhatsApp message builders for customer-facing notifications.
 * Kept as pure functions so they are easy to reuse and test.
 */

const COMPANY_FOOTER = `📍 King Road, Mandi Bahauddin
🌐 amzprints.com`;

const COMPANY_NAME = 'Amazon Printing Services';

function formatRs(amount) {
  const n = Number(amount || 0);
  const pretty = n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `Rs ${pretty}`;
}

/** Warm welcome + office tracking ID, sent when a customer registers the first time. */
export function buildWelcomeMessage(customer = {}, companyName = COMPANY_NAME) {
  const name = String(customer.name || '').trim() || 'صارف';
  const code = String(customer.customerCode || customer.customer_code || '').trim();
  return `اسلام علیکم *${name}* صاحب،

*${companyName}* میں خوش آمدید! 🎉
آپ کی رجسٹریشن کامیابی سے مکمل ہو گئی ہے۔

🆔 آپ کا کسٹمر آئی ڈی: *${code || '-'}*
براہ کرم اسے محفوظ رکھیں — ہر آرڈر اور رابطے کے لیے یہی نمبر استعمال ہوگا۔

ہم پر اعتماد کرنے کا شکریہ۔ آپ کی خدمت ہمارے لیے باعثِ فخر ہے۔

${COMPANY_FOOTER}`;
}

/** Polite "please pay the remaining amount as soon as possible" reminder (WhatsApp only). */
export function buildReminderMessage(customer = {}, outstanding = 0, companyName = COMPANY_NAME) {
  const name = String(customer.name || '').trim() || 'صارف';
  const code = String(customer.customerCode || customer.customer_code || '').trim();
  const amount = formatRs(outstanding);
  return `اسلام علیکم *${name}* صاحب،

یہ *${companyName}* کی جانب سے ادائیگی کی یاد دہانی ہے۔

💰 آپ کے ذمے بقایا رقم: *${amount}*

براہ کرم بقایا رقم *جلد از جلد* ادا کرنے کی زحمت فرمائیں۔ آپ کے تعاون کا شکریہ۔
${code ? `\n🆔 کسٹمر آئی ڈی: ${code}\n` : ''}
${COMPANY_FOOTER}`;
}
