/**
 * Verify GAS backend connectivity (login, dashboard, orders).
 * Usage: node scripts/verify-gas.mjs [email] [password]
 */
const GAS_URL = process.env.REACT_APP_GAS_API_URL ||
  'https://script.google.com/macros/s/AKfycbxEvWjbbh0-VJ1JxKR-qFZ9TbllIyh9rAJRg1ythfihJP61o6sxvcYhHehXafZEYummLw/exec';

async function gasRequest(method, path, { data, token, params } = {}) {
  const url = new URL(GAS_URL);
  url.searchParams.set('path', path);
  if (token) url.searchParams.set('token', token);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  }

  let httpMethod = method.toUpperCase();
  if (httpMethod !== 'GET' && httpMethod !== 'POST') {
    url.searchParams.set('_method', httpMethod);
    httpMethod = 'POST';
  }

  const init = {
    method: httpMethod,
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  };
  if (data !== undefined && httpMethod === 'POST') {
    init.body = JSON.stringify(data);
  }

  const response = await fetch(url.toString(), init);
  const payload = await response.json();
  if (payload._status >= 400) {
    throw new Error(`${path} failed (${payload._status}): ${payload.message || JSON.stringify(payload)}`);
  }
  return payload;
}

async function main() {
  const email = process.argv[2] || 'admin';
  const password = process.argv[3] || 'admin123';

  console.log('GAS URL:', GAS_URL);
  console.log('Login as:', email);

  const login = await gasRequest('POST', '/auth/login', { data: { email, password } });
  if (!login.token) {
    throw new Error('Login response missing token');
  }
  console.log('✓ Login OK — user:', login.user?.name || login.user?.email);

  const stats = await gasRequest('GET', '/dashboard/stats', { token: login.token });
  console.log('✓ Dashboard stats:', stats);

  const orders = await gasRequest('GET', '/orders', { token: login.token });
  console.log('✓ Orders count:', Array.isArray(orders) ? orders.length : 0);

  console.log('\nAll GAS checks passed.');
}

main().catch((error) => {
  console.error('\nGAS verification failed:', error.message);
  process.exit(1);
});
