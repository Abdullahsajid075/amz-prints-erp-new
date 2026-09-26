import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { productsAPI } from '@/services/api';
import { isServiceItem } from '@/utils/inventoryTrack';
import { formatCurrency } from '@/utils/helpers';
import { Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const emptyVariation = () => ({
  id: `var_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  size: '',
  color: '',
  material: '',
  price: '',
  sku: '',
  stock: '',
});

function normalizeVariations(list) {
  return (Array.isArray(list) ? list : [])
    .map((v, i) => ({
      id: v.id || `var_${i + 1}`,
      name: String(v.name || [v.size, v.color, v.material].filter(Boolean).join(' / ')).trim(),
      size: String(v.size || '').trim(),
      color: String(v.color || '').trim(),
      material: String(v.material || '').trim(),
      price: v.price === '' || v.price == null ? null : Number(v.price),
      sku: String(v.sku || '').trim(),
      stock: v.stock === '' || v.stock == null ? 0 : Math.max(0, Number(v.stock) || 0),
      image: String(v.image || '').trim(),
    }))
    .filter((v) => v.name || v.size || v.color || v.sku);
}

export default function ProductVariationsPanel({ products = [], onSaved }) {
  const goods = useMemo(
    () => (Array.isArray(products) ? products : []).filter((p) => p && !isServiceItem(p)),
    [products]
  );
  const [productId, setProductId] = useState('');
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  const selected = goods.find((p) => p.id === productId) || null;

  const loadProduct = (id) => {
    setProductId(id);
    const product = goods.find((p) => p.id === id);
    const vars = Array.isArray(product?.variations) ? product.variations : [];
    setRows(vars.map((v, i) => ({
      id: v.id || `var_${i + 1}`,
      name: v.name || '',
      size: v.size || '',
      color: v.color || '',
      material: v.material || '',
      price: v.price != null && v.price !== '' ? String(v.price) : '',
      sku: v.sku || '',
      stock: v.stock != null && v.stock !== '' ? String(v.stock) : '',
    })));
  };

  const updateRow = (idx, field, value) => {
    setRows((prev) => prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  };

  const save = async () => {
    if (!selected) {
      toast.error('Select a product first');
      return;
    }
    setSaving(true);
    try {
      const variations = normalizeVariations(rows);
      const res = await productsAPI.updateVariations(selected.id, variations);
      toast.success(`${selected.name}: ${variations.length} variation(s) saved`);
      onSaved?.(res.data || { ...selected, variations });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save variations');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-5 space-y-4" data-testid="product-variations-settings">
      <div>
        <h2 className="font-semibold text-lg">Product variations</h2>
        <p className="text-sm text-slate-500">
          Size, color, material, price, SKU, and stock — used in orders, POS, and price tags.
        </p>
      </div>
      <div className="max-w-md">
        <Label>Product</Label>
        <select
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={productId}
          onChange={(e) => loadProduct(e.target.value)}
          data-testid="variation-product-select"
        >
          <option value="">Select product</option>
          {goods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}{(p.variations || []).length ? ` · ${(p.variations || []).length} var` : ''}
            </option>
          ))}
        </select>
      </div>
      {!selected ? (
        <p className="text-sm text-slate-500">Pick a product to add size / color / material variations.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-slate-600">
              Base price {formatCurrency(selected.salePrice || selected.basePrice || selected.rate || 0)}
              {' · '}stock {Number(selected.stock || 0)}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setRows((prev) => [...prev, emptyVariation()])}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />Add variation
            </Button>
          </div>
          {!rows.length ? (
            <p className="text-xs text-slate-500">No variations — base price and stock are used.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((v, idx) => (
                <div key={v.id || idx} className="rounded-lg border bg-slate-50/70 p-3 grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
                  <div className="md:col-span-2">
                    <Label className="text-[11px]">Label</Label>
                    <Input value={v.name} placeholder="A4 / Matte" onChange={(e) => updateRow(idx, 'name', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-[11px]">Size</Label>
                    <Input value={v.size} placeholder="A4" onChange={(e) => updateRow(idx, 'size', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-[11px]">Color</Label>
                    <Input value={v.color} onChange={(e) => updateRow(idx, 'color', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-[11px]">Material</Label>
                    <Input value={v.material} onChange={(e) => updateRow(idx, 'material', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-[11px]">Price</Label>
                    <Input type="number" min="0" step="0.01" value={v.price} placeholder="Base" onChange={(e) => updateRow(idx, 'price', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-[11px]">SKU</Label>
                    <Input value={v.sku} onChange={(e) => updateRow(idx, 'sku', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-[11px]">Stock</Label>
                    <Input type="number" min="0" value={v.stock} onChange={(e) => updateRow(idx, 'stock', e.target.value)} />
                  </div>
                  <div>
                    <Button type="button" size="icon" variant="ghost" className="h-9 w-9" onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Button type="button" className="text-white" style={{ backgroundColor: '#ff6d00' }} onClick={save} disabled={saving} data-testid="save-product-variations">
            <Save className="h-4 w-4 mr-1" />{saving ? 'Saving…' : 'Save variations'}
          </Button>
        </div>
      )}
    </div>
  );
}
