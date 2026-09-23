import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { settingsAPI } from '@/services/api';
import { clearGasCache } from '@/services/gasClient';
import { mergeInventorySettings } from '@/utils/moduleSettings';
import { ArrowLeft, Plus, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const InventorySettings = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(mergeInventorySettings({}));
  const [raw, setRaw] = useState({});
  const [saving, setSaving] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [newMat, setNewMat] = useState('');

  useEffect(() => {
    settingsAPI.get().then((res) => {
      const data = res.data || {};
      setRaw(data);
      setForm(mergeInventorySettings(data));
    }).catch(() => toast.error('Could not load inventory settings'));
  }, []);

  const add = (key, value, setter) => {
    const v = String(value || '').trim();
    if (!v) return;
    if ((form[key] || []).some((x) => String(x).toLowerCase() === v.toLowerCase())) {
      toast.error('Already in the list');
      return;
    }
    setForm((p) => ({ ...p, [key]: [...(p[key] || []), v] }));
    setter('');
  };

  const remove = (key, idx) => {
    setForm((p) => ({ ...p, [key]: (p[key] || []).filter((_, i) => i !== idx) }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await settingsAPI.update({
        ...raw,
        inventory: form,
        products: {
          ...(raw.products && typeof raw.products === 'object' ? raw.products : {}),
          trackStock: form.trackStock,
          allowNegativeStock: form.allowNegativeStock,
          categories: form.categories,
          materials: form.materials,
        },
      });
      clearGasCache();
      toast.success('Inventory settings saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="erp-page space-y-5" data-testid="inventory-settings">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Button variant="outline" size="sm" onClick={() => navigate('/warehouse/inventory')}>
            <ArrowLeft className="h-4 w-4 mr-1" />Inventory
          </Button>
          <h1 className="text-2xl font-bold mt-3" style={{ color: '#0747a3' }}>Inventory settings</h1>
          <p className="text-sm text-slate-500">Categories, materials, and stock rules for this module only.</p>
        </div>
        <Button className="text-white" style={{ backgroundColor: '#ff6d00' }} onClick={save} disabled={saving}>
          <Save className="h-4 w-4 mr-1" />{saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      <div className="rounded-2xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Track stock</Label>
            <p className="text-xs text-slate-500">Master switch. Each product also has its own Track inventory option. Services never use stock.</p>
          </div>
          <Switch checked={form.trackStock} onCheckedChange={(v) => setForm((p) => ({ ...p, trackStock: !!v }))} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Allow negative stock</Label>
            <p className="text-xs text-slate-500">Off = block sale when qty is not enough (inventory block).</p>
          </div>
          <Switch checked={form.allowNegativeStock} onCheckedChange={(v) => setForm((p) => ({ ...p, allowNegativeStock: !!v }))} />
        </div>
        <div>
          <Label>Low-stock warning at</Label>
          <Input
            type="number"
            min="0"
            className="mt-1 max-w-[160px]"
            value={form.defaultLowStock}
            onChange={(e) => setForm((p) => ({ ...p, defaultLowStock: Math.max(0, Number(e.target.value) || 0) }))}
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 space-y-3">
        <Label>Product categories</Label>
        <div className="flex flex-wrap gap-2">
          {(form.categories || []).map((c, i) => (
            <Badge key={`${c}-${i}`} variant="outline" className="gap-1 pr-1">
              {c}
              <button type="button" onClick={() => remove('categories', i)} className="hover:bg-red-100 rounded p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2 max-w-md">
          <Input placeholder="Add category" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
          <Button type="button" size="sm" onClick={() => add('categories', newCat, setNewCat)}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 space-y-3">
        <Label>Materials</Label>
        <div className="flex flex-wrap gap-2">
          {(form.materials || []).map((c, i) => (
            <Badge key={`${c}-${i}`} variant="outline" className="gap-1 pr-1">
              {c}
              <button type="button" onClick={() => remove('materials', i)} className="hover:bg-red-100 rounded p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2 max-w-md">
          <Input placeholder="Add material" value={newMat} onChange={(e) => setNewMat(e.target.value)} />
          <Button type="button" size="sm" onClick={() => add('materials', newMat, setNewMat)}><Plus className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
};

export default InventorySettings;
