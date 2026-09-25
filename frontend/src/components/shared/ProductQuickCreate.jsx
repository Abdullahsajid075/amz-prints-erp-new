import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { productsAPI, settingsAPI } from '@/services/api';
import { mergeInventorySettings } from '@/utils/moduleSettings';
import { toast } from 'sonner';

const empty = {
  name: '',
  category: '',
  material: '',
  basePrice: 0,
  stock: 0,
  description: '',
  productType: 'Product',
};

export default function ProductQuickCreate({
  open,
  onOpenChange,
  onCreated,
  accent = '#ff6d00',
  initialName = '',
}) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState({ categories: [], materials: [] });

  useEffect(() => {
    if (!open) return;
    setForm({ ...empty, name: initialName || '' });
    settingsAPI.get().then((res) => {
      const inv = mergeInventorySettings(res.data || {});
      setOptions({
        categories: inv.categories || [],
        materials: inv.materials || [],
      });
    }).catch(() => {});
  }, [open, initialName]);

  const save = async () => {
    if (!String(form.name || '').trim()) {
      toast.error('Product name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        productType: form.productType || 'Product',
        category: form.category || '',
        material: form.material || '',
        basePrice: Number(form.basePrice) || 0,
        rate: Number(form.basePrice) || 0,
        stock: Math.max(0, Math.floor(Number(form.stock) || 0)),
        trackInventory: form.productType !== 'Service',
        description: form.description || '',
        active: true,
        variations: [],
      };
      const res = await productsAPI.create(payload);
      const created = res.data || payload;
      toast.success('Product added — returning to the previous form');
      onCreated?.(created);
      onOpenChange?.(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="quick-product-dialog">
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
          <DialogDescription>Saved to the catalog. Your current form stays as-is.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <select className="mt-1 h-10 w-full rounded-md border px-3 text-sm" value={form.productType} onChange={(e) => setForm({ ...form, productType: e.target.value })}>
                <option value="Product">Product</option>
                <option value="Service">Service</option>
              </select>
            </div>
            <div>
              <Label>Price (Rs)</Label>
              <Input type="number" min="0" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
            </div>
            <div>
              <Label>Category</Label>
              <select className="mt-1 h-10 w-full rounded-md border px-3 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select</option>
                {options.categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <Label>Material</Label>
              <select className="mt-1 h-10 w-full rounded-md border px-3 text-sm" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}>
                <option value="">Select</option>
                {options.materials.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {form.productType !== 'Service' ? (
              <div>
                <Label>Stock</Label>
                <Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
            ) : null}
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
          <Button className="text-white" style={{ backgroundColor: accent }} disabled={saving} onClick={save} data-testid="save-quick-product">
            {saving ? 'Saving…' : 'Save product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
