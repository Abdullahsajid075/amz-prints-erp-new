import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { settingsAPI, usersAPI, employeesAPI } from '@/services/api';
import { clearGasCache } from '@/services/gasClient';
import { useBrand } from '@/context/BrandContext';
import {
  DEFAULT_WHATSAPP_TEMPLATES,
  DEFAULT_EMAIL_SUBJECTS,
  sendTestEmail,
  openWhatsAppChat,
} from '@/services/notifications';
import { Save, Building2, FileText, Palette, Users, ShoppingCart, Package, UserCog, CreditCard, Bell, Shield, Database, Trash2, Plus, X, Edit, Mail, Kanban, KeyRound } from 'lucide-react';
import { WhatsAppIcon } from '@/components/shared/WhatsAppIcon';
import { toast } from 'sonner';
import { DEFAULT_CRM_STAGES } from '@/utils/crmStages';
import { getAssignableModules, hasFullAccess, normalizePermissions } from '@/utils/permissions';

const defaultSettings = {
  company: { name: 'Amazon Printing Services', tagline: 'Professional Printing & Advertising Services', address: 'King Road, Mandi Bahauddin', phone: '', email: 'amazonprinting@gmail.com', website: 'amzprints.com', taxId: '', authorizedSignatory: 'Authorized Person', logo: '', stamp: '', signature: '' },
  invoice: { prefix: 'INV-', taxRate: 0, terms: 'Payment due within 30 days.', showQR: true, showStamp: true, showSignature: true, template: 'classic' },
  theme: { primary: '#F26522', secondary: '#2E2E2E', accent: '#10B981' },
  orders: { autoNumber: true, orderPrefix: 'ORD-', defaultStatus: 'Order Received', requireDeliveryDate: true },
  customers: { autoCode: true, codePrefix: 'CUST-', creditLimit: 50000, requirePhone: true },
  crm: { stages: DEFAULT_CRM_STAGES },
  products: { defaultUnit: 'per piece', trackStock: true, allowNegativeStock: false, categories: ['Business Cards', 'Flyers', 'Banners'] },
  designers: { assignAuto: false, trackHours: true, showWorkload: true },
  employees: { attendanceEnabled: true, salaryPeriod: 'monthly' },
  payments: { methods: [{ name: 'Cash', enabled: true }, { name: 'Bank Transfer', enabled: true }, { name: 'UPI', enabled: true }, { name: 'Card', enabled: true }, { name: 'Cheque', enabled: true }] },
  users: {
    roles: ['Super Admin', 'Admin', 'Manager', 'Sales', 'Designer', 'Production', 'Accounts', 'Cashier'],
    passwordPolicy: 'strong',
    sessionTimeout: 60,
    /** Optional local mirror — login still uses Users sheet via usersAPI */
    accounts: [],
  },
  notifications: {
    emailNewOrder: true,
    emailOrderStatus: true,
    emailInvoice: true,
    emailReady: true,
    emailDelivered: true,
    emailPayment: true,
    emailToken: true,
    smsEnabled: false,
    whatsappEnabled: true,
    autoOpenWhatsApp: true,
    whatsappTemplates: {},
    emailSubjects: {},
  },
  system: { currency: 'PKR', dateFormat: 'DD MMM YYYY', backupEnabled: true, backupFrequency: 'daily' }
};

const emptyUser = { username: '', password: '', name: '', role: 'Sales', status: 'Active', permissions: [], employeeId: '' };
const ASSIGNABLE_MODULES = getAssignableModules();

const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Resize image for Sheets cell size.
 * forcePng=true keeps alpha (JPEG conversion was painting transparent pixels black).
 */
async function compressImageFile(file, { maxEdge = 360, quality = 0.78, forcePng = false } = {}) {
  const dataUrl = await readFileAsDataURL(file);
  const keepAlpha = forcePng
    || /png|webp|gif/i.test(file.type || '')
    || /\.(png|webp|gif)$/i.test(file.name || '');

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { alpha: true });
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(keepAlpha ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

const SETTINGS_CACHE_KEY = 'amz_erp_settings_v1';

function parseMaybeJson(value) {
  if (value == null) return value;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return value;
  const s = value.trim();
  if ((s.startsWith('{') || s.startsWith('[')) && s.length > 1) {
    try { return JSON.parse(s); } catch { return null; }
  }
  return value;
}

function mergeSettingsFromApi(data) {
  if (!data || typeof data !== 'object') return { ...defaultSettings };
  const section = (key) => {
    const raw = parseMaybeJson(data[key]);
    return {
      ...defaultSettings[key],
      ...(raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}),
    };
  };
  const company = section('company');
  const pickImg = (topKey, nested) =>
    (Object.prototype.hasOwnProperty.call(data, topKey) ? (data[topKey] || '') : (nested || ''));
  const logo = pickImg('companyLogo', company.logo);
  const stamp = pickImg('companyStamp', company.stamp);
  const signature = pickImg('companySignature', company.signature);
  return {
    ...defaultSettings,
    company: { ...company, logo, stamp, signature },
    invoice: section('invoice'),
    theme: section('theme'),
    orders: section('orders'),
    customers: section('customers'),
    crm: (() => {
      const raw = parseMaybeJson(data.crm);
      const base = { ...defaultSettings.crm };
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        return {
          ...base,
          ...raw,
          stages: Array.isArray(raw.stages) && raw.stages.length ? raw.stages : base.stages,
        };
      }
      return base;
    })(),
    products: section('products'),
    designers: section('designers'),
    employees: section('employees'),
    payments: section('payments'),
    users: section('users'),
    notifications: section('notifications'),
    system: section('system'),
  };
}

const Settings = () => {
  const { refreshBrand, primary } = useBrand();
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
      if (cached) return mergeSettingsFromApi(JSON.parse(cached));
    } catch { /* ignore */ }
    return defaultSettings;
  });
  const [saving, setSaving] = useState(false);
  const [newMethod, setNewMethod] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newRole, setNewRole] = useState('');
  const [sheetUsers, setSheetUsers] = useState([]);
  const [hrEmployees, setHrEmployees] = useState([]);
  const [userForm, setUserForm] = useState(emptyUser);
  const [editingUserId, setEditingUserId] = useState(null);
  const [usersLoading, setUsersLoading] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const res = await settingsAPI.get();
      if (res.data && Object.keys(res.data).length) {
        const merged = mergeSettingsFromApi(res.data);
        setSettings(merged);
        try { localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(merged)); } catch { /* quota */ }
      }
    } catch (err) {
      console.error('Failed to load settings', err);
      toast.error(err.response?.data?.message || 'Failed to load settings');
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const [usersRes, empRes] = await Promise.all([
        usersAPI.getAll(),
        employeesAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setSheetUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setHrEmployees(Array.isArray(empRes.data) ? empRes.data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users from Users sheet');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const save = async () => {
    setSaving(true);
    try {
      const company = { ...(settings.company || {}) };
      const companyLogo = company.logo || '';
      const companyStamp = company.stamp || '';
      const companySignature = company.signature || '';
      // Keep company JSON small — logo/stamp/signature as separate keys
      const payload = {
        ...settings,
        company: { ...company, logo: '', stamp: '', signature: '' },
        companyLogo,
        companyStamp,
        companySignature,
      };
      const res = await settingsAPI.update(payload);
      clearGasCache();
      const saved = mergeSettingsFromApi(res.data && Object.keys(res.data).length ? res.data : payload);
      setSettings(saved);
      try { localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(saved)); } catch { /* quota */ }
      await refreshBrand();
      if (Array.isArray(res.data?._warnings) && res.data._warnings.length) {
        toast.message(`Saved with warnings: ${res.data._warnings.join(', ')}`);
      } else {
        toast.success('Settings saved permanently to Google Sheets');
      }
      // Re-fetch to confirm persistence
      await loadSettings();
    } catch (e) {
      console.error(e);
      toast.error(e.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const update = (section, field, value) =>
    setSettings({ ...settings, [section]: { ...settings[section], [field]: value } });

  const onImagePick = async (field, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    try {
      const dataUrl = await compressImageFile(file, { forcePng: true, maxEdge: 360 });
      update('company', field, dataUrl);
      const labels = { logo: 'Logo', stamp: 'Stamp', signature: 'Signature' };
      toast.success(`${labels[field] || field} ready — click Save Settings`);
    } catch {
      toast.error('Failed to read file');
    }
  };

  const saveUser = async () => {
    if (!userForm.username.trim()) {
      toast.error('Username required');
      return;
    }
    try {
      const payload = {
        username: userForm.username.trim(),
        password: userForm.password,
        name: userForm.name || userForm.username,
        role: userForm.role,
        status: userForm.status,
        permissions: userForm.permissions || [],
        employeeId: userForm.employeeId || '',
      };
      if (editingUserId) {
        await usersAPI.update(editingUserId, payload);
        toast.success('User updated (Users sheet)');
      } else {
        if (!payload.password) {
          toast.error('Password required for new user');
          return;
        }
        await usersAPI.create(payload);
        toast.success('User created (Users sheet — used for login)');
      }
      setUserForm(emptyUser);
      setEditingUserId(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    }
  };

  const editUser = (u) => {
    setEditingUserId(u.id || u.username);
    setUserForm({
      username: u.username || '',
      password: '',
      name: u.name || '',
      role: u.role || 'Sales',
      status: u.status || 'Active',
      permissions: normalizePermissions(u.permissions),
      employeeId: u.employeeId || '',
    });
  };

  const toggleUserModule = (moduleKey) => {
    const key = String(moduleKey).toLowerCase();
    setUserForm((prev) => {
      const current = normalizePermissions(prev.permissions);
      const next = current.includes(key)
        ? current.filter((m) => m !== key)
        : [...current, key];
      return { ...prev, permissions: next };
    });
  };

  const selectAllModules = () => {
    setUserForm((prev) => ({
      ...prev,
      permissions: ASSIGNABLE_MODULES.map((m) => m.key),
    }));
  };

  const clearAllModules = () => {
    setUserForm((prev) => ({ ...prev, permissions: [] }));
  };

  const grantLoginFromEmployee = (emp) => {
    const linked = sheetUsers.find((u) => String(u.employeeId || '') === String(emp.id));
    if (linked) {
      editUser(linked);
      toast.message(`${emp.name} already has login — edit below`);
      return;
    }
    const uname = String(emp.email || emp.phone || emp.name || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._@-]+/g, '')
      .slice(0, 32) || `emp_${String(emp.id).slice(-6)}`;
    setEditingUserId(null);
    setUserForm({
      ...emptyUser,
      username: uname,
      password: '',
      name: emp.name || '',
      role: emp.role || 'Sales',
      status: 'Active',
      employeeId: emp.id || '',
    });
    toast.message(`Set a password for ${emp.name}, then click Add User`);
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Delete user ${u.username}?`)) return;
    try {
      await usersAPI.delete(u.id || u.username);
      toast.success('User deleted');
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>Settings</h1>
          <p className="text-gray-600 mt-1">Complete system configuration & preferences</p>
        </div>
        <Button onClick={save} style={{ backgroundColor: primary || '#F26522' }} className="text-white" disabled={saving} data-testid="save-settings-button">
          <Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>

      <Tabs defaultValue="company" onValueChange={(v) => { if (v === 'users') loadUsers(); }}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7 h-auto">
          <TabsTrigger value="company"><Building2 className="h-4 w-4 mr-1" />Company</TabsTrigger>
          <TabsTrigger value="invoice"><FileText className="h-4 w-4 mr-1" />Invoice</TabsTrigger>
          <TabsTrigger value="theme"><Palette className="h-4 w-4 mr-1" />Theme</TabsTrigger>
          <TabsTrigger value="modules"><ShoppingCart className="h-4 w-4 mr-1" />Modules</TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" />Users</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-1" />Notifications</TabsTrigger>
          <TabsTrigger value="system"><Database className="h-4 w-4 mr-1" />System</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card><CardHeader><CardTitle>Company Profile</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Company Name *</Label><Input value={settings.company.name} onChange={(e) => update('company', 'name', e.target.value)} /></div>
              <div><Label>Tagline</Label><Input value={settings.company.tagline} onChange={(e) => update('company', 'tagline', e.target.value)} /></div>
              <div className="md:col-span-2"><Label>Address</Label><Textarea value={settings.company.address} onChange={(e) => update('company', 'address', e.target.value)} rows={2} /></div>
              <div><Label>Phone</Label><Input value={settings.company.phone} onChange={(e) => update('company', 'phone', e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" value={settings.company.email} onChange={(e) => update('company', 'email', e.target.value)} /></div>
              <div><Label>Website</Label><Input value={settings.company.website} onChange={(e) => update('company', 'website', e.target.value)} /></div>
              <div><Label>Tax ID / GST</Label><Input value={settings.company.taxId} onChange={(e) => update('company', 'taxId', e.target.value)} /></div>
              <div><Label>Authorized Signatory</Label><Input value={settings.company.authorizedSignatory} onChange={(e) => update('company', 'authorizedSignatory', e.target.value)} /></div>
              <div>
                <Label>Logo (PNG preferred — transparent background kept)</Label>
                <Input type="file" accept="image/png,image/webp,image/gif,image/*" onChange={(e) => onImagePick('logo', e.target.files?.[0])} data-testid="logo-file-input" />
                <p className="text-xs text-gray-500 mt-1">Re-upload your PNG after this fix if the old logo still shows a black background.</p>
                {settings.company.logo && (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={settings.company.logo}
                      alt="Logo preview"
                      className="h-14 object-contain border rounded p-1 bg-[linear-gradient(45deg,#eee_25%,transparent_25%),linear-gradient(-45deg,#eee_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#eee_75%),linear-gradient(-45deg,transparent_75%,#eee_75%)] bg-[length:12px_12px] bg-[position:0_0,0_6px,6px_-6px,-6px_0]"
                    />
                    <Button type="button" size="sm" variant="ghost" onClick={() => update('company', 'logo', '')}>Clear</Button>
                  </div>
                )}
              </div>
              <div>
                <Label>Stamp (image file → saved as Data URL)</Label>
                <Input type="file" accept="image/*" onChange={(e) => onImagePick('stamp', e.target.files?.[0])} data-testid="stamp-file-input" />
                {settings.company.stamp && (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={settings.company.stamp} alt="Stamp preview" className="h-14 object-contain border rounded p-1" />
                    <Button type="button" size="sm" variant="ghost" onClick={() => update('company', 'stamp', '')}>Clear</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice">
          <Card><CardHeader><CardTitle>Invoice Customization</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Prefix</Label><Input value={settings.invoice.prefix} onChange={(e) => update('invoice', 'prefix', e.target.value)} /></div>
                <div><Label>Tax Rate (%)</Label><Input type="number" value={settings.invoice.taxRate} onChange={(e) => update('invoice', 'taxRate', parseFloat(e.target.value) || 0)} /></div>
              </div>
              <div>
                <Label>Invoice Template</Label>
                <Select value={settings.invoice.template || 'classic'} onValueChange={(v) => update('invoice', 'template', v)}>
                  <SelectTrigger data-testid="invoice-template-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Terms & Conditions</Label><Textarea rows={5} value={settings.invoice.terms} onChange={(e) => update('invoice', 'terms', e.target.value)} /></div>

              <div className="rounded-xl border border-orange-100 p-4 space-y-4" style={{ backgroundColor: '#FFF9F5' }}>
                <p className="text-sm font-semibold" style={{ color: '#2E2E2E' }}>Authorized Signature & Stamp (shown on invoices)</p>
                <div>
                  <Label>Authorized Person Name *</Label>
                  <Input
                    value={settings.company.authorizedSignatory || ''}
                    onChange={(e) => update('company', 'authorizedSignatory', e.target.value)}
                    placeholder="e.g. Muhammad Ali / Director"
                    data-testid="invoice-signatory-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">This name appears under the signature on every invoice.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Signature Image (optional)</Label>
                    <Input type="file" accept="image/*" onChange={(e) => onImagePick('signature', e.target.files?.[0])} data-testid="signature-file-input" />
                    {settings.company.signature ? (
                      <div className="mt-2 flex items-center gap-3">
                        <img src={settings.company.signature} alt="Signature" className="h-14 object-contain border rounded p-1 bg-white" />
                        <Button type="button" size="sm" variant="ghost" onClick={() => update('company', 'signature', '')}>Clear</Button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">Upload handwritten signature PNG. If empty, name text is used.</p>
                    )}
                  </div>
                  <div>
                    <Label>Company Stamp Image *</Label>
                    <Input type="file" accept="image/*" onChange={(e) => onImagePick('stamp', e.target.files?.[0])} data-testid="invoice-stamp-file-input" />
                    {settings.company.stamp ? (
                      <div className="mt-2 flex items-center gap-3">
                        <img src={settings.company.stamp} alt="Stamp" className="h-14 object-contain border rounded p-1 bg-white" />
                        <Button type="button" size="sm" variant="ghost" onClick={() => update('company', 'stamp', '')}>Clear</Button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">Upload stamp — save settings, then open any invoice to verify.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4 border rounded-lg">
                <p className="text-sm font-semibold">Invoice Elements</p>
                {[{ k: 'showQR', l: 'Show QR Code' }, { k: 'showStamp', l: 'Show Company Stamp' }, { k: 'showSignature', l: 'Show Signature' }].map(o => (
                  <div key={o.k} className="flex items-center justify-between">
                    <Label>{o.l}</Label>
                    <Switch checked={settings.invoice[o.k]} onCheckedChange={(v) => update('invoice', o.k, v)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme">
          <Card><CardHeader><CardTitle>Theme & Branding</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {['primary', 'secondary', 'accent'].map(k => (
                  <div key={k}>
                    <Label className="capitalize">{k} Color</Label>
                    <div className="flex items-center gap-2">
                      <Input type="color" value={settings.theme[k]} onChange={(e) => update('theme', k, e.target.value)} className="w-16 h-10" />
                      <Input value={settings.theme[k]} onChange={(e) => update('theme', k, e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules">
          <div className="space-y-4">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" />Orders</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div><Label>Order Prefix</Label><Input value={settings.orders.orderPrefix} onChange={(e) => update('orders', 'orderPrefix', e.target.value)} /></div>
                <div><Label>Default Status</Label><Input value={settings.orders.defaultStatus} onChange={(e) => update('orders', 'defaultStatus', e.target.value)} /></div>
                <div className="flex items-center justify-between"><Label>Auto-generate numbers</Label><Switch checked={settings.orders.autoNumber} onCheckedChange={(v) => update('orders', 'autoNumber', v)} /></div>
                <div className="flex items-center justify-between"><Label>Require delivery date</Label><Switch checked={settings.orders.requireDeliveryDate} onCheckedChange={(v) => update('orders', 'requireDeliveryDate', v)} /></div>
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Customers</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div><Label>Code Prefix</Label><Input value={settings.customers.codePrefix} onChange={(e) => update('customers', 'codePrefix', e.target.value)} /></div>
                <div><Label>Credit Limit</Label><Input type="number" value={settings.customers.creditLimit} onChange={(e) => update('customers', 'creditLimit', parseFloat(e.target.value) || 0)} /></div>
                <div className="flex items-center justify-between"><Label>Auto codes</Label><Switch checked={settings.customers.autoCode} onCheckedChange={(v) => update('customers', 'autoCode', v)} /></div>
                <div className="flex items-center justify-between"><Label>Phone required</Label><Switch checked={settings.customers.requirePhone} onCheckedChange={(v) => update('customers', 'requirePhone', v)} /></div>
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Kanban className="h-5 w-5" />CRM Pipeline Stages</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-gray-500">These stages appear as columns on the CRM board. Use short keys (e.g. lead, won).</p>
                {(settings.crm?.stages || []).map((stage, idx) => (
                  <div key={`crm-stage-${idx}`} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-3">
                      <Label className="text-xs">Key</Label>
                      <Input
                        value={stage.key || ''}
                        onChange={(e) => {
                          const stages = [...(settings.crm.stages || [])];
                          stages[idx] = { ...stages[idx], key: e.target.value };
                          update('crm', 'stages', stages);
                        }}
                      />
                    </div>
                    <div className="col-span-4">
                      <Label className="text-xs">Label</Label>
                      <Input
                        value={stage.label || ''}
                        onChange={(e) => {
                          const stages = [...(settings.crm.stages || [])];
                          stages[idx] = { ...stages[idx], label: e.target.value };
                          update('crm', 'stages', stages);
                        }}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Color</Label>
                      <Input
                        type="color"
                        value={stage.color || '#6B7280'}
                        onChange={(e) => {
                          const stages = [...(settings.crm.stages || [])];
                          stages[idx] = { ...stages[idx], color: e.target.value };
                          update('crm', 'stages', stages);
                        }}
                      />
                    </div>
                    <div className="col-span-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="w-full"
                        onClick={() => {
                          const stages = (settings.crm.stages || []).filter((_, i) => i !== idx);
                          update('crm', 'stages', stages.length ? stages : DEFAULT_CRM_STAGES);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => update('crm', 'stages', [
                      ...(settings.crm.stages || []),
                      { key: `stage_${(settings.crm.stages || []).length + 1}`, label: 'New stage', color: '#6B7280' },
                    ])}
                  >
                    <Plus className="h-4 w-4 mr-1" />Add stage
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => update('crm', 'stages', DEFAULT_CRM_STAGES)}
                  >
                    Reset defaults
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Products</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Default Unit</Label><Input value={settings.products.defaultUnit} onChange={(e) => update('products', 'defaultUnit', e.target.value)} /></div>
                <div className="flex items-center justify-between"><Label>Track stock</Label><Switch checked={settings.products.trackStock} onCheckedChange={(v) => update('products', 'trackStock', v)} /></div>
                <div className="flex items-center justify-between"><Label>Allow negative stock</Label><Switch checked={settings.products.allowNegativeStock} onCheckedChange={(v) => update('products', 'allowNegativeStock', v)} /></div>
                <div>
                  <Label>Categories</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {settings.products.categories.map((c, i) => (
                      <Badge key={c} variant="outline" className="gap-1 pr-1">{c}
                        <button onClick={() => update('products', 'categories', settings.products.categories.filter((_, x) => x !== i))} className="hover:bg-red-100 rounded p-0.5"><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input placeholder="Add category..." value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
                    <Button size="sm" onClick={() => { if (newCategory) { update('products', 'categories', [...settings.products.categories, newCategory]); setNewCategory(''); } }}><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><UserCog className="h-5 w-5" />Designers & Employees</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between"><Label>Auto-assign designers</Label><Switch checked={settings.designers.assignAuto} onCheckedChange={(v) => update('designers', 'assignAuto', v)} /></div>
                <div className="flex items-center justify-between"><Label>Track hours</Label><Switch checked={settings.designers.trackHours} onCheckedChange={(v) => update('designers', 'trackHours', v)} /></div>
                <div className="flex items-center justify-between"><Label>Show workload</Label><Switch checked={settings.designers.showWorkload} onCheckedChange={(v) => update('designers', 'showWorkload', v)} /></div>
                <div className="flex items-center justify-between"><Label>Attendance tracking</Label><Switch checked={settings.employees.attendanceEnabled} onCheckedChange={(v) => update('employees', 'attendanceEnabled', v)} /></div>
                <div><Label>Salary Period</Label>
                  <Select value={settings.employees.salaryPeriod} onValueChange={(v) => update('employees', 'salaryPeriod', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Payment Methods</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {settings.payments.methods.map((m, i) => (
                  <div key={m.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{m.name}</span>
                    <div className="flex items-center gap-3">
                      <Switch checked={m.enabled} onCheckedChange={(v) => { const methods = [...settings.payments.methods]; methods[i] = { ...m, enabled: v }; update('payments', 'methods', methods); }} />
                      <Button size="icon" variant="ghost" onClick={() => update('payments', 'methods', settings.payments.methods.filter((_, x) => x !== i))}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input placeholder="Add payment method..." value={newMethod} onChange={(e) => setNewMethod(e.target.value)} />
                  <Button onClick={() => { if (newMethod) { update('payments', 'methods', [...settings.payments.methods, { name: newMethod, enabled: true }]); setNewMethod(''); } }}><Plus className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />HR Employees → Grant Login</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">
                  Employees from <strong>HR → Employees</strong>. Click <strong>Grant Login</strong> to create a Users account (username + password).
                  Role <strong>Designer</strong> employees also appear in order/product designer selection.
                </p>
                {usersLoading ? (
                  <p className="text-sm text-gray-500">Loading employees…</p>
                ) : (
                  <div className="overflow-x-auto border rounded-lg max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-gray-50">
                        <tr className="border-b">
                          <th className="text-left p-2">Employee</th>
                          <th className="text-left p-2">Role</th>
                          <th className="text-left p-2">Login</th>
                          <th className="text-right p-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hrEmployees.map((emp) => {
                          const linked = sheetUsers.find((u) => String(u.employeeId || '') === String(emp.id));
                          return (
                            <tr key={emp.id} className="border-b">
                              <td className="p-2">
                                <div className="flex items-center gap-2">
                                  {emp.photo || emp.image ? (
                                    <img src={emp.photo || emp.image} alt="" className="w-7 h-7 rounded object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-7 h-7 rounded bg-gray-100" />
                                  )}
                                  <div>
                                    <p className="font-medium leading-tight">{emp.name}</p>
                                    <p className="text-[11px] text-gray-500">{emp.phone || emp.email || '—'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-2"><Badge variant="outline">{emp.role || 'Staff'}</Badge></td>
                              <td className="p-2 text-xs text-gray-600">{linked ? linked.username : '—'}</td>
                              <td className="p-2 text-right">
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => grantLoginFromEmployee(emp)}>
                                  <KeyRound className="h-3 w-3 mr-1" />
                                  {linked ? 'Edit Login' : 'Grant Login'}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                        {!hrEmployees.length && (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-gray-500">
                              No employees yet — add them under HR → Employees first
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />User Access (Users sheet)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  These accounts live on the Google Sheet <strong>Users</strong> and are used for login.
                  Prefer granting access from the HR employees list above.
                </p>
                {userForm.employeeId && (
                  <p className="text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded px-2 py-1">
                    Linked employee id: {userForm.employeeId}
                  </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div><Label>Username</Label><Input value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} /></div>
                  <div><Label>Password{editingUserId ? ' (blank = keep)' : ''}</Label><Input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} /></div>
                  <div><Label>Name</Label><Input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} /></div>
                  <div><Label>Role</Label>
                    <Select value={userForm.role} onValueChange={(v) => setUserForm({ ...userForm, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(settings.users.roles || []).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Status</Label>
                    <Select value={userForm.status} onValueChange={(v) => setUserForm({ ...userForm, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Label className="text-sm font-semibold">Allowed modules</Label>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Only checked modules appear in the menu. Restricted URLs show &quot;Permission not granted&quot;.
                        Admin / Super Admin always have full access.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={selectAllModules}>Select all</Button>
                      <Button type="button" variant="outline" size="sm" onClick={clearAllModules}>Clear</Button>
                    </div>
                  </div>
                  {hasFullAccess(userForm) ? (
                    <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-1.5">
                      This role has full access to every module (module checkboxes are optional for non-admin roles).
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {ASSIGNABLE_MODULES.map((mod) => {
                        const checked = normalizePermissions(userForm.permissions).includes(mod.key);
                        return (
                          <label
                            key={mod.key}
                            className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm cursor-pointer bg-white ${
                              checked ? 'border-orange-300 ring-1 ring-orange-200' : 'border-gray-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="rounded border-gray-300"
                              checked={checked}
                              onChange={() => toggleUserModule(mod.key)}
                            />
                            <span>{mod.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveUser} className="text-white" style={{ backgroundColor: primary || '#F26522' }}>
                    <Save className="h-4 w-4 mr-2" />{editingUserId ? 'Update User' : 'Add User'}
                  </Button>
                  {editingUserId && (
                    <Button variant="outline" onClick={() => { setEditingUserId(null); setUserForm(emptyUser); }}>Cancel edit</Button>
                  )}
                  <Button variant="outline" onClick={loadUsers}>Refresh</Button>
                </div>
                {usersLoading ? (
                  <p className="text-sm text-gray-500">Loading users…</p>
                ) : (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="text-left p-2">Username</th>
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Role</th>
                          <th className="text-left p-2">Modules</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-right p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sheetUsers.map((u) => {
                          const perms = normalizePermissions(u.permissions);
                          const modulesLabel = hasFullAccess(u)
                            ? 'All'
                            : (perms.length ? `${perms.length} selected` : 'Dashboard only');
                          return (
                          <tr key={u.id || u.username} className="border-b">
                            <td className="p-2 font-medium">{u.username}</td>
                            <td className="p-2">{u.name}</td>
                            <td className="p-2"><Badge variant="outline">{u.role}</Badge></td>
                            <td className="p-2 text-xs text-gray-600">{modulesLabel}</td>
                            <td className="p-2">{u.status}</td>
                            <td className="p-2 text-right">
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => editUser(u)}><Edit className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteUser(u)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                            </td>
                          </tr>
                          );
                        })}
                        {!sheetUsers.length && (
                          <tr><td colSpan={6} className="p-4 text-center text-gray-500">No users loaded — check GAS /users endpoint</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Roles & Permissions</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Active Roles</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {settings.users.roles.map((r, i) => (
                      <Badge key={r} className="gap-1 pr-1" style={{ backgroundColor: '#FFF3ED', color: '#F26522' }}>{r}
                        <button onClick={() => update('users', 'roles', settings.users.roles.filter((_, x) => x !== i))} className="hover:bg-orange-200 rounded p-0.5"><X className="h-3 w-3" /></button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input placeholder="Add role..." value={newRole} onChange={(e) => setNewRole(e.target.value)} />
                    <Button onClick={() => { if (newRole) { update('users', 'roles', [...settings.users.roles, newRole]); setNewRole(''); } }}><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Password Policy</Label>
                    <Select value={settings.users.passwordPolicy} onValueChange={(v) => update('users', 'passwordPolicy', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="basic">Basic</SelectItem><SelectItem value="strong">Strong</SelectItem><SelectItem value="complex">Complex</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label>Session Timeout (min)</Label><Input type="number" value={settings.users.sessionTimeout} onChange={(e) => update('users', 'sessionTimeout', parseInt(e.target.value) || 60)} /></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Channels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
                All emails send from <strong>amazonprinting@gmail.com</strong>. Deploy Apps Script while logged into that Gmail account, add mail OAuth scopes, authorize once, then Deploy → New version.
              </p>
              {[
                { k: 'whatsappEnabled', l: 'WhatsApp notifications (opens Desktop / Mobile app)' },
                { k: 'autoOpenWhatsApp', l: 'Auto-open WhatsApp on order create / status change' },
                { k: 'emailNewOrder', l: 'Email on new order' },
                { k: 'emailOrderStatus', l: 'Email on status change' },
                { k: 'emailReady', l: 'Email when Ready for collection' },
                { k: 'emailDelivered', l: 'Email when Delivered' },
                { k: 'emailInvoice', l: 'Email when invoice generated' },
                { k: 'emailPayment', l: 'Email on payment (Cash In / Cash Out)' },
                { k: 'emailToken', l: 'Email on token booked / called' },
                { k: 'smsEnabled', l: 'SMS notifications (future — reserved)' },
              ].map((o) => (
                <div key={o.k} className="flex items-center justify-between gap-4">
                  <Label className="text-sm">{o.l}</Label>
                  <Switch
                    checked={!!settings.notifications[o.k]}
                    onCheckedChange={(v) => update('notifications', o.k, v)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><WhatsAppIcon className="h-5 w-5 text-green-600" />WhatsApp message templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-gray-500">
                Placeholders: {'{Customer Name}'}, {'{Order Number}'}, {'{Tracking Number}'}, {'{Status}'}, {'{Company Name}'}
              </p>
              {['quotation', 'created', 'Order Received', 'Designing', 'Proof Approval', 'Printing', 'Finishing', 'Packing', 'Ready', 'Delivered', 'Cancelled', 'status', 'invoice_generated', 'payment_received', 'payment_sent'].map((key) => {
                const templates = {
                  ...DEFAULT_WHATSAPP_TEMPLATES,
                  ...(settings.notifications.whatsappTemplates || {}),
                };
                const labelMap = {
                  quotation: 'Quotation',
                  created: 'Order Created / Received',
                  'Order Received': 'Order Received',
                  status: 'Generic status update',
                  invoice_generated: 'Invoice Generated',
                  payment_received: 'Payment Received (Cash In)',
                  payment_sent: 'Payment Sent (Cash Out)',
                };
                const label = labelMap[key] || key;
                return (
                  <div key={key}>
                    <Label className="mb-1 block">{label}</Label>
                    <Textarea
                      rows={key === 'created' ? 8 : 5}
                      value={templates[key] || ''}
                      onChange={(e) => update('notifications', 'whatsappTemplates', {
                        ...(settings.notifications.whatsappTemplates || {}),
                        [key]: e.target.value,
                      })}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />Email subjects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {['quotation', 'created', 'status', 'Ready', 'Delivered', 'invoice', 'payment_received', 'payment_sent', 'token_booked', 'token_called'].map((key) => {
                const subjects = {
                  ...DEFAULT_EMAIL_SUBJECTS,
                  ...(settings.notifications.emailSubjects || {}),
                };
                return (
                  <div key={key}>
                    <Label className="mb-1 block">{key}</Label>
                    <Input
                      value={subjects[key] || ''}
                      onChange={(e) => update('notifications', 'emailSubjects', {
                        ...(settings.notifications.emailSubjects || {}),
                        [key]: e.target.value,
                      })}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Test notifications</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    const to = settings.company.email || 'amazonprinting@gmail.com';
                    if (!to) { toast.error('Set company email first'); return; }
                    const res = await sendTestEmail(to);
                    const data = res?.data || res;
                    if (data?.ok === false || data?.error) {
                      toast.error(data.error || data.hint || data.reason || 'Email failed — authorize as amazonprinting@gmail.com in Apps Script');
                      return;
                    }
                    if (data?.message && /queued/i.test(String(data.message))) {
                      toast.error('Backend did not send mail (API stub). Point REACT_APP_GAS_API_URL to Apps Script web app.');
                      return;
                    }
                    toast.success(`Test email sent to ${to} (from amazonprinting@gmail.com) — check inbox/spam`);
                  } catch (err) {
                    toast.error(err?.response?.data?.message || 'Test email failed — redeploy Code.gs + appsscript.json and authorize Mail');
                  }
                }}
              >
                <Mail className="h-4 w-4 mr-2" />Send test email
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const phone = settings.company.phone;
                  if (!phone) { toast.error('Set company phone first (as WhatsApp test number)'); return; }
                  openWhatsAppChat(phone, 'Test WhatsApp notification from AMZ Prints ERP.');
                  toast.message('WhatsApp opened — tap Send');
                }}
              >
                <WhatsAppIcon className="h-4 w-4 mr-2" />Test WhatsApp app
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />System Preferences</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div><Label>Currency</Label><Input value={settings.system.currency} onChange={(e) => update('system', 'currency', e.target.value)} /></div>
              <div><Label>Date Format</Label>
                <Select value={settings.system.dateFormat} onValueChange={(v) => update('system', 'dateFormat', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="DD MMM YYYY">DD MMM YYYY</SelectItem><SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem><SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem><SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="col-span-2 flex items-center justify-between"><Label>Auto Backup</Label><Switch checked={settings.system.backupEnabled} onCheckedChange={(v) => update('system', 'backupEnabled', v)} /></div>
              <div><Label>Backup Frequency</Label>
                <Select value={settings.system.backupFrequency} onValueChange={(v) => update('system', 'backupFrequency', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="hourly">Hourly</SelectItem><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem></SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
