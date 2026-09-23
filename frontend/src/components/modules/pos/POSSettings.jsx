import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { settingsAPI } from '@/services/api';
import { clearGasCache } from '@/services/gasClient';
import { mergePosSettings } from '@/utils/moduleSettings';
import { ArrowLeft, Plus, Save, Store, X } from 'lucide-react';
import { toast } from 'sonner';

const POSSettings = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(mergePosSettings({}));
  const [raw, setRaw] = useState({});
  const [saving, setSaving] = useState(false);
  const [newSvc, setNewSvc] = useState('');

  useEffect(() => {
    settingsAPI.get().then((res) => {
      const data = res.data || {};
      setRaw(data);
      setForm(mergePosSettings(data));
    }).catch(() => toast.error('Could not load POS settings'));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await settingsAPI.update({
        ...raw,
        pos: form,
      });
      clearGasCache();
      toast.success('POS settings saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="erp-page space-y-5" data-testid="pos-settings">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="outline" size="sm" onClick={() => navigate('/pos')}>
            <ArrowLeft className="h-4 w-4 mr-1" />POS
          </Button>
          <h1 className="text-2xl font-bold mt-3" style={{ color: '#0747a3' }}>POS settings</h1>
          <p className="text-sm text-slate-500">Register and receipt layout — POS stays inside the ERP.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/pos')}>
            <Store className="h-4 w-4 mr-1" />Open POS
          </Button>
          <Button className="text-white" style={{ backgroundColor: '#ff6d00' }} onClick={save} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />{saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Require opening register</Label>
            <p className="text-xs text-slate-500">Always on — POS Counter lock rehta hai jab tak register open na ho.</p>
          </div>
          <Switch checked disabled />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Show product calculator</Label>
            <p className="text-xs text-slate-500">Piece / sq ft helper on the lower POS counter.</p>
          </div>
          <Switch checked={form.showCalculator} onCheckedChange={(v) => setForm((p) => ({ ...p, showCalculator: !!v }))} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Website + verify QR on slip</Label>
            <p className="text-xs text-slate-500">Always printed — 1-inch black QRs. Scan verify QR to confirm the receipt.</p>
          </div>
          <Switch checked disabled />
        </div>
        <div>
          <Label>Default payment</Label>
          <Input className="mt-1 max-w-xs" value={form.defaultPayment} onChange={(e) => setForm((p) => ({ ...p, defaultPayment: e.target.value }))} />
        </div>
        <div>
          <Label>Footer line</Label>
          <Input className="mt-1" value={form.poweredBy} onChange={(e) => setForm((p) => ({ ...p, poweredBy: e.target.value }))} />
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 space-y-3">
        <Label>Services on POS slip (cards)</Label>
        <div className="flex flex-wrap gap-2">
          {(form.slipServices || []).map((s, i) => (
            <Badge key={`${s}-${i}`} variant="outline" className="gap-1 pr-1">
              {s}
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, slipServices: p.slipServices.filter((_, x) => x !== i) }))}
                className="hover:bg-red-100 rounded p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2 max-w-md">
          <Input placeholder="Add service card" value={newSvc} onChange={(e) => setNewSvc(e.target.value)} />
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const v = newSvc.trim();
              if (!v) return;
              setForm((p) => ({ ...p, slipServices: [...(p.slipServices || []), v] }));
              setNewSvc('');
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default POSSettings;
