import { tokenStorage } from './tokenStorage';

const GAS_API_BASE_URL = process.env.REACT_APP_GAS_API_URL || '';

if (!GAS_API_BASE_URL) {
  throw new Error(
    'REACT_APP_GAS_API_URL is required. Set it in frontend/.env or Vercel environment variables.'
  );
}

function stripStatus(payload) {
  if (!payload || typeof payload !== 'object' || payload._status === undefined) {
    return payload;
  }
  const { _status, ...rest } = payload;
  return rest;
}

function handleUnauthorized(path) {
  if (path !== '/auth/login') {
    tokenStorage.clear();
    window.location.href = '/login';
  }
}

export async function gasRequest(method, path, options = {}) {
  const { data, params = {}, token } = options;
  const apiPath = path.startsWith('/') ? path : `/${path}`;

  const url = new URL(GAS_API_BASE_URL);
  url.searchParams.set('path', apiPath);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && key !== 'path') {
      url.searchParams.set(key, String(value));
    }
  });

  if (token) {
    url.searchParams.set('token', token);
  }

  let httpMethod = method.toUpperCase();
  if (httpMethod !== 'GET' && httpMethod !== 'POST') {
    url.searchParams.set('_method', httpMethod);
    httpMethod = 'POST';
  }

  const init = {
    method: httpMethod,
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
  };

  if (data !== undefined && httpMethod === 'POST') {
    init.body = JSON.stringify(data);
  }

  let response;
  try {
    response = await fetch(url.toString(), init);
  } catch (error) {
    throw {
      code: 'ERR_NETWORK',
      message: error.message || 'Network Error',
      response: { data: { message: 'Unable to reach Google Apps Script backend.' } },
    };
  }

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    throw {
      response: {
        status: 502,
        data: { message: 'Backend returned invalid JSON.' },
      },
    };
  }

  const appStatus = payload._status;
  if (appStatus >= 400) {
    if (appStatus === 401) {
      handleUnauthorized(apiPath);
    }
    throw {
      response: {
        status: appStatus,
        data: stripStatus(payload),
      },
    };
  }

  return {
    data: stripStatus(payload),
    status: response.status,
  };
}

export function withToken(options = {}) {
  const token = tokenStorage.getToken();
  return token ? { ...options, token } : options;
}

export { GAS_API_BASE_URL };
