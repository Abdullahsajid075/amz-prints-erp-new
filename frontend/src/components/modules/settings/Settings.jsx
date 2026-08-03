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
import { settingsAPI } from '@/services/api';
import { Save, Building2, FileText, Palette, Users, ShoppingCart, Package, UserCog, CreditCard, Bell, Shield, Database, Trash2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

const defaultSettings = {
  company: { name: 'AMZ Prints', tagline: 'Professional Printing & Advertising Services', address: '', phone: '', email: '', website: '', taxId: '', authorizedSignatory: 'Authorized Person', logo: '', stamp: '' },
  invoice: { prefix: 'INV-', taxRate: 0, terms: 'Payment due within 30 days.', showQR: true, showStamp: true, showSignature: true },
  theme: { primary: '#F26522', secondary: '#2E2E2E', accent: '#10B981' },
  orders: { autoNumber: true, orderPrefix: 'ORD-', defaultStatus: 'Order Received', requireDeliveryDate: true },
  customers: { autoCode: true, codePrefix: 'CUST-', creditLimit: 50000, requirePhone: true },
  products: { defaultUnit: 'per piece', trackStock: true, allowNegativeStock: false, categories: ['Business Cards', 'Flyers', 'Banners'] },
  designers: { assignAuto: false, trackHours: true, showWorkload: true },
  employees: { attendanceEnabled: true, salaryPeriod: 'monthly' },
  payments: { methods: [{ name: 'Cash', enabled: true }, { name: 'Bank Transfer', enabled: true }, { name: 'UPI', enabled: true }, { name: 'Card', enabled: true }, { name: 'Cheque', enabled: true }] },
  users: { roles: ['Super Admin', 'Admin', 'Manager', 'Sales', 'Designer', 'Production', 'Accounts', 'Cashier'], passwordPolicy: 'strong', sessionTimeout: 60 },
  notifications: { emailNewOrder: true, emailOrderStatus: true, emailInvoice: true, smsEnabled: false, whatsappEnabled: true },
  system: { currency: 'PKR', dateFormat: 'DD MMM YYYY', backupEnabled: true, backupFrequency: 'daily' }
};

const Settings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [newMethod, setNewMethod] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newRole, setNewRole] = useState('');

  const loadSettings = useCallback(async () => {
    try {
      const res = await settingsAPI.get();
      if (res.data) {
        setSettings({ ...defaultSettings, ...res.data, company: { ...defaultSettings.company, ...(res.data.company || {}) } });
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const save = async () => {
    setSaving(true);
    try { await settingsAPI.update(settings); toast.success('Settings saved'); }
    catch (e) { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const update = (section, field, value) => setSettings({ ...settings, [section]: { ...settings[section], [field]: value } });

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>Settings</h1>
          <p className="text-gray-600 mt-1">Complete system configuration & preferences</p>
        </div>
        <Button onClick={save} style={{ backgroundColor: '#F26522' }} className="text-white" disabled={saving} data-testid="save-settings-button">
          <Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save All Settings'}
        </Button>
      </div>

      <Tabs defaultValue="company">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
          <TabsTrigger value="company"><Building2 className="h-4 w-4 mr-1" />Company</TabsTrigger>
          <TabsTrigger value="invoice"><FileText className="h-4 w-4 mr-1" />Invoice</TabsTrigger>
          <TabsTrigger value="theme"><Palette className="h-4 w-4 mr-1" />Theme</TabsTrigger>
          <TabsTrigger value="modules"><ShoppingCart className="h-4 w-4 mr-1" />Modules</TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" />Users</TabsTrigger>
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
              <div><Label>Logo URL</Label><Input placeholder="https://..." value={settings.company.logo} onChange={(e) => update('company', 'logo', e.target.value)} /></div>
              <div><Label>Stamp URL</Label><Input placeholder="https://..." value={settings.company.stamp} onChange={(e) => update('company', 'stamp', e.target.value)} /></div>
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
              <div><Label>Terms & Conditions</Label><Textarea rows={5} value={settings.invoice.terms} onChange={(e) => update('invoice', 'terms', e.target.value)} /></div>
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
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Notifications</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[{ k: 'emailNewOrder', l: 'Email on new order' }, { k: 'emailOrderStatus', l: 'Email on status change' }, { k: 'emailInvoice', l: 'Email invoice' }, { k: 'smsEnabled', l: 'SMS notifications' }, { k: 'whatsappEnabled', l: 'WhatsApp integration' }].map(o => (
                  <div key={o.k} className="flex items-center justify-between"><Label>{o.l}</Label><Switch checked={settings.notifications[o.k]} onCheckedChange={(v) => update('notifications', o.k, v)} /></div>
                ))}
              </CardContent>
            </Card>
          </div>
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
