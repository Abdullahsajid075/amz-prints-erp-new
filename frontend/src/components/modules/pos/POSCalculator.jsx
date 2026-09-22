import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/utils/helpers';
import { Calculator, Plus } from 'lucide-react';

/** Quick POS line calculator: piece rate or size-based (mm → sq ft). */
export default function POSCalculator({ accent = '#ff6d00', onAdd }) {
  const [name, setName] = useState('Custom print');
  const [qty, setQty] = useState('1');
  const [widthMm, setWidthMm] = useState('');
  const [heightMm, setHeightMm] = useState('');
  const [rate, setRate] = useState('');
  const [mode, setMode] = useState('piece');

  const qtyN = Math.max(1, Math.floor(Number(qty) || 1));
  const rateN = Math.max(0, Number(rate) || 0);
  const w = Math.max(0, Number(widthMm) || 0);
  const h = Math.max(0, Number(heightMm) || 0);
  const sqFt = useMemo(() => {
    if (!(w > 0 && h > 0)) return 0;
    return (w / 304.8) * (h / 304.8);
  }, [w, h]);

  const lineTotal = useMemo(() => {
    if (mode === 'sqft') return Math.round(sqFt * qtyN * rateN);
    return Math.round(qtyN * rateN);
  }, [mode, sqFt, qtyN, rateN]);

  const add = () => {
    if (!name.trim() || !(rateN > 0)) return;
    onAdd?.({
      productId: `calc_${Date.now()}`,
      name: mode === 'sqft' && w && h
        ? `${name.trim()} (${w}×${h} mm)`
        : name.trim(),
      rate: mode === 'sqft' ? Math.round((lineTotal / qtyN) * 100) / 100 : rateN,
      quantity: qtyN,
      size: w && h ? `${w}x${h}mm` : '',
      material: '',
    });
    setQty('1');
  };

  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-white" data-testid="pos-calculator">
      <p className="text-xs font-bold uppercase tracking-widest text-white/70 flex items-center gap-2 mb-3">
        <Calculator className="h-3.5 w-3.5" />Product calculator
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <Label className="text-[10px] text-white/70">Item</Label>
          <Input className="h-8 bg-white text-ink" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label className="text-[10px] text-white/70">Qty</Label>
          <Input className="h-8 bg-white text-ink" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
        <div>
          <Label className="text-[10px] text-white/70">{mode === 'sqft' ? 'Rate / sq ft' : 'Rate / piece'}</Label>
          <Input className="h-8 bg-white text-ink" type="number" min="0" value={rate} onChange={(e) => setRate(e.target.value)} />
        </div>
        <div>
          <Label className="text-[10px] text-white/70">Width mm</Label>
          <Input className="h-8 bg-white text-ink" type="number" min="0" value={widthMm} onChange={(e) => setWidthMm(e.target.value)} />
        </div>
        <div>
          <Label className="text-[10px] text-white/70">Height mm</Label>
          <Input className="h-8 bg-white text-ink" type="number" min="0" value={heightMm} onChange={(e) => setHeightMm(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <Button type="button" size="sm" variant={mode === 'piece' ? 'default' : 'outline'} className="h-7 text-xs" style={mode === 'piece' ? { backgroundColor: accent } : { backgroundColor: 'transparent', color: '#fff' }} onClick={() => setMode('piece')}>Per piece</Button>
        <Button type="button" size="sm" variant={mode === 'sqft' ? 'default' : 'outline'} className="h-7 text-xs" style={mode === 'sqft' ? { backgroundColor: accent } : { backgroundColor: 'transparent', color: '#fff' }} onClick={() => setMode('sqft')}>Per sq ft</Button>
      </div>
      <div className="flex items-center justify-between mt-3">
        <div>
          <p className="text-[10px] text-white/60">{mode === 'sqft' ? `${sqFt.toFixed(2)} sq ft × ${qtyN}` : `${qtyN} × ${formatCurrency(rateN)}`}</p>
          <p className="text-lg font-bold">{formatCurrency(lineTotal)}</p>
        </div>
        <Button type="button" className="text-white" style={{ backgroundColor: accent }} onClick={add} disabled={!rateN}>
          <Plus className="h-4 w-4 mr-1" />Add to cart
        </Button>
      </div>
    </div>
  );
}
