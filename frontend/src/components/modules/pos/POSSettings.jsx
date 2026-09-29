import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { productsAPI, settingsAPI } from '@/services/api';
import { clearGasCache } from '@/services/gasClient';
import { mergePosSettings, posStickerPayload, POS_STICKER_PRESETS } from '@/utils/moduleSettings';
import { collectPriceTagCopies, printPriceTags } from '@/utils/priceTags';
import { useBrand } from '@/context/BrandContext';
import { ArrowLeft, Plus, Save, Store, X, Printer, Barcode } from 'lucide-react';
import { toast } from 'sonner';

const POSSettings = () => {
  const navigate = useNavigate();
  const { company } = useBrand();
  const [form, setForm] = useState(mergePosSettings({}));
  const [raw, setRaw] = useState({});
  const [saving, setSaving] = useState(false);
  const [newSvc, setNewSvc] = useState('');
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState({});

  useEffect(() => {
    settingsAPI.get().then((res) => {
      const data = res.data || {};
      setRaw(data);
      setForm(mergePosSettings(data));
    }).catch(() => toast.error('Could not load POS settings'));
    productsAPI.getAll().then((res) => setProducts(Array.isArray(res.data) ? res.data : [])).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const sticker = posStickerPayload(form);
      await settingsAPI.update({
        ...raw,
        pos: form,
        priceTags: sticker,
      });
      clearGasCache();
      toast.success('POS settings saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset) => {
    setForm((p) => ({
      ...p,
      stickerWidthMm: preset.widthMm,
      stickerHeightMm: preset.heightMm,
    }));
  };

  const chosen = products.filter((p) => selected[p.id]);
  const printChosen = (list, { allowZeroStock = false } = {}) => {
    const sticker = posStickerPayload(form);
    const result = printPriceTags(list, { company, ...sticker, allowZeroStock });
    const copies = collectPriceTagCopies(list, { allowZeroStock }).reduce((s, r) => s + r.copies, 0);
    if (result?.reason === 'no_stock') {
      toast.error('Nothing to print. Add stock, pick a product, or print selected (prints 1 black tag even if stock is 0).');
    } else if (result?.ok === false) {
      toast.error('Allow popups to print inventory tags');
    } else {
      toast.success(`${copies} POS sticker(s) sent to the printer`);
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
          <p className="text-sm text-slate-500">Register, barcode scan, and 80mm sticker-roll inventory tags.</p>
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
            <p className="text-xs text-slate-500">Always on — the POS counter stays locked until the register is opened.</p>
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

      <div className="rounded-2xl border bg-white p-5 space-y-4" data-testid="pos-barcode-settings">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-slate-100 p-2">
            <Barcode className="h-5 w-5 text-slate-700" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Barcode + POS sticker roll</h2>
            <p className="text-sm text-slate-500">
              Inventory tags print on the same 80mm POS thermal printer as receipts.
              Each sticker includes a CODE128 barcode. Scan the tag into the POS search box to add the product.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Scan barcode at POS</Label>
            <p className="text-xs text-slate-500">When on, a USB / Bluetooth scanner (code + Enter) adds the matching product to the cart.</p>
          </div>
          <Switch
            checked={form.barcodeScan !== false}
            onCheckedChange={(v) => setForm((p) => ({ ...p, barcodeScan: !!v }))}
            data-testid="pos-barcode-scan"
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Print barcode on tags</Label>
            <p className="text-xs text-slate-500">CODE128 using the product/variation SKU (or id if SKU is empty).</p>
          </div>
          <Switch
            checked={form.showBarcode !== false}
            onCheckedChange={(v) => setForm((p) => ({ ...p, showBarcode: !!v }))}
          />
        </div>
        <div>
          <Label>Sticker size</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {POS_STICKER_PRESETS.map((preset) => {
              const active = Number(form.stickerWidthMm) === preset.widthMm && Number(form.stickerHeightMm) === preset.heightMm;
              return (
                <Button
                  key={preset.id}
                  type="button"
                  size="sm"
                  variant={active ? 'default' : 'outline'}
                  className={active ? 'text-white' : ''}
                  style={active ? { backgroundColor: '#ff6d00' } : undefined}
                  onClick={() => applyPreset(preset)}
                  data-testid={`pos-sticker-preset-${preset.id}`}
                >
                  {preset.label}
                </Button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg">
          <div>
            <Label>Width (mm)</Label>
            <Input
              type="number"
              min="20"
              className="mt-1"
              value={form.stickerWidthMm}
              onChange={(e) => setForm((p) => ({ ...p, stickerWidthMm: Number(e.target.value) || 80 }))}
            />
          </div>
          <div>
            <Label>Height (mm)</Label>
            <Input
              type="number"
              min="15"
              className="mt-1"
              value={form.stickerHeightMm}
              onChange={(e) => setForm((p) => ({ ...p, stickerHeightMm: Number(e.target.value) || 40 }))}
            />
          </div>
          <div>
            <Label>Margin (mm)</Label>
            <Input
              type="number"
              min="0"
              className="mt-1"
              value={form.stickerMarginMm}
              onChange={(e) => setForm((p) => ({ ...p, stickerMarginMm: Number(e.target.value) || 0 }))}
            />
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Default is POS 80×40 mm for an 80mm sticker roll. Tags print in black ink. One sticker per stock unit. Services are skipped.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => printChosen(chosen, { allowZeroStock: true })} disabled={!chosen.length}>
            <Printer className="h-4 w-4 mr-1" /> Print selected ({chosen.length})
          </Button>
          <Button type="button" onClick={() => printChosen(products)} className="text-white" style={{ backgroundColor: '#ff6d00' }}>
            <Printer className="h-4 w-4 mr-1" /> Print all in-stock tags
          </Button>
        </div>
        <div className="max-h-64 overflow-y-auto rounded-xl border divide-y" data-testid="pos-sticker-products">
          {products.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-500">No products loaded.</p>
          ) : products.map((p) => {
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
