/**
 * Internal printing production cost engine.
 * All dimensions normalized to mm for area math.
 */

export const PAPER_SHEET_PRESETS = [
  { id: '17x27', label: '17 × 27 in', w: 17, h: 27, unit: 'inch' },
  { id: '20x30', label: '20 × 30 in', w: 20, h: 30, unit: 'inch' },
  { id: '22x28', label: 'Ivory 22 × 28 in', w: 22, h: 28, unit: 'inch' },
  { id: '17x24', label: 'Carbonless 17 × 24 in', w: 17, h: 24, unit: 'inch' },
  { id: '25x30', label: 'Boxboard 25 × 30 in', w: 25, h: 30, unit: 'inch' },
  { id: '23x36', label: '23 × 36 in', w: 23, h: 36, unit: 'inch' },
  { id: '25x36', label: '25 × 36 in', w: 25, h: 36, unit: 'inch' },
  { id: 'A1', label: 'A1 (594 × 841 mm)', w: 594, h: 841, unit: 'mm' },
  { id: 'A2', label: 'A2 (420 × 594 mm)', w: 420, h: 594, unit: 'mm' },
  { id: 'A3', label: 'A3 (297 × 420 mm)', w: 297, h: 420, unit: 'mm' },
  { id: 'A4', label: 'A4 (210 × 297 mm)', w: 210, h: 297, unit: 'mm' },
  { id: 'custom', label: 'Custom', w: 0, h: 0, unit: 'inch' },
];

/** Press composing charts (inches): Original cut size vs Composing (print) size. */
export const COMPOSING_SIZE_CHARTS = [
  {
    id: '17x27',
    title: 'Paper Size (17 × 27)',
    sheetW: 17,
    sheetH: 27,
    unit: 'inch',
    paperTypeHint: 'Paper',
    rows: [
      { sn: 1, size: '17×27/2', originalW: 13.5, originalH: 17, composingW: 12.5, composingH: 16 },
      { sn: 2, size: '17×27/4', originalW: 8.5, originalH: 13.5, composingW: 7.5, composingH: 12.5 },
      { sn: 3, size: '17×27/8', originalW: 8.5, originalH: 6.75, composingW: 7.5, composingH: 5.75 },
      { sn: 4, size: '17×27/16', originalW: 6.75, originalH: 4.25, composingW: 5.75, composingH: 3.25 },
      { sn: 5, size: '17×27/32', originalW: 4.25, originalH: 3.375, composingW: 3.75, composingH: 2.8 },
    ],
  },
  {
    id: '20x30',
    title: 'Paper Size (20 × 30)',
    sheetW: 20,
    sheetH: 30,
    unit: 'inch',
    paperTypeHint: 'Paper',
    rows: [
      { sn: 1, size: '20×30/2', originalW: 15, originalH: 20, composingW: 14, composingH: 19 },
      { sn: 2, size: '20×30/4', originalW: 10, originalH: 15, composingW: 9, composingH: 14 },
      { sn: 3, size: '20×30/8', originalW: 7.5, originalH: 10, composingW: 6.5, composingH: 9 },
      { sn: 4, size: '20×30/16', originalW: 5, originalH: 7.5, composingW: 4, composingH: 6.5 },
      { sn: 5, size: '20×30/32', originalW: 3.75, originalH: 5, composingW: 3, composingH: 4 },
    ],
  },
  {
    id: '22x28',
    title: 'Ivory Card (22 × 28)',
    sheetW: 22,
    sheetH: 28,
    unit: 'inch',
    paperTypeHint: 'Ivory Card',
    rows: [
      { sn: 1, size: '22×28/2', originalW: 14, originalH: 22, composingW: 13, composingH: 21 },
      { sn: 2, size: '22×28/4', originalW: 11, originalH: 14, composingW: 10, composingH: 13 },
      { sn: 3, size: '22×28/8', originalW: 7, originalH: 11, composingW: 6, composingH: 10 },
      { sn: 4, size: '22×28/16', originalW: 7, originalH: 5.5, composingW: 6, composingH: 4.5 },
      { sn: 5, size: '22×28/32', originalW: 5.5, originalH: 3.5, composingW: 4.5, composingH: 2.5 },
    ],
  },
  {
    id: '17x24',
    title: 'Carbonless (17 × 24)',
    sheetW: 17,
    sheetH: 24,
    unit: 'inch',
    paperTypeHint: 'NCR',
    rows: [
      { sn: 1, size: '17×24/2', originalW: 12, originalH: 17, composingW: 11, composingH: 16 },
      { sn: 2, size: '17×24/4', originalW: 8.5, originalH: 12, composingW: 7.5, composingH: 11 },
      { sn: 3, size: '17×24/8', originalW: 6, originalH: 8.5, composingW: 5, composingH: 7.5 },
      { sn: 4, size: '17×24/16', originalW: 4.25, originalH: 6, composingW: 3.25, composingH: 5 },
      { sn: 5, size: '17×24/32', originalW: 3, originalH: 4.25, composingW: 2.25, composingH: 3.25 },
    ],
  },
  {
    id: '25x30',
    title: 'Boxboard (25 × 30)',
    sheetW: 25,
    sheetH: 30,
    unit: 'inch',
    paperTypeHint: 'Other',
    rows: [
      { sn: 1, size: '25×30/2', originalW: 15, originalH: 25, composingW: 14, composingH: 24 },
      { sn: 2, size: '25×30/4', originalW: 12.5, originalH: 15, composingW: 11.5, composingH: 14 },
      { sn: 3, size: '25×30/8', originalW: 12.5, originalH: 7.5, composingW: 11.5, composingH: 6.5 },
      { sn: 4, size: '25×30/16', originalW: 12.5, originalH: 3.75, composingW: 11.5, composingH: 2.75 },
      { sn: 5, size: '25×30/32', originalW: 12.5, originalH: 1.75, composingW: 11.5, composingH: 1.25 },
    ],
  },
  {
    id: '23x36',
    title: 'Paper Size (23 × 36)',
    sheetW: 23,
    sheetH: 36,
    unit: 'inch',
    paperTypeHint: 'Paper',
    rows: [
      { sn: 1, size: '23×36/2', originalW: 18, originalH: 23, composingW: 17, composingH: 22 },
      { sn: 2, size: '23×36/4', originalW: 11.5, originalH: 18, composingW: 10.5, composingH: 17 },
      { sn: 3, size: '23×36/8', originalW: 9, originalH: 11.5, composingW: 8, composingH: 10.5 },
      { sn: 4, size: '23×36/16', originalW: 5.75, originalH: 9, composingW: 4.75, composingH: 8 },
      { sn: 5, size: '23×36/32', originalW: 4.5, originalH: 5.75, composingW: 3.5, composingH: 4.75 },
    ],
  },
];

export function applyComposingSize(form, chart, row, useComposing = true) {
  const w = useComposing ? row.composingW : row.originalW;
  const h = useComposing ? row.composingH : row.originalH;
  return {
    ...form,
    unit: chart.unit || 'inch',
    sheetPreset: chart.id,
    sheetWidth: chart.sheetW,
    sheetHeight: chart.sheetH,
    sheetUnit: chart.unit || 'inch',
    paperType: chart.paperTypeHint === 'Paper' ? form.paperType || 'Art Paper' : (chart.paperTypeHint || form.paperType),
    finishedWidth: w,
    finishedHeight: h,
    printWidth: w,
    printHeight: h,
    composingSizeLabel: row.size,
  };
}

export const PAPER_TYPES = [
  'Art Card', 'Art Paper', 'Offset Paper', 'Bond Paper', 'Maplitho',
  'Ivory Card', 'Kraft', 'NCR', 'Sticker', 'Vinyl', 'Other',
];

export const PRINT_METHODS = ['Offset', 'Digital', 'Screen', 'UV'];
export const COLOUR_OPTIONS = [
  { id: '1', label: 'Single Colour', plates: 1 },
  { id: '2', label: 'Two Colour', plates: 2 },
  { id: '4', label: 'Four Colour (CMYK)', plates: 4 },
];
export const SIDE_OPTIONS = [
  { id: '1', label: 'Single Side', multiplier: 1 },
  { id: '2', label: 'Double Side', multiplier: 2 },
];

export const FINISHING_PROCESSES = [
  { id: 'lamination', label: 'Lamination' },
  { id: 'spotUv', label: 'Spot UV' },
  { id: 'dieCutting', label: 'Die Cutting' },
  { id: 'numbering', label: 'Numbering' },
  { id: 'perforation', label: 'Perforation' },
  { id: 'folding', label: 'Folding' },
  { id: 'creasing', label: 'Creasing' },
  { id: 'emboss', label: 'Emboss' },
  { id: 'deboss', label: 'Deboss' },
  { id: 'foil', label: 'Foil' },
  { id: 'stitching', label: 'Stitching' },
  { id: 'binding', label: 'Binding' },
];

export const STORAGE_KEY = 'amz_printing_costings_v1';

export function toMm(value, unit) {
  const n = Number(value) || 0;
  return unit === 'inch' ? n * 25.4 : n;
}

export function fromMm(mm, unit) {
  const n = Number(mm) || 0;
  return unit === 'inch' ? n / 25.4 : n;
}

/** Best nest of finished pieces on one sheet (0° or 90°). */
export function optimizeSheetLayout({
  sheetW,
  sheetH,
  pieceW,
  pieceH,
  unit = 'mm',
  margin = 0,
}) {
  const sw = toMm(sheetW, unit) - toMm(margin, unit) * 2;
  const sh = toMm(sheetH, unit) - toMm(margin, unit) * 2;
  const pw = toMm(pieceW, unit);
  const ph = toMm(pieceH, unit);

  if (sw <= 0 || sh <= 0 || pw <= 0 || ph <= 0) {
    return {
      piecesPerSheet: 0,
      cols: 0,
      rows: 0,
      orientation: 'none',
      usedAreaMm2: 0,
      sheetAreaMm2: Math.max(0, toMm(sheetW, unit) * toMm(sheetH, unit)),
      wasteAreaMm2: 0,
      utilizationPct: 0,
    };
  }

  const layouts = [
    {
      orientation: 'horizontal',
      cols: Math.floor(sw / pw),
      rows: Math.floor(sh / ph),
      pieceW: pw,
      pieceH: ph,
    },
    {
      orientation: 'vertical',
      cols: Math.floor(sw / ph),
      rows: Math.floor(sh / pw),
      pieceW: ph,
      pieceH: pw,
    },
  ].map((L) => ({
    ...L,
    piecesPerSheet: Math.max(0, L.cols) * Math.max(0, L.rows),
  }));

  const best = layouts.reduce((a, b) => (b.piecesPerSheet > a.piecesPerSheet ? b : a));
  const sheetAreaMm2 = toMm(sheetW, unit) * toMm(sheetH, unit);
  const usedAreaMm2 = best.piecesPerSheet * pw * ph;
  const wasteAreaMm2 = Math.max(0, sheetAreaMm2 - usedAreaMm2);
  const utilizationPct = sheetAreaMm2 > 0 ? (usedAreaMm2 / sheetAreaMm2) * 100 : 0;

  return {
    piecesPerSheet: best.piecesPerSheet,
    cols: best.cols,
    rows: best.rows,
    orientation: best.orientation,
    usedAreaMm2,
    sheetAreaMm2,
    wasteAreaMm2,
    utilizationPct,
    altLayouts: layouts,
  };
}

export function emptyFinishingState() {
  return FINISHING_PROCESSES.reduce((acc, p) => {
    acc[p.id] = { enabled: false, mode: 'perPiece', amount: 0 };
    return acc;
  }, {});
}

export function defaultFullForm() {
  return {
    productName: '',
    jobName: '',
    quantity: 1000,
    finishedWidth: 4,
    finishedHeight: 6.5,
    unit: 'inch',
    paperType: 'Art Card',
    sheetPreset: '20x30',
    sheetWidth: 20,
    sheetHeight: 30,
    sheetUnit: 'inch',
    paperCostPerSheet: 50,
    printWidth: 4,
    printHeight: 6.5,
    margin: 0,
    wastagePct: 5,
    printMethod: 'Offset',
    colour: '4',
    sides: '1',
    machineCostPerSheet: 2,
    platePrice: 800,
    finishing: emptyFinishingState(),
    labourCost: 0,
    packingCost: 0,
    deliveryCost: 0,
    miscCost: 0,
    composingSizeLabel: '',
  };
}

export function applySheetPreset(form, presetId) {
  const preset = PAPER_SHEET_PRESETS.find((p) => p.id === presetId) || PAPER_SHEET_PRESETS[1];
  if (preset.id === 'custom') {
    return { ...form, sheetPreset: 'custom' };
  }
  return {
    ...form,
    sheetPreset: preset.id,
    sheetWidth: preset.w,
    sheetHeight: preset.h,
    sheetUnit: preset.unit,
  };
}

export function calculateFullCost(form) {
  const qty = Math.max(0, Number(form.quantity) || 0);
  const pieceW = Number(form.printWidth || form.finishedWidth) || 0;
  const pieceH = Number(form.printHeight || form.finishedHeight) || 0;

  // Nest using print size on sheet; sheet may be in different unit than finished unit
  const sheetUnit = form.sheetUnit || form.unit || 'mm';
  const pieceUnit = form.unit || 'mm';

  // Convert piece dims into sheet unit for layout
  const pieceWInSheetUnit = fromMm(toMm(pieceW, pieceUnit), sheetUnit);
  const pieceHInSheetUnit = fromMm(toMm(pieceH, pieceUnit), sheetUnit);

  const layout = optimizeSheetLayout({
    sheetW: form.sheetWidth,
    sheetH: form.sheetHeight,
    pieceW: pieceWInSheetUnit,
    pieceH: pieceHInSheetUnit,
    unit: sheetUnit,
    margin: form.margin || 0,
  });

  const piecesPerSheet = layout.piecesPerSheet;
  const rawSheets = piecesPerSheet > 0 ? qty / piecesPerSheet : 0;
  const requiredSheets = Math.ceil(rawSheets);
  const wastagePct = Math.max(0, Number(form.wastagePct) || 0);
  const wastageSheets = Math.ceil(requiredSheets * (wastagePct / 100));
  const finalSheets = requiredSheets + wastageSheets;

  const paperCost = finalSheets * (Number(form.paperCostPerSheet) || 0);

  const colour = COLOUR_OPTIONS.find((c) => c.id === String(form.colour)) || COLOUR_OPTIONS[2];
  const sides = SIDE_OPTIONS.find((s) => s.id === String(form.sides)) || SIDE_OPTIONS[0];
  const platesRequired = colour.plates;
  const plateCost = platesRequired * (Number(form.platePrice) || 0);

  const printPerSheet = (Number(form.machineCostPerSheet) || 0) * sides.multiplier;
  const printingCost = finalSheets * printPerSheet;

  let finishingCost = 0;
  const finishingBreakdown = [];
  FINISHING_PROCESSES.forEach((proc) => {
    const row = form.finishing?.[proc.id];
    if (!row?.enabled) return;
    const amount = Number(row.amount) || 0;
    const cost = row.mode === 'fixed' ? amount : amount * qty;
    finishingCost += cost;
    finishingBreakdown.push({ id: proc.id, label: proc.label, mode: row.mode, amount, cost });
  });

  const labourCost = Number(form.labourCost) || 0;
  const packingCost = Number(form.packingCost) || 0;
  const deliveryCost = Number(form.deliveryCost) || 0;
  const miscCost = Number(form.miscCost) || 0;

  const totalProductionCost =
    paperCost + plateCost + printingCost + finishingCost + labourCost + packingCost + deliveryCost + miscCost;
  const costPerPiece = qty > 0 ? totalProductionCost / qty : 0;

  return {
    layout,
    piecesPerSheet,
    requiredSheets,
    wastageSheets,
    finalSheets,
    paperCost,
    platesRequired,
    plateCost,
    printPerSheet,
    printingCost,
    finishingCost,
    finishingBreakdown,
    labourCost,
    packingCost,
    deliveryCost,
    miscCost,
    totalProductionCost,
    costPerPiece,
    utilizationPct: layout.utilizationPct,
    wasteAreaMm2: layout.wasteAreaMm2,
    usedAreaMm2: layout.usedAreaMm2,
    sheetAreaMm2: layout.sheetAreaMm2,
    orientation: layout.orientation,
    cols: layout.cols,
    rows: layout.rows,
  };
}

export function loadSavedCostings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function persistSavedCostings(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 100)));
}

export function saveCosting(entry) {
  const list = loadSavedCostings();
  const next = [{ ...entry, id: entry.id || `cost_${Date.now()}`, savedAt: new Date().toISOString() }, ...list];
  persistSavedCostings(next);
  return next;
}

export function deleteCosting(id) {
  const next = loadSavedCostings().filter((x) => x.id !== id);
  persistSavedCostings(next);
  return next;
}

export function formatArea(mm2, unit = 'mm') {
  if (unit === 'inch') {
    const in2 = mm2 / (25.4 * 25.4);
    return `${in2.toFixed(2)} in²`;
  }
  return `${(mm2 / 100).toFixed(1)} cm²`;
}
