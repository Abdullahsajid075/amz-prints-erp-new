import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { productsAPI, settingsAPI } from '@/services/api';
import { clearGasCache } from '@/services/gasClient';
import { mergeInventorySettings, mergePosSettings, normalizeCatalogItems, posStickerPayload, POS_STICKER_PRESETS } from '@/utils/moduleSettings';
import { DEFAULT_INVENTORY_MODE, inventoryModeIsActive } from '@/utils/inventoryMode';
import { collectPriceTagCopies, printPriceTags } from '@/utils/priceTags';
import { useBrand } from '@/context/BrandContext';
import ProductVariationsPanel from '@/components/modules/inventory/ProductVariationsPanel';
import InventoryModeCard from '@/components/modules/inventory/InventoryModeCard';
import { ArrowLeft, Plus, Save, X, Printer, Pencil } from 'lucide-react';
import { toast } from 'sonner';

function CatalogEditor({ title, items, onChange, placeholder }) {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(-1);
  const [editName, setEditName] = useState('');

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    if (items.some((i) => i.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Already in the list');
      return;
    }
    onChange([...items, { name, active: true }]);
    setDraft('');
  };

  const rename = (idx) => {
    const name = editName.trim();
    if (!name) return;
    onChange(items.map((item, i) => (i === idx ? { ...item, name } : item)));
    setEditing(-1);
  };

  return (
    <div className="rounded-2xl border bg-white p-5 space-y-3">
      <Label>{title}</Label>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <Badge key={`${item.name}-${i}`} variant="outline" className={`gap-1 pr-1 ${item.active === false ? 'opacity-50 line-through' : ''}`}>
            {editing === i ? (
              <input
                className="h-5 w-28 border-0 bg-transparent text-xs outline-none"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => rename(i)}
                onKeyDown={(e) => e.key === 'Enter' && rename(i)}
                autoFocus
              />
            ) : (
              <span>{item.name}</span>
            )}
            <button type="button" title="Rename" onClick={() => { setEditing(i); setEditName(item.name); }} className="hover:bg-slate-100 rounded p-0.5">
              <Pencil className="h-3 w-3" />
            </button>
            <button
              type="button"
              title={item.active === false ? 'Activate' : 'Deactivate'}
              onClick={() => onChange(items.map((row, idx) => (idx === i ? { ...row, active: row.active === false } : row)))}
              className="text-[10px] px-1"
            >
              {item.active === false ? 'On' : 'Off'}
            </button>
            <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="hover:bg-red-100 rounded p-0.5">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2 max-w-md">
        <Input placeholder={placeholder} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <Button type="button" size="sm" onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

const InventorySettings = () => {
  const navigate = useNavigate();
  const { company } = useBrand();
  const [form, setForm] = useState(mergeInventorySettings({}));
  const [raw, setRaw] = useState({});
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState({});
  const [tagCfg, setTagCfg] = useState({ widthMm: 80, heightMm: 40, marginMm: 2, showBarcode: true });

  useEffect(() => {
    settingsAPI.get().then((res) => {
      const data = res.data || {};
      setRaw(data);
      const merged = mergeInventorySettings(data);
      setForm(merged);
      const posMerged = mergePosSettings(data);
      setTagCfg(posStickerPayload(posMerged));
    }).catch(() => toast.error('Could not load inventory settings'));
    productsAPI.getAll().then((res) => setProducts(Array.isArray(res.data) ? res.data : [])).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const categories = form.categoryItems || normalizeCatalogItems(form.categories);
      const materials = form.materialItems || normalizeCatalogItems(form.materials);
      await settingsAPI.update({
        inventory: {
          trackStock: form.trackStock,
          allowNegativeStock: form.allowNegativeStock,
          deductOnSale: form.deductOnSale,
          defaultLowStock: form.defaultLowStock,
          categories,
          materials,
          categoryItems: categories,
          materialItems: materials,
          inventoryMode: form.inventoryMode || DEFAULT_INVENTORY_MODE,
        },
        products: {
          ...(raw.products && typeof raw.products === 'object' ? raw.products : {}),
          trackStock: form.trackStock,
          allowNegativeStock: form.allowNegativeStock,
          categories,
          materials,
        },
        priceTags: tagCfg,
        pos: {
          ...(raw.pos && typeof raw.pos === 'object' ? raw.pos : {}),
          stickerWidthMm: tagCfg.widthMm,
          stickerHeightMm: tagCfg.heightMm,
          stickerMarginMm: tagCfg.marginMm,
          showBarcode: tagCfg.showBarcode !== false,
        },
      });
      clearGasCache();
      toast.success('Product settings saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const chosen = products.filter((p) => selected[p.id]);
  const printChosen = (list, { allowZeroStock = false } = {}) => {
    const result = printPriceTags(list, { company, ...tagCfg, allowZeroStock });
    const copies = collectPriceTagCopies(list, { allowZeroStock }).reduce((s, r) => s + r.copies, 0);
    if (result?.reason === 'no_stock') {
      toast.error('Nothing to print. Add stock, pick a product, or print selected (prints 1 black tag even if stock is 0).');
    } else if (result?.ok === false) {
      toast.error('Allow popups to print price tags');
    } else {
      toast.success(`${copies} POS sticker(s) sent to the printer`);
    }
  };

  return (
    <div className="erp-page space-y-5" data-testid="inventory-settings">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Button variant="outline" size="sm" onClick={() => navigate('/warehouse/inventory')}>
            <ArrowLeft className="h-4 w-4 mr-1" />Inventory
          </Button>
          <h1 className="text-2xl font-bold mt-3" style={{ color: '#0747a3' }}>Product settings</h1>
          <p className="text-sm text-slate-500">Categories, materials, variations, stock rules, Inventory Mode, and POS sticker-roll tags.</p>
        </div>
        <Button className="text-white" style={{ backgroundColor: '#ff6d00' }} onClick={save} disabled={saving}>
          <Save className="h-4 w-4 mr-1" />{saving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      <InventoryModeCard
        value={form.inventoryMode || DEFAULT_INVENTORY_MODE}
        onChange={(inventoryMode) => setForm((p) => ({ ...p, inventoryMode }))}
      />

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

      <CatalogEditor
        title="Product categories"
        placeholder="Add category"
        items={form.categoryItems || []}
        onChange={(categoryItems) => setForm((p) => ({ ...p, categoryItems, categories: categoryItems.filter((i) => i.active !== false).map((i) => i.name) }))}
      />
      <CatalogEditor
        title="Materials"
        placeholder="Add material"
        items={form.materialItems || []}
        onChange={(materialItems) => setForm((p) => ({ ...p, materialItems, materials: materialItems.filter((i) => i.active !== false).map((i) => i.name) }))}
      />

      <ProductVariationsPanel
        products={products}
        allowManualStock={inventoryModeIsActive(form.inventoryMode)}
        onSaved={(updated) => setProducts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))}
      />

      <div className="rounded-2xl border bg-white p-5 space-y-4" data-testid="price-tag-settings">
        <div>
          <h2 className="font-semibold text-lg">Inventory tags — POS sticker roll</h2>
          <p className="text-sm text-slate-500">
            Tags print on the <strong>80mm POS thermal printer</strong> in <strong>black ink</strong> with a CODE128 barcode.
            Size is shared with POS settings. One sticker per stock unit. Services are skipped. Variations print separately.
            Selected products print 1 black tag even if stock is 0. Scan the barcode at POS to add the product.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {POS_STICKER_PRESETS.map((preset) => {
            const active = Number(tagCfg.widthMm) === preset.widthMm && Number(tagCfg.heightMm) === preset.heightMm;
            return (
              <Button
                key={preset.id}
                type="button"
                size="sm"
                variant={active ? 'default' : 'outline'}
                className={active ? 'text-white' : ''}
                style={active ? { backgroundColor: '#ff6d00' } : undefined}
                onClick={() => setTagCfg((c) => ({ ...c, widthMm: preset.widthMm, heightMm: preset.heightMm }))}
              >
                {preset.label}
              </Button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <Label>Width (mm)</Label>
            <Input type="number" min="20" value={tagCfg.widthMm} onChange={(e) => setTagCfg((c) => ({ ...c, widthMm: Number(e.target.value) || 80 }))} />
          </div>
          <div>
            <Label>Height (mm)</Label>
            <Input type="number" min="15" value={tagCfg.heightMm} onChange={(e) => setTagCfg((c) => ({ ...c, heightMm: Number(e.target.value) || 40 }))} />
          </div>
          <div>
            <Label>Margin (mm)</Label>
            <Input type="number" min="0" value={tagCfg.marginMm} onChange={(e) => setTagCfg((c) => ({ ...c, marginMm: Number(e.target.value) || 2 }))} />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={tagCfg.showBarcode !== false} onChange={(e) => setTagCfg((c) => ({ ...c, showBarcode: e.target.checked }))} />
              Show barcode
            </label>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => printChosen(chosen, { allowZeroStock: true })} disabled={!chosen.length}>
            <Printer className="h-4 w-4 mr-1" /> Print selected ({chosen.length})
          </Button>
          <Button type="button" onClick={() => printChosen(products)} className="text-white" style={{ backgroundColor: '#ff6d00' }}>
            <Printer className="h-4 w-4 mr-1" /> Print all in-stock tags
          </Button>
        </div>
        <div className="max-h-64 overflow-y-auto rounded-xl border divide-y">
          {products.map((p) => {
            const copies = collectPriceTagCopies([p], { allowZeroStock: true }).reduce((s, r) => s + r.copies, 0);
            return (
              <label key={p.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <input type="checkbox" checked={!!selected[p.id]} onChange={(e) => setSelected((s) => ({ ...s, [p.id]: e.target.checked }))} />
                <span className="flex-1 truncate">{p.name}</span>
                <span className="text-xs text-slate-500">{copies} tags</span>
                <Button type="button" size="sm" variant="ghost" disabled={!copies} onClick={() => printChosen([p], { allowZeroStock: true })}>Print</Button>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InventorySettings;
