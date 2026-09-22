import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBrand } from '@/context/BrandContext';
import { formatCurrency } from '@/utils/helpers';
import { openPrintWindow, moneyPKR, printOnLoadScript } from '@/utils/printHelpers';
import {
  PAPER_CATEGORIES,
  PAPER_QUALITIES,
  PRINT_METHODS,
  COLOUR_OPTIONS,
  SIDE_OPTIONS,
  FINISHING_PROCESSES,
  COMPOSING_SIZE_CHARTS,
  REAM_SHEETS,
  defaultFullForm,
  applyComposingSize,
  applyPaperSelection,
  applyColourPlateCost,
  calculateFullCost,
  loadSavedCostings,
  saveCosting,
  deleteCosting,
  formatArea,
  loadReamRates,
  saveReamRates,
  resetReamRates,
  loadColourPlateCosts,
  saveColourPlateCosts,
  resetColourPlateCosts,
  sizesForCategory,
  gsmsForSelection,
} from '@/utils/printingCostEngine';
import {
  Calculator, Printer, Save, Trash2, RotateCcw,
  LayoutGrid, Layers, Scissors, Wallet, Gauge, Ruler, Table2,
} from 'lucide-react';
import { toast } from 'sonner';

function NumField({ label, value, onChange, min = 0, step = 1, className = '', disabled = false }) {
  return (
    <div className={className}>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        min={min}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="h-9"
      />
    </div>
  );
}

function ResultStrip({ result, accent }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: 'Pieces / Sheet', value: result.piecesPerSheet, icon: LayoutGrid },
        { label: 'Final Sheets', value: result.finalSheets, icon: Layers },
        { label: 'Utilization', value: `${result.utilizationPct.toFixed(1)}%`, icon: Gauge },
        { label: 'Cost / Piece', value: formatCurrency(result.costPerPiece), icon: Wallet, highlight: true },
      ].map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-orange-100 bg-white p-3 shadow-sm"
        >
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
            <item.icon className="h-3.5 w-3.5" style={{ color: accent }} />
            {item.label}
          </div>
          <p className={`mt-1 text-lg font-bold ${item.highlight ? '' : 'text-gray-900'}`} style={item.highlight ? { color: accent } : undefined}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function buildCostingPrintHtml({ title, company, form, result, mode }) {
  const companyName = company?.name || 'Amazon Printing Services';
  const rows = [
    ['Mode', mode],
    ['Product / Job', `${form.productName || ''} ${form.jobName || ''}`.trim() || '—'],
    ['Quantity', form.quantity],
    ['Paper', `${form.paperType || form.paperCategory} · ${form.paperSizeId} · ${form.paperGsm} GSM · ${form.paperQuality}`],
    ['Sheet', `${form.sheetWidth} × ${form.sheetHeight} ${form.sheetUnit || form.unit}`],
    ['Piece', `${form.printWidth || form.pieceWidth || form.finishedWidth} × ${form.printHeight || form.pieceHeight || form.finishedHeight} ${form.unit}`],
    ['Pieces / Sheet', result.piecesPerSheet],
    ['Layout', `${result.orientation} · ${result.cols}×${result.rows}`],
    ['Required Sheets', result.requiredSheets],
    ['Wastage Sheets', result.wastageSheets],
    ['Final Sheets', result.finalSheets],
    ['Ream rate (500)', `Rs ${moneyPKR(result.reamRate500)}`],
    ['Paper Cost', `Rs ${moneyPKR(result.paperCost)}  (${result.finalSheets}/500 × rate)`],
    ['Plates / Tracing', `Rs ${moneyPKR(result.plateCost)}`],
    ['Extra press / sheet', `Rs ${moneyPKR(result.printingCost)}`],
    ['Finishing', `Rs ${moneyPKR(result.finishingCost)}`],
    ['Labour + Pack + Misc', `Rs ${moneyPKR(result.labourCost + result.packingCost + result.deliveryCost + result.miscCost)}`],
    ['TOTAL PRODUCTION COST', `Rs ${moneyPKR(result.totalProductionCost)}`],
    ['COST PER PIECE', `Rs ${moneyPKR(result.costPerPiece)}`],
  ];

  const body = rows.map(([k, v], i) => `
    <tr style="${i % 2 ? 'background:#f7f7f7' : ''}">
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;font-weight:600">${k}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #ddd;text-align:right">${v}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html><html><head><title>${title}</title>
  <style>
    @page { margin: 12mm; }
    body { font-family: Arial, Helvetica, sans-serif; color:#111; max-width: 720px; margin: 0 auto; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .sub { font-size: 12px; color:#444; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .foot { margin-top: 16px; font-size: 11px; color:#555; text-align:center; }
  </style></head><body>
  <h1>${companyName}</h1>
  <div class="sub">Internal Printing Cost Sheet · ${new Date().toLocaleString('en-PK')}</div>
  <table>${body}</table>
  <div class="foot">Internal use only — not a customer quotation</div>
  ${printOnLoadScript(400)}
  </body></html>`;
}

const PrintingCostCalculator = () => {
  const { company, primary } = useBrand();
  const accent = primary || '#ff6d00';
  const [tab, setTab] = useState('full');
  const [rates, setRates] = useState(() => loadReamRates());
  const [plateCosts, setPlateCosts] = useState(() => loadColourPlateCosts());
  const [full, setFull] = useState(() => defaultFullForm(loadReamRates(), loadColourPlateCosts()));
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    setSaved(loadSavedCostings());
  }, []);

  const fullResult = useMemo(() => calculateFullCost(full), [full]);

  const sizeOptions = useMemo(
    () => sizesForCategory(rates, full.paperCategory || 'paper_sheet'),
    [rates, full.paperCategory]
  );
  const gsmOptions = useMemo(
    () => gsmsForSelection(rates, full.paperCategory || 'paper_sheet', full.paperSizeId),
    [rates, full.paperCategory, full.paperSizeId]
  );

  const setFullField = useCallback((key, value) => {
    setFull((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updatePaper = useCallback((patch) => {
    setFull((prev) => applyPaperSelection(prev, rates, patch));
  }, [rates]);

  const onColourChange = (colourId) => {
    setFull((prev) => applyColourPlateCost(prev, plateCosts, colourId));
  };

  const applyComposingRow = (chart, row, useComposing) => {
    setFull((prev) => {
      const next = applyComposingSize(prev, chart, row, useComposing);
      return applyPaperSelection(next, rates, {
        paperSizeId: chart.id === '17x24' ? '22x25' : chart.id,
        paperCategory: chart.paperTypeHint === 'NCR' || chart.paperTypeHint === 'Carbonless'
          ? 'carbonless'
          : (chart.paperTypeHint === 'Ivory Card' ? 'every_card' : (chart.id === '25x30' || chart.id === '22x28' ? 'box_board' : 'paper_sheet')),
      });
    });
    setTab('full');
    toast.success(`${row.size} applied (${useComposing ? 'Composing' : 'Original'})`);
  };

  const toggleFinishing = (id, enabled) => {
    setFull((prev) => ({
      ...prev,
      finishing: {
        ...prev.finishing,
        [id]: { ...prev.finishing[id], enabled },
      },
    }));
  };

  const setFinishing = (id, patch) => {
    setFull((prev) => ({
      ...prev,
      finishing: {
        ...prev.finishing,
        [id]: { ...prev.finishing[id], ...patch },
      },
    }));
  };

  const handleSaveRates = () => {
    saveReamRates(rates);
    saveColourPlateCosts(plateCosts);
    setFull((prev) => {
      const withPaper = applyPaperSelection(prev, rates, {});
      return applyColourPlateCost(withPaper, plateCosts, withPaper.colour);
    });
    toast.success('Paper & plate rates saved on this browser');
  };

  const handleResetRates = () => {
    const nextRates = resetReamRates();
    const nextPlates = resetColourPlateCosts();
    setRates(nextRates);
    setPlateCosts(nextPlates);
    setFull(defaultFullForm(nextRates, nextPlates));
    toast.message('Rates restored to default price list');
  };

  const handleSave = () => {
    if (!(Number(full.quantity) > 0)) {
      toast.error('Quantity required');
      return;
    }
    if (!(fullResult.piecesPerSheet > 0)) {
      toast.error('Invalid sheet / piece sizes — pieces per sheet is 0');
      return;
    }
    const entry = {
      mode: 'full',
      title: full.jobName || full.productName || full.composingSizeLabel || 'Untitled job',
      form: full,
      result: fullResult,
    };
    setSaved(saveCosting(entry));
    toast.success('Costing saved');
  };

  const handlePrint = () => {
    const html = buildCostingPrintHtml({
      title: 'Printing Cost Sheet',
      company,
      form: full,
      result: fullResult,
      mode: 'Full Cost Calculator',
    });
    const out = openPrintWindow(html, { width: 820, height: 900 });
    if (!out.ok) toast.error('Allow popups to print / export PDF');
    else toast.message('Print dialog open — choose Save as PDF if needed');
  };

  const loadEntry = (entry) => {
    if (entry.mode === 'simple' && entry.form) {
      const f = entry.form;
      setFull(applyPaperSelection({
        ...defaultFullForm(rates, plateCosts),
        jobName: f.jobName || '',
        quantity: f.quantity,
        unit: f.unit || 'inch',
        finishedWidth: f.pieceWidth || f.finishedWidth,
        finishedHeight: f.pieceHeight || f.finishedHeight,
        printWidth: f.pieceWidth || f.printWidth,
        printHeight: f.pieceHeight || f.printHeight,
        sheetPreset: f.sheetPreset,
        sheetWidth: f.sheetWidth,
        sheetHeight: f.sheetHeight,
        sheetUnit: f.sheetUnit || 'inch',
        reamRate500: f.reamRate500 || ((Number(f.paperCostPerSheet) || 0) * REAM_SHEETS),
        paperCostPerSheet: f.paperCostPerSheet,
        wastagePct: f.wastagePct,
        machineCostPerSheet: f.printCostPerSheet ?? f.machineCostPerSheet ?? 0,
        sides: f.sides,
        colour: f.colour,
        colourPlateCost: f.colourPlateCost,
        labourCost: f.labourPackMisc ?? f.labourCost ?? 0,
      }, rates, {}));
    } else {
      const merged = {
        ...defaultFullForm(rates, plateCosts),
        ...entry.form,
        finishing: { ...defaultFullForm(rates, plateCosts).finishing, ...(entry.form?.finishing || {}) },
      };
      setFull(applyColourPlateCost(applyPaperSelection(merged, rates, {
        paperCategory: merged.paperCategory,
        paperSizeId: merged.paperSizeId || merged.sheetPreset,
        paperGsm: merged.paperGsm,
        paperQuality: merged.paperQuality,
      }), plateCosts, merged.colour));
    }
    setTab('full');
    toast.message('Loaded into calculator');
  };

  const ratesByCategory = useMemo(() => {
    const map = {};
    PAPER_CATEGORIES.forEach((c) => { map[c.id] = []; });
    rates.forEach((r) => {
      if (!map[r.category]) map[r.category] = [];
      map[r.category].push(r);
    });
    return map;
  }, [rates]);

  return (
    <div className="space-y-4 pb-10" data-testid="printing-cost-calculator">
      <div className="rounded-2xl border border-orange-100 bg-white overflow-hidden shadow-sm">
        <div className="h-1.5" style={{ backgroundColor: accent }} />
        <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FFF4EB' }}>
              <Calculator className="h-5 w-5" style={{ color: accent }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#0747a3' }}>Printing Cost Calculator</h1>
              <p className="text-sm text-gray-600">
                Paper = sheets÷500 × ream rate · Plates/tracing fixed by colour · extras manual
              </p>
            </div>
          </div>
          <Badge variant="outline" className="w-fit">Live calc · auto ream price</Badge>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-3xl">
          <TabsTrigger value="full">Costing</TabsTrigger>
          <TabsTrigger value="rates">Paper Rates</TabsTrigger>
          <TabsTrigger value="composing">Composing Sizes</TabsTrigger>
          <TabsTrigger value="saved">Saved ({saved.length})</TabsTrigger>
        </TabsList>

        {/* ================= FULL ================= */}
        <TabsContent value="full" className="space-y-4 mt-4">
          <ResultStrip result={fullResult} accent={accent} />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 space-y-4">
              <Card className="border-orange-100/80 shadow-sm rounded-2xl">
                <CardHeader className="py-3"><CardTitle className="text-base">General Information</CardTitle></CardHeader>
                <CardContent className="pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Label className="text-xs">Product Name</Label>
                    <Input className="h-9" value={full.productName} onChange={(e) => setFullField('productName', e.target.value)} placeholder="e.g. Business Card" />
                  </div>
                  <div>
                    <Label className="text-xs">Job Name</Label>
                    <Input className="h-9" value={full.jobName} onChange={(e) => setFullField('jobName', e.target.value)} placeholder="Client / job ref" />
                  </div>
                  <NumField label="Quantity *" value={full.quantity} onChange={(v) => setFullField('quantity', v)} min={1} />
                  <div>
                    <Label className="text-xs">Unit</Label>
                    <Select value={full.unit} onValueChange={(v) => setFullField('unit', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mm">mm</SelectItem>
                        <SelectItem value="inch">inch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <NumField label={`Finished Width (${full.unit})`} value={full.finishedWidth} onChange={(v) => setFullField('finishedWidth', v)} step={0.01} />
                  <NumField label={`Finished Height (${full.unit})`} value={full.finishedHeight} onChange={(v) => setFullField('finishedHeight', v)} step={0.01} />
                  {full.composingSizeLabel ? (
                    <div className="sm:col-span-2 lg:col-span-3">
                      <Badge variant="outline" className="text-xs">Composing chart: {full.composingSizeLabel}</Badge>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="border-orange-100/80 shadow-sm rounded-2xl">
                <CardHeader className="py-3"><CardTitle className="text-base">Paper Details</CardTitle></CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Type of Paper</Label>
                      <Select value={full.paperCategory} onValueChange={(v) => updatePaper({ paperCategory: v })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PAPER_CATEGORIES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Sheet Size</Label>
                      <Select value={full.paperSizeId} onValueChange={(v) => updatePaper({ paperSizeId: v })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {sizeOptions.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">GSM / Gram</Label>
                      <Select value={String(full.paperGsm)} onValueChange={(v) => updatePaper({ paperGsm: v })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {gsmOptions.map((g) => <SelectItem key={g} value={g}>{g === 'R' ? 'R' : `${g} GSM`}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Quality</Label>
                      <Select value={full.paperQuality} onValueChange={(v) => updatePaper({ paperQuality: v })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PAPER_QUALITIES.map((q) => <SelectItem key={q.id} value={q.id}>{q.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <NumField
                      label="Price of Rim (500 sheets)"
                      value={full.reamRate500}
                      onChange={(v) => {
                        setFull((prev) => ({
                          ...prev,
                          reamRate500: v,
                          paperCostPerSheet: v / REAM_SHEETS,
                        }));
                      }}
                      step={1}
                    />
                    <NumField label="Wastage %" value={full.wastagePct} onChange={(v) => setFullField('wastagePct', v)} step={0.5} />
                    <NumField label={`Print Width (${full.unit})`} value={full.printWidth} onChange={(v) => setFullField('printWidth', v)} step={0.01} />
                    <NumField label={`Print Height (${full.unit})`} value={full.printHeight} onChange={(v) => setFullField('printHeight', v)} step={0.01} />
                    <NumField label={`Grip / Margin (${full.sheetUnit})`} value={full.margin} onChange={(v) => setFullField('margin', v)} step={0.01} />
                  </div>
                  <div className="rounded-xl bg-[#FFF6ED] border border-orange-100 p-3 text-sm space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div><p className="text-[10px] uppercase text-gray-500">Layout</p><p className="font-semibold capitalize">{fullResult.orientation} · {fullResult.cols}×{fullResult.rows}</p></div>
                      <div><p className="text-[10px] uppercase text-gray-500">Pieces / Sheet</p><p className="font-semibold">{fullResult.piecesPerSheet}</p></div>
                      <div><p className="text-[10px] uppercase text-gray-500">Used Area</p><p className="font-semibold">{formatArea(fullResult.usedAreaMm2, full.unit)}</p></div>
                      <div><p className="text-[10px] uppercase text-gray-500">Wasted Area</p><p className="font-semibold text-rose-600">{formatArea(fullResult.wasteAreaMm2, full.unit)}</p></div>
                    </div>
                    <p className="text-xs text-gray-700 border-t border-orange-100 pt-2">
                      Paper formula:{' '}
                      <strong>{fullResult.finalSheets}</strong> sheets ÷ {REAM_SHEETS} ×{' '}
                      <strong>{formatCurrency(full.reamRate500 || 0)}</strong>
                      {' '}= <strong style={{ color: accent }}>{formatCurrency(fullResult.paperCost)}</strong>
                      {!(Number(full.reamRate500) > 0) && (
                        <span className="text-rose-600 ml-2">No rate for this selection — edit Paper Rates or enter rim price.</span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-100/80 shadow-sm rounded-2xl">
                <CardHeader className="py-3"><CardTitle className="text-base">Printing (plates & tracing)</CardTitle></CardHeader>
                <CardContent className="pt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Printing Method</Label>
                    <Select value={full.printMethod} onValueChange={(v) => setFullField('printMethod', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PRINT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Colour</Label>
                    <Select value={full.colour} onValueChange={onColourChange}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {COLOUR_OPTIONS.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.label} — Rs {plateCosts[c.id] ?? c.defaultPlateCost}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Printing Side</Label>
                    <Select value={full.sides} onValueChange={(v) => setFullField('sides', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SIDE_OPTIONS.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <NumField
                    label="Plates + Tracing (fixed)"
                    value={full.colourPlateCost}
                    onChange={(v) => setFullField('colourPlateCost', v)}
                    step={1}
                  />
                  <NumField
                    label="Extra machine / sheet (optional)"
                    value={full.machineCostPerSheet}
                    onChange={(v) => setFullField('machineCostPerSheet', v)}
                    step={0.01}
                  />
                  <div className="rounded-lg bg-gray-50 border p-2.5">
                    <p className="text-[10px] uppercase text-gray-500">Plate colours</p>
                    <p className="font-bold text-lg">{fullResult.platesRequired}</p>
                    <p className="text-[11px] text-gray-500">Fixed cost (not × plates)</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-100/80 shadow-sm rounded-2xl">
                <CardHeader className="py-3 flex flex-row items-center gap-2 space-y-0">
                  <Scissors className="h-4 w-4" style={{ color: accent }} />
                  <CardTitle className="text-base">Other services (manual)</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-500 mb-3">Add creasing, perforation, binding, etc. with your own amount.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {FINISHING_PROCESSES.map((proc) => {
                      const row = full.finishing[proc.id];
                      return (
                        <div key={proc.id} className={`rounded-xl border p-2.5 ${row.enabled ? 'border-orange-200 bg-orange-50/40' : 'border-gray-100 bg-white'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Checkbox
                              checked={row.enabled}
                              onCheckedChange={(c) => toggleFinishing(proc.id, Boolean(c))}
                              id={`fin-${proc.id}`}
                            />
                            <Label htmlFor={`fin-${proc.id}`} className="text-sm font-medium cursor-pointer">{proc.label}</Label>
                          </div>
                          {row.enabled && (
                            <div className="grid grid-cols-2 gap-2 pl-6">
                              <Select value={row.mode} onValueChange={(v) => setFinishing(proc.id, { mode: v })}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="fixed">Fixed Cost</SelectItem>
                                  <SelectItem value="perPiece">Per Piece</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                className="h-8"
                                value={row.amount}
                                onChange={(e) => setFinishing(proc.id, { amount: parseFloat(e.target.value) || 0 })}
                                placeholder="Amount"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-100/80 shadow-sm rounded-2xl">
                <CardHeader className="py-3"><CardTitle className="text-base">Labour & Other</CardTitle></CardHeader>
                <CardContent className="pt-0 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <NumField label="Labour Cost" value={full.labourCost} onChange={(v) => setFullField('labourCost', v)} step={0.01} />
                  <NumField label="Packing Cost" value={full.packingCost} onChange={(v) => setFullField('packingCost', v)} step={0.01} />
                  <NumField label="Delivery Cost" value={full.deliveryCost} onChange={(v) => setFullField('deliveryCost', v)} step={0.01} />
                  <NumField label="Miscellaneous" value={full.miscCost} onChange={(v) => setFullField('miscCost', v)} step={0.01} />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4 xl:sticky xl:top-20 self-start">
              <Card className="border-orange-200 shadow-sm rounded-2xl overflow-hidden">
                <div className="h-1" style={{ backgroundColor: accent }} />
                <CardHeader className="py-3"><CardTitle className="text-base">Final Cost</CardTitle></CardHeader>
                <CardContent className="pt-0 space-y-2 text-sm">
                  {[
                    ['Paper (ream formula)', fullResult.paperCost],
                    ['Plates + Tracing', fullResult.plateCost],
                    ['Extra press run', fullResult.printingCost],
                    ['Other services', fullResult.finishingCost],
                    ['Labour', fullResult.labourCost],
                    ['Packing', fullResult.packingCost],
                    ['Delivery', fullResult.deliveryCost],
                    ['Miscellaneous', fullResult.miscCost],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between gap-2 border-b border-dashed border-gray-100 py-1.5">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-semibold">{formatCurrency(val)}</span>
                    </div>
                  ))}
                  <div className="rounded-xl p-3 mt-2" style={{ backgroundColor: '#FFF4EB' }}>
                    <p className="text-[10px] uppercase tracking-wide text-gray-500">Total Production Cost</p>
                    <p className="text-2xl font-bold" style={{ color: accent }}>{formatCurrency(fullResult.totalProductionCost)}</p>
                    <p className="text-sm text-gray-700 mt-1">
                      Per piece: <strong>{formatCurrency(fullResult.costPerPiece)}</strong>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Sheets: {fullResult.requiredSheets} + wastage {fullResult.wastageSheets} = {fullResult.finalSheets}
                      {' · '}Reams: {fullResult.reamsUsed.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <Button style={{ backgroundColor: accent }} className="text-white" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />Save calculation
                    </Button>
                    <Button variant="outline" onClick={handlePrint}>
                      <Printer className="h-4 w-4 mr-2" />Print / Export PDF
                    </Button>
                    <Button variant="ghost" onClick={() => setFull(defaultFullForm(rates, plateCosts))}>
                      <RotateCcw className="h-4 w-4 mr-2" />Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ================= RATES ================= */}
        <TabsContent value="rates" className="space-y-4 mt-4">
          <Card className="border-orange-100/80 shadow-sm rounded-2xl">
            <CardHeader className="py-3 flex flex-row items-start justify-between gap-3 space-y-0">
              <div className="flex items-start gap-2">
                <Table2 className="h-4 w-4 mt-0.5" style={{ color: accent }} />
                <div>
                  <CardTitle className="text-base">Paper rates (per 500 sheets)</CardTitle>
                  <p className="text-xs text-gray-500 font-normal mt-0.5">
                    Edit rates for future updates. Saved on this browser. Costing auto-fills from type + size + GSM + quality.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={handleResetRates}>Reset defaults</Button>
                <Button size="sm" className="text-white" style={{ backgroundColor: accent }} onClick={handleSaveRates}>
                  <Save className="h-4 w-4 mr-1" />Save rates
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-orange-100 bg-[#FFF6ED] p-3">
                {[
                  { key: 1, label: 'Single colour plates + tracing' },
                  { key: 2, label: '2 colour plates + tracing' },
                  { key: 4, label: '4 colour plates + tracing' },
                ].map((row) => (
                  <div key={row.key}>
                    <Label className="text-xs">{row.label}</Label>
                    <Input
                      type="number"
                      min={0}
                      className="h-9 mt-1"
                      value={plateCosts[row.key]}
                      onChange={(e) => setPlateCosts((prev) => ({
                        ...prev,
                        [row.key]: parseFloat(e.target.value) || 0,
                      }))}
                    />
                  </div>
                ))}
              </div>

              {PAPER_CATEGORIES.map((cat) => (
                <div key={cat.id} className="rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 border-b font-semibold text-sm">{cat.label}</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-[11px] uppercase tracking-wide text-gray-500">
                          <th className="text-left py-2 px-3">Size</th>
                          <th className="text-left py-2 px-3">GSM</th>
                          <th className="text-left py-2 px-3">Quality</th>
                          <th className="text-right py-2 px-3">Rate / 500 sheets</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(ratesByCategory[cat.id] || []).map((row) => (
                          <tr key={row.id} className="border-b border-gray-50">
                            <td className="py-2 px-3">{row.sizeLabel}</td>
                            <td className="py-2 px-3">{row.gsm}</td>
                            <td className="py-2 px-3 capitalize">{row.quality}</td>
                            <td className="py-2 px-3 text-right">
                              <Input
                                type="number"
                                min={0}
                                step={1}
                                className="h-8 w-32 ml-auto text-right"
                                value={row.rate500}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setRates((prev) => prev.map((r) => (r.id === row.id ? { ...r, rate500: val } : r)));
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= COMPOSING SIZES ================= */}
        <TabsContent value="composing" className="space-y-4 mt-4">
          <Card className="border-orange-100/80 shadow-sm rounded-2xl">
            <CardHeader className="py-3 flex flex-row items-center gap-2 space-y-0">
              <Ruler className="h-4 w-4" style={{ color: accent }} />
              <div>
                <CardTitle className="text-base">Composing Size Charts</CardTitle>
                <p className="text-xs text-gray-500 font-normal mt-0.5">
                  All sizes in inches. Click a row to apply Original or Composing size into the Costing form.
                </p>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {COMPOSING_SIZE_CHARTS.map((chart) => (
              <Card key={chart.id} className="border-orange-100/80 shadow-sm rounded-2xl overflow-hidden">
                <div className="h-1" style={{ backgroundColor: accent }} />
                <CardHeader className="py-3 pb-2">
                  <CardTitle className="text-base flex items-center justify-between gap-2">
                    <span>{chart.title}</span>
                    <Badge variant="outline" className="text-[10px] font-normal">
                      Sheet {chart.sheetW}×{chart.sheetH} in
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                        <th className="text-left py-2 px-2 font-semibold">S#</th>
                        <th className="text-left py-2 px-2 font-semibold">Size</th>
                        <th className="text-left py-2 px-2 font-semibold">Original</th>
                        <th className="text-left py-2 px-2 font-semibold">Composing</th>
                        <th className="text-right py-2 px-2 font-semibold">Apply</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chart.rows.map((row) => (
                        <tr key={row.size} className="border-b border-gray-100 hover:bg-orange-50/40">
                          <td className="py-2.5 px-2 text-gray-500">{row.sn}</td>
                          <td className="py-2.5 px-2 font-semibold">{row.size}</td>
                          <td className="py-2.5 px-2">{row.originalW} × {row.originalH}</td>
                          <td className="py-2.5 px-2 font-medium" style={{ color: accent }}>
                            {row.composingW} × {row.composingH}
                          </td>
                          <td className="py-2.5 px-2">
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] px-2"
                                onClick={() => applyComposingRow(chart, row, false)}
                              >
                                Original
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                className="h-7 text-[11px] px-2 text-white"
                                style={{ backgroundColor: accent }}
                                onClick={() => applyComposingRow(chart, row, true)}
                              >
                                Composing
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ================= SAVED ================= */}
        <TabsContent value="saved" className="mt-4">
          <Card className="border-orange-100/80 shadow-sm rounded-2xl">
            <CardHeader className="py-3"><CardTitle className="text-base">Saved Costings</CardTitle></CardHeader>
            <CardContent className="pt-0">
              {!saved.length && (
                <p className="text-center text-gray-500 py-10">No saved calculations yet.</p>
              )}
              <div className="space-y-2">
                {saved.map((entry) => (
                  <div key={entry.id} className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-xl border border-gray-100 p-3 bg-white">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{entry.title}</p>
                        <Badge variant="outline" className="text-[10px]">{entry.mode === 'simple' ? 'legacy' : 'full'}</Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {entry.savedAt ? new Date(entry.savedAt).toLocaleString('en-PK') : ''} · Qty {entry.form?.quantity} · Total {formatCurrency(entry.result?.totalProductionCost)} · /pc {formatCurrency(entry.result?.costPerPiece)}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => loadEntry(entry)}>Load</Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSaved(deleteCosting(entry.id));
                          toast.message('Deleted');
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PrintingCostCalculator;
