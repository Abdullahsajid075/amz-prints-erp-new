const { supabase } = require('../db');
const { id } = require('./util');

function relationMissing(err) {
  const msg = String(err?.message || err || '');
  return /relation .* does not exist|Could not find the table|schema cache/i.test(msg);
}

async function settingsItems(key) {
  const { data } = await supabase.from('settings').select('value').eq('key', key).maybeSingle();
  const val = data && data.value;
  if (Array.isArray(val)) return val;
  if (val && Array.isArray(val.items)) return val.items;
  return [];
}

async function settingsSaveItems(key, items) {
  await supabase.from('settings').upsert({
    key,
    value: { items },
    updated_at: new Date().toISOString(),
  });
}

async function listRows(table, settingsKey) {
  try {
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    if (!relationMissing(err)) throw err;
    return settingsItems(settingsKey);
  }
}

async function getRow(table, settingsKey, rid) {
  try {
    const { data, error } = await supabase.from(table).select('*').eq('id', rid).maybeSingle();
    if (!error) return data || null;
    throw error;
  } catch (err) {
    if (!relationMissing(err)) throw err;
    const items = await settingsItems(settingsKey);
    return items.find((r) => String(r.id) === String(rid)) || null;
  }
}

async function insertRow(table, settingsKey, row) {
  try {
    const { error } = await supabase.from(table).insert(row);
    if (error) throw error;
    return row;
  } catch (err) {
    if (!relationMissing(err)) throw err;
    const items = await settingsItems(settingsKey);
    items.unshift(row);
    await settingsSaveItems(settingsKey, items);
    return row;
  }
}

async function updateRow(table, settingsKey, rid, patch) {
  try {
    const { data, error } = await supabase.from(table).update(patch).eq('id', rid).select('*').maybeSingle();
    if (!error) return data;
    throw error;
  } catch (err) {
    if (!relationMissing(err)) throw err;
    const items = await settingsItems(settingsKey);
    const idx = items.findIndex((r) => String(r.id) === String(rid));
    if (idx < 0) return null;
    items[idx] = { ...items[idx], ...patch, id: rid };
    await settingsSaveItems(settingsKey, items);
    return items[idx];
  }
}

async function deleteRow(table, settingsKey, rid) {
  try {
    const { error } = await supabase.from(table).delete().eq('id', rid);
    if (error) throw error;
    return true;
  } catch (err) {
    if (!relationMissing(err)) throw err;
    const items = (await settingsItems(settingsKey)).filter((r) => String(r.id) !== String(rid));
    await settingsSaveItems(settingsKey, items);
    return true;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function taskFromBody(body = {}, rid, user) {
  const title = String(body.title || '').trim();
  return {
    id: rid || body.id || id('task'),
    title,
    description: String(body.description || '').trim(),
    assignee_id: String(body.assigneeId || body.assignee_id || '').trim(),
    assignee_name: String(body.assigneeName || body.assignee_name || '').trim(),
    priority: String(body.priority || 'Medium').trim() || 'Medium',
    status: String(body.status || 'Pending').trim() || 'Pending',
    deadline: String(body.deadline || '').trim(),
    created_by: String(body.createdBy || (user && user.id) || '').trim(),
    created_by_name: String(body.createdByName || (user && (user.name || user.username)) || '').trim(),
    updated_at: nowIso(),
  };
}

function broadcastFromBody(body = {}, rid, user) {
  return {
    id: rid || body.id || id('ad'),
    title: String(body.title || '').trim(),
    message: String(body.message || body.text || '').trim(),
    image: String(body.image || '').trim(),
    created_by: String(body.createdBy || (user && user.id) || '').trim(),
    created_by_name: String(body.createdByName || (user && (user.name || user.username)) || '').trim(),
  };
}

async function listSends(broadcastId) {
  try {
    const { data, error } = await supabase
      .from('broadcast_sends')
      .select('*')
      .eq('broadcast_id', broadcastId)
      .order('sent_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    if (!relationMissing(err)) throw err;
    return (await settingsItems('broadcast_sends')).filter((r) => String(r.broadcast_id) === String(broadcastId));
  }
}

async function insertSend(row) {
  try {
    const { error } = await supabase.from('broadcast_sends').insert(row);
    if (error) throw error;
    return row;
  } catch (err) {
    if (!relationMissing(err)) throw err;
    const items = await settingsItems('broadcast_sends');
    items.unshift(row);
    await settingsSaveItems('broadcast_sends', items);
    return row;
  }
}

module.exports = {
  listRows,
  getRow,
  insertRow,
  updateRow,
  deleteRow,
  listSends,
  insertSend,
  settingsItems,
  settingsSaveItems,
  taskFromBody,
  broadcastFromBody,
  nowIso,
  id,
};
