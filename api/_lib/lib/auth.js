const { supabase } = require('../db');

function normalizePermissions(raw) {
  if (Array.isArray(raw)) {
    return raw.map((p) => String(p || '').trim().toLowerCase()).filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((p) => String(p || '').trim().toLowerCase()).filter(Boolean);
      }
    } catch {
      return raw.split(/[,|]/).map((p) => p.trim().toLowerCase()).filter(Boolean);
    }
  }
  return [];
}

function sanitizeUser(user) {
  if (!user) return null;
  const username = String(user.username || user.email || user.id || '').trim();
  return {
    id: String(user.id || username || ''),
    username,
    name: String(user.name || '').trim(),
    email: String(user.email || username || '').trim(),
    role: String(user.role || 'Admin').trim(),
    permissions: normalizePermissions(user.permissions),
  };
}

function isActiveUser(user) {
  const status = String(user.status || 'active').trim().toLowerCase();
  return !status || ['active', 'enabled', '1', 'true'].includes(status);
}

function makeToken(user) {
  const payload = {
    id: String(user.id || user.username || user.email),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

async function validateToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    const payloadId = String(payload.id || '').toLowerCase();
    const { data: users, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return (users || []).find((u) => {
      if (!isActiveUser(u)) return false;
      const ids = [u.id, u.username, u.email]
        .map((v) => String(v || '').trim().toLowerCase())
        .filter(Boolean);
      return ids.includes(payloadId);
    }) || null;
  } catch {
    return null;
  }
}

async function handleLogin(body = {}) {
  const email = String(body.email || body.username || '').trim().toLowerCase();
  const password = String(body.password || '').trim();
  const { data: users, error } = await supabase.from('users').select('*');
  if (error) return { error: error.message };

  let user = (users || []).find((u) => {
    if (!isActiveUser(u)) return false;
    const identifiers = [u.email, u.username, u.name, u.id]
      .map((v) => String(v || '').trim().toLowerCase())
      .filter(Boolean);
    return identifiers.includes(email) && String(u.password || '').trim() === password;
  });

  if (!user) {
    // Ensure default admin exists (same as GAS)
    const adminUser = process.env.DEFAULT_ADMIN_USER || 'admin';
    const adminPass = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const existingAdmin = (users || []).find((u) =>
      [u.username, u.email].map((v) => String(v || '').toLowerCase()).includes('admin')
    );
    if (!existingAdmin) {
      await supabase.from('users').upsert({
        id: 'user_admin',
        username: adminUser,
        password: adminPass,
        name: 'Admin',
        role: 'Super Admin',
        status: 'Active',
        email: adminUser,
      });
    }
    if (email === adminUser.toLowerCase() && password === adminPass) {
      const { data: again } = await supabase.from('users').select('*');
      user = (again || []).find((u) =>
        [u.username, u.email].map((v) => String(v || '').toLowerCase()).includes(adminUser.toLowerCase())
      );
    }
  }

  if (!user) return { error: 'Invalid credentials.' };

  return {
    success: true,
    token: makeToken(user),
    user: sanitizeUser(user),
  };
}

module.exports = { sanitizeUser, isActiveUser, makeToken, validateToken, handleLogin };
