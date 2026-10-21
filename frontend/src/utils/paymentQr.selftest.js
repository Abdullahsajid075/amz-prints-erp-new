import {
  PAYMENT_QR_ACCOUNT_NAME,
  DEFAULT_PAYMENT_QR_DATA_URL,
  paymentQrUrl,
  paymentQrAccountName,
  paymentQrEnabled,
  shouldShowPaymentQr,
  paymentQrBlockHtml,
} from './paymentQr.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(DEFAULT_PAYMENT_QR_DATA_URL.startsWith('data:image/png;base64,'), 'default QR is an inline PNG data URL');
assert(DEFAULT_PAYMENT_QR_DATA_URL.length > 1000, 'default QR data is actually embedded, not a stub');

// paymentQrUrl / paymentQrAccountName — override vs. built-in default
assert(paymentQrUrl({}) === DEFAULT_PAYMENT_QR_DATA_URL, 'no override uses the default QR image');
assert(paymentQrUrl({ paymentQr: 'data:image/png;base64,CUSTOM' }) === 'data:image/png;base64,CUSTOM', 'company override wins');
assert(paymentQrAccountName({}) === PAYMENT_QR_ACCOUNT_NAME, 'no override uses the default account name');
assert(paymentQrAccountName({ paymentQrAccountName: '  Acme Co  ' }) === 'Acme Co', 'account name override is trimmed');
assert(paymentQrAccountName({ paymentQrAccountName: '   ' }) === PAYMENT_QR_ACCOUNT_NAME, 'blank override falls back to default');

// paymentQrEnabled — only an explicit false turns it off (matches showQR/showStamp convention)
assert(paymentQrEnabled({}) === true, 'enabled by default');
assert(paymentQrEnabled({ showPaymentQr: true }) === true, 'enabled when explicitly true');
assert(paymentQrEnabled({ showPaymentQr: false }) === false, 'disabled when explicitly false');

// shouldShowPaymentQr — gated on both the toggle AND a real pending balance
assert(shouldShowPaymentQr(0, {}) === false, 'fully paid — no QR');
assert(shouldShowPaymentQr(-5, {}) === false, 'negative/overpaid — no QR');
assert(shouldShowPaymentQr(0.001, {}) === false, 'rounding noise under 1 paisa — no QR');
assert(shouldShowPaymentQr(500, {}) === true, 'balance due — show QR');
assert(shouldShowPaymentQr(500, { showPaymentQr: false }) === false, 'toggle off wins even with a balance due');
assert(shouldShowPaymentQr('500', {}) === true, 'numeric-looking string balance still works');

// paymentQrBlockHtml — the HTML-string print builders (POS/order/delivery slips)
assert(paymentQrBlockHtml({}, 0) === '', 'no balance due -> empty snippet');
assert(paymentQrBlockHtml({ showPaymentQr: false }, 500) === '', 'toggle off -> empty snippet');
const html = paymentQrBlockHtml({}, 500);
assert(html.includes('Scan to Pay'), 'default label present');
assert(html.includes(PAYMENT_QR_ACCOUNT_NAME), 'default account name present');
assert(html.includes(DEFAULT_PAYMENT_QR_DATA_URL), 'default QR image embedded as the <img> src');

const customHtml = paymentQrBlockHtml(
  { paymentQrAccountName: 'Ali & Sons <Bros>' },
  500,
  { label: 'Pay Now' }
);
assert(customHtml.includes('Pay Now'), 'custom label honoured');
assert(customHtml.includes('Ali &amp; Sons &lt;Bros&gt;'), 'account name HTML-escaped');
assert(!customHtml.includes('<Bros>'), 'raw unescaped markup never leaks into the printed HTML');

console.log('paymentQr ok');
