import { tokenStorage } from './tokenStorage';

const GAS_API_BASE_URL = process.env.REACT_APP_GAS_API_URL || '';

if (!GAS_API_BASE_URL) {
  throw new Error(
    'REACT_APP_GAS_API_URL is required. Set it in frontend/.env or Vercel environment variables.'
  );
}

/** In-memory GET cache — avoids repeat GAS round-trips while navigating. */
const getCache = new Map();
const GET_CACHE_TTL_MS = 120000;

/** Soft logout callback (AuthContext). Never hard-reload the page. */
let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null;
}

function cacheGet(key) {
  const hit = getCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > GET_CACHE_TTL_MS) {
    getCache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key, value) {
  getCache.set(key, { at: Date.now(), value });
}

export function clearGasCache() {
  getCache.clear();
}

function stripStatus(payload) {
  if (!payload || typeof payload !== 'object' || payload._status === undefined) {
    return payload;
  }
  const { _status, ...rest } = payload;
  return rest;
}

function isLoginPath() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname || '';
  return path === '/login' || path.endsWith('/login') || /\/login\/?$/.test(path);
}

function handleUnauthorized(path) {
  const apiPath = path.startsWith('/') ? path : `/${path}`;

  // Never treat public/login API failures as session expiry
  if (apiPath === '/auth/login' || apiPath.startsWith('/public/')) {
    return;
  }

  // On login page: ignore completely (no state thrash, no navigation)
  if (isLoginPath()) {
    return;
  }

  tokenStorage.clear();
  getCache.clear();

  // Soft logout only — never hard-reload
  if (unauthorizedHandler) {
    try {
      unauthorizedHandler();
    } catch {
      /* ignore */
    }
  }
}

async function fetchOnce(url, init) {
  let response;
  try {
    response = await fetch(url, init);
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
    const preview = String(text || '').slice(0, 120).replace(/\s+/g, ' ');
    const isGoogleHtml = /<!DOCTYPE html|/i.test(text) || /unable to open the file/i.test(text);
    throw {
      response: {
        status: 502,
        data: {
          message: isGoogleHtml
            ? 'Google Apps Script temporarily returned an error page. Wait a few seconds and try again. If it keeps failing, open the Web App URL in a browser and check Deploy → Manage deployments (Execute as: Me, Who has access: Anyone).'
            : (preview
              ? `Unexpected backend response: ${preview}`
              : 'Empty response from Google Apps Script. Check Web App deployment.'),
        },
      },
    };
  }
  return { response, payload };
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

  const cacheKey = httpMethod === 'GET' ? url.toString() : null;
  if (cacheKey) {
    const cached = cacheGet(cacheKey);
    if (cached) return cached;
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

  let resultPair;
  try {
    resultPair = await fetchOnce(url.toString(), init);
  } catch (err) {
    await new Promise((r) => setTimeout(r, 350));
    resultPair = await fetchOnce(url.toString(), init);
  }

  const { response, payload } = resultPair;
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

  const result = {
    data: stripStatus(payload),
    status: response.status,
  };

  if (cacheKey) {
    cacheSet(cacheKey, result);
  } else {
    getCache.clear();
  }

  return result;
}

export function withToken(options = {}) {
  const token = tokenStorage.getToken();
  return token ? { ...options, token } : options;
}

export { GAS_API_BASE_URL };
