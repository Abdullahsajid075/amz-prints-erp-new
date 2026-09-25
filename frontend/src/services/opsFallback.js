import { gasRequest, withToken } from './gasClient';

const TASK_KEY = 'internal_tasks';
const AD_KEY = 'broadcasts';

/** undefined = unknown, true = live API has the route, false = use settings bags */
const nativeOk = {
  tasks: undefined,
  broadcasts: undefined,
};

const writeQueue = {
  [TASK_KEY]: Promise.resolve(),
  [AD_KEY]: Promise.resolve(),
};

function isMissingRoute(err, resource) {
  const status = Number(err?.response?.status || 0);
  const msg = String(err?.response?.data?.message || err?.message || '');
  const pathHint = resource === 'tasks' ? '/tasks' : '/broadcasts';
  if (/not\s*found\s*:\s*\/(tasks|broadcasts)/i.test(msg)) return true;
  if (status === 404 && new RegExp(`not\\s*found.*${pathHint}`, 'i').test(msg)) return true;
  return false;
}

function httpError(message, status = 400) {
  const err = { response: { status, data: { message } } };
  throw err;
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeTask(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    id: row.id,
    title: row.title || '',
    description: row.description || '',
    assigneeId: row.assigneeId || row.assignee_id || '',
    assigneeName: row.assigneeName || row.assignee_name || '',
    priority: row.priority || 'Medium',
    status: row.status || 'Pending',
    deadline: row.deadline || '',
    createdBy: row.createdBy || row.created_by || '',
    createdByName: row.createdByName || row.created_by_name || '',
    createdAt: row.createdAt || row.created_at || '',
    updatedAt: row.updatedAt || row.updated_at || '',
  };
}

function normalizeSend(row) {
  if (!row || typeof row !== 'object') return null;
  return {
    id: row.id,
    broadcastId: row.broadcastId || row.broadcast_id || '',
    customerId: row.customerId || row.customer_id || '',
    customerName: row.customerName || row.customer_name || '',
    customerPhone: row.customerPhone || row.customer_phone || '',
    status: row.status || 'opened',
    sentAt: row.sentAt || row.sent_at || row.created_at || '',
  };
}

function normalizeBroadcast(row) {
  if (!row || typeof row !== 'object') return null;
  const sends = Array.isArray(row.sends) ? row.sends.map(normalizeSend).filter(Boolean) : [];
  return {
    id: row.id,
    title: row.title || '',
    message: row.message || row.text || '',
    image: row.image || '',
    createdBy: row.createdBy || row.created_by || '',
    createdByName: row.createdByName || row.created_by_name || '',
    createdAt: row.createdAt || row.created_at || '',
    sends,
    sendCount: sends.length,
  };
}

function bagItems(settings, key) {
  const val = settings && settings[key];
  if (Array.isArray(val)) return val.slice();
  if (val && Array.isArray(val.items)) return val.items.slice();
  return [];
}

async function getSettings() {
  const res = await gasRequest('GET', '/settings', withToken({ params: { _: Date.now() } }));
  return res.data && typeof res.data === 'object' ? res.data : {};
}

async function saveBag(key, items) {
  await gasRequest('PUT', '/settings', withToken({ data: { [key]: { items } } }));
}

function enqueueWrite(key, fn) {
  const next = writeQueue[key].then(fn, fn);
  writeQueue[key] = next.catch(() => {});
  return next;
}

async function mutateBag(key, mutator) {
  return enqueueWrite(key, async () => {
    const settings = await getSettings();
    const items = bagItems(settings, key);
    const result = mutator(items);
    await saveBag(key, items);
    return result;
  });
}

async function tryNative(resource, request) {
  if (nativeOk[resource] === false) return null;
  try {
    const result = await request();
    nativeOk[resource] = true;
    return result;
  } catch (err) {
    if (nativeOk[resource] === true) throw err;
    if (isMissingRoute(err, resource)) {
      nativeOk[resource] = false;
      return null;
    }
    throw err;
  }
}

function ok(data) {
  return { data, status: 200 };
}

export const tasksAPI = {
  getAll: async (params) => {
    const native = await tryNative('tasks', () => gasRequest('GET', '/tasks', withToken({ params })));
    if (native) return native;
    const items = bagItems(await getSettings(), TASK_KEY).map(normalizeTask).filter(Boolean);
    return ok(items);
  },

  getById: async (id) => {
    const native = await tryNative('tasks', () => gasRequest('GET', `/tasks/${id}`, withToken()));
    if (native) return native;
    const found = bagItems(await getSettings(), TASK_KEY)
      .map(normalizeTask)
      .find((t) => t && String(t.id) === String(id));
    if (!found) httpError('Task not found', 404);
    return ok(found);
  },

  create: async (data) => {
    const native = await tryNative('tasks', () => gasRequest('POST', '/tasks', withToken({ data })));
    if (native) return native;
    const title = String(data?.title || '').trim();
    if (!title) httpError('Task title is required', 400);
    const row = normalizeTask({
      ...data,
      id: data?.id || newId('task'),
      title,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    await mutateBag(TASK_KEY, (items) => {
      items.unshift(row);
      return row;
    });
    return ok(row);
  },

  update: async (id, data) => {
    const native = await tryNative('tasks', () => gasRequest('PUT', `/tasks/${id}`, withToken({ data })));
    if (native) return native;
    const updated = await mutateBag(TASK_KEY, (items) => {
      const idx = items.findIndex((r) => String(r.id) === String(id));
      if (idx < 0) httpError('Task not found', 404);
      const next = normalizeTask({
        ...items[idx],
        ...data,
        id,
        createdAt: items[idx].createdAt || items[idx].created_at,
        createdBy: items[idx].createdBy || items[idx].created_by,
        createdByName: items[idx].createdByName || items[idx].created_by_name,
        updatedAt: nowIso(),
      });
      items[idx] = next;
      return next;
    });
    return ok(updated);
  },

  updateStatus: async (id, status) => {
    const native = await tryNative('tasks', () => (
      gasRequest('PATCH', `/tasks/${id}/status`, withToken({ data: { status } }))
    ));
    if (native) return native;
    const value = String(status || '').trim();
    if (!value) httpError('Status is required', 400);
    const updated = await mutateBag(TASK_KEY, (items) => {
      const idx = items.findIndex((r) => String(r.id) === String(id));
      if (idx < 0) httpError('Task not found', 404);
      const next = normalizeTask({ ...items[idx], status: value, updatedAt: nowIso() });
      items[idx] = next;
      return next;
    });
    return ok(updated);
  },

  delete: async (id) => {
    const native = await tryNative('tasks', () => gasRequest('DELETE', `/tasks/${id}`, withToken()));
    if (native) return native;
    await mutateBag(TASK_KEY, (items) => {
      const next = items.filter((r) => String(r.id) !== String(id));
      items.splice(0, items.length, ...next);
      return { success: true };
    });
    return ok({ success: true });
  },
};

export const broadcastsAPI = {
  getAll: async (params) => {
    const native = await tryNative('broadcasts', () => gasRequest('GET', '/broadcasts', withToken({ params })));
    if (native) return native;
    const items = bagItems(await getSettings(), AD_KEY).map(normalizeBroadcast).filter(Boolean);
    return ok(items);
  },

  getById: async (id) => {
    const native = await tryNative('broadcasts', () => gasRequest('GET', `/broadcasts/${id}`, withToken()));
    if (native) return native;
    const found = bagItems(await getSettings(), AD_KEY)
      .map(normalizeBroadcast)
      .find((a) => a && String(a.id) === String(id));
    if (!found) httpError('Advertisement not found', 404);
    return ok(found);
  },

  create: async (data) => {
    const native = await tryNative('broadcasts', () => gasRequest('POST', '/broadcasts', withToken({ data })));
    if (native) return native;
    const message = String(data?.message || data?.text || '').trim();
    if (!message) httpError('Advertisement text is required', 400);
    const row = normalizeBroadcast({
      ...data,
      id: data?.id || newId('ad'),
      message,
      createdAt: nowIso(),
      sends: [],
    });
    await mutateBag(AD_KEY, (items) => {
      items.unshift(row);
      return row;
    });
    return ok(row);
  },

  update: async (id, data) => {
    const native = await tryNative('broadcasts', () => gasRequest('PUT', `/broadcasts/${id}`, withToken({ data })));
    if (native) return native;
    const updated = await mutateBag(AD_KEY, (items) => {
      const idx = items.findIndex((r) => String(r.id) === String(id));
      if (idx < 0) httpError('Advertisement not found', 404);
      const next = normalizeBroadcast({
        ...items[idx],
        ...data,
        id,
        createdAt: items[idx].createdAt || items[idx].created_at,
        createdBy: items[idx].createdBy || items[idx].created_by,
        createdByName: items[idx].createdByName || items[idx].created_by_name,
        sends: data?.sends != null ? data.sends : (items[idx].sends || []),
      });
      items[idx] = next;
      return next;
    });
    return ok(updated);
  },

  delete: async (id) => {
    const native = await tryNative('broadcasts', () => gasRequest('DELETE', `/broadcasts/${id}`, withToken()));
    if (native) return native;
    await mutateBag(AD_KEY, (items) => {
      const next = items.filter((r) => String(r.id) !== String(id));
      items.splice(0, items.length, ...next);
      return { success: true };
    });
    return ok({ success: true });
  },

  listSends: async (id) => {
    const native = await tryNative('broadcasts', () => gasRequest('GET', `/broadcasts/${id}/sends`, withToken()));
    if (native) return native;
    const found = bagItems(await getSettings(), AD_KEY)
      .map(normalizeBroadcast)
      .find((a) => a && String(a.id) === String(id));
    if (!found) httpError('Advertisement not found', 404);
    return ok(found.sends || []);
  },

  logSend: async (id, data) => {
    const native = await tryNative('broadcasts', () => (
      gasRequest('POST', `/broadcasts/${id}/send`, withToken({ data }))
    ));
    if (native) return native;
    const send = normalizeSend({
      id: newId('adsend'),
      broadcastId: id,
      customerId: data?.customerId || data?.customer_id || '',
      customerName: data?.customerName || data?.customer_name || '',
      customerPhone: data?.customerPhone || data?.customer_phone || '',
      status: data?.status || 'opened',
      sentAt: nowIso(),
    });
    await mutateBag(AD_KEY, (items) => {
      const idx = items.findIndex((r) => String(r.id) === String(id));
      if (idx < 0) httpError('Advertisement not found', 404);
      const current = normalizeBroadcast(items[idx]);
      current.sends = [send, ...(current.sends || [])];
      current.sendCount = current.sends.length;
      items[idx] = current;
      return send;
    });
    return ok(send);
  },

  sendWhatsApp: async (id, data) => {
    const native = await tryNative('broadcasts', () => (
      gasRequest('POST', `/broadcasts/${id}/whatsapp`, withToken({ data }))
    ));
    if (native) return native;
    return ok({
      ok: false,
      imageSent: false,
      reason: 'not_configured',
      cloudConfigured: false,
    });
  },
};
