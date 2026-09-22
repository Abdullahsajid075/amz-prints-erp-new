/**
 * Internal printing production cost engine.
 * All dimensions normalized to mm for area math.
 *
 * Paper cost: (sheets / 500) × ream rate (price of 500 sheets).
 * Colour plate + tracing: fixed costs by colour count (editable in Rates).
 */

export const REAM_SHEETS = 500;
export const RATES_STORAGE_KEY = 'amz_paper_ream_rates_v1';
export const COLOUR_PLATE_STORAGE_KEY = 'amz_colour_plate_costs_v1';

export const PAPER_CATEGORIES = [
  { id: 'paper_sheet', label: 'Paper Sheet' },
  { id: 'box_board', label: 'Box Board Card' },
  { id: 'every_card', label: 'Every Card' },
  { id: 'carbonless', label: 'Carbon Less' },
];

export const PAPER_QUALITIES = [
  { id: 'normal', label: 'Normal' },
  { id: 'good', label: 'Good' },
];

/** Default ream rates from shop price list (Rs per 500 sheets). Editable in calculator Rates tab. */
export const DEFAULT_REAM_RATES = [
  // Paper Sheet 23 × 36
  { id: 'ps_23x36_55_n', category: 'paper_sheet', sizeId: '23x36', sizeLabel: '23 × 36 in', gsm: '55', quality: 'normal', rate500: 3100 },
  { id: 'ps_23x36_55_g', category: 'paper_sheet', sizeId: '23x36', sizeLabel: '23 × 36 in', gsm: '55', quality: 'good', rate500: 0 },
  { id: 'ps_23x36_68_n', category: 'paper_sheet', sizeId: '23x36', sizeLabel: '23 × 36 in', gsm: '68', quality: 'normal', rate500: 4600 },
  { id: 'ps_23x36_68_g', category: 'paper_sheet', sizeId: '23x36', sizeLabel: '23 × 36 in', gsm: '68', quality: 'good', rate500: 5500 },
  { id: 'ps_23x36_70_n', category: 'paper_sheet', sizeId: '23x36', sizeLabel: '23 × 36 in', gsm: '70', quality: 'normal', rate500: 8500 },
  { id: 'ps_23x36_70_g', category: 'paper_sheet', sizeId: '23x36', sizeLabel: '23 × 36 in', gsm: '70', quality: 'good', rate500: 7800 },
  { id: 'ps_23x36_80_n', category: 'paper_sheet', sizeId: '23x36', sizeLabel: '23 × 36 in', gsm: '80', quality: 'normal', rate500: 10000 },
  { id: 'ps_23x36_80_g', category: 'paper_sheet', sizeId: '23x36', sizeLabel: '23 × 36 in', gsm: '80', quality: 'good', rate500: 9000 },
  { id: 'ps_23x36_100_n', category: 'paper_sheet', sizeId: '23x36', sizeLabel: '23 × 36 in', gsm: '100', quality: 'normal', rate500: 12000 },
  { id: 'ps_23x36_100_g', category: 'paper_sheet', sizeId: '23x36', sizeLabel: '23 × 36 in', gsm: '100', quality: 'good', rate500: 11000 },

  // Box Board Card
  { id: 'bb_22x28_r_n', category: 'box_board', sizeId: '22x28', sizeLabel: '22 × 28 in', gsm: 'R', quality: 'normal', rate500: 0 },
  { id: 'bb_22x28_r_g', category: 'box_board', sizeId: '22x28', sizeLabel: '22 × 28 in', gsm: 'R', quality: 'good', rate500: 2100 },
  { id: 'bb_25x30_r_n', category: 'box_board', sizeId: '25x30', sizeLabel: '25 × 30 in', gsm: 'R', quality: 'normal', rate500: 0 },
  { id: 'bb_25x30_r_g', category: 'box_board', sizeId: '25x30', sizeLabel: '25 × 30 in', gsm: 'R', quality: 'good', rate500: 2500 },

  // Paper Sheet 20 × 30
  { id: 'ps_20x30_55_n', category: 'paper_sheet', sizeId: '20x30', sizeLabel: '20 × 30 in', gsm: '55', quality: 'normal', rate500: 2600 },
  { id: 'ps_20x30_55_g', category: 'paper_sheet', sizeId: '20x30', sizeLabel: '20 × 30 in', gsm: '55', quality: 'good', rate500: 0 },
  { id: 'ps_20x30_68_n', category: 'paper_sheet', sizeId: '20x30', sizeLabel: '20 × 30 in', gsm: '68', quality: 'normal', rate500: 3400 },
  { id: 'ps_20x30_68_g', category: 'paper_sheet', sizeId: '20x30', sizeLabel: '20 × 30 in', gsm: '68', quality: 'good', rate500: 3700 },
  { id: 'ps_20x30_70_n', category: 'paper_sheet', sizeId: '20x30', sizeLabel: '20 × 30 in', gsm: '70', quality: 'normal', rate500: 6500 },
  { id: 'ps_20x30_70_g', category: 'paper_sheet', sizeId: '20x30', sizeLabel: '20 × 30 in', gsm: '70', quality: 'good', rate500: 5800 },
  { id: 'ps_20x30_80_n', category: 'paper_sheet', sizeId: '20x30', sizeLabel: '20 × 30 in', gsm: '80', quality: 'normal', rate500: 7600 },
  { id: 'ps_20x30_80_g', category: 'paper_sheet', sizeId: '20x30', sizeLabel: '20 × 30 in', gsm: '80', quality: 'good', rate500: 0 },
  { id: 'ps_20x30_100_n', category: 'paper_sheet', sizeId: '20x30', sizeLabel: '20 × 30 in', gsm: '100', quality: 'normal', rate500: 9000 },
  { id: 'ps_20x30_100_g', category: 'paper_sheet', sizeId: '20x30', sizeLabel: '20 × 30 in', gsm: '100', quality: 'good', rate500: 0 },

  // Every Card 22 × 25
  { id: 'ec_22x25_r_n', category: 'every_card', sizeId: '22x25', sizeLabel: '22 × 25 in', gsm: 'R', quality: 'normal', rate500: 0 },
  { id: 'ec_22x25_r_g', category: 'every_card', sizeId: '22x25', sizeLabel: '22 × 25 in', gsm: 'R', quality: 'good', rate500: 2600 },

  // Carbon Less 22 × 25
  { id: 'cl_22x25_r_n', category: 'carbonless', sizeId: '22x25', sizeLabel: '22 × 25 in', gsm: 'R', quality: 'normal', rate500: 3200 },
  { id: 'cl_22x25_r_g', category: 'carbonless', sizeId: '22x25', sizeLabel: '22 × 25 in', gsm: 'R', quality: 'good', rate500: 3400 },

  // Paper Sheet 17 × 27 (Good rates)
  { id: 'ps_17x27_55_n', category: 'paper_sheet', sizeId: '17x27', sizeLabel: '17 × 27 in', gsm: '55', quality: 'normal', rate500: 0 },
  { id: 'ps_17x27_55_g', category: 'paper_sheet', sizeId: '17x27', sizeLabel: '17 × 27 in', gsm: '55', quality: 'good', rate500: 1800 },
  { id: 'ps_17x27_68_n', category: 'paper_sheet', sizeId: '17x27', sizeLabel: '17 × 27 in', gsm: '68', quality: 'normal', rate500: 0 },
  { id: 'ps_17x27_68_g', category: 'paper_sheet', sizeId: '17x27', sizeLabel: '17 × 27 in', gsm: '68', quality: 'good', rate500: 2600 },
  { id: 'ps_17x27_70_n', category: 'paper_sheet', sizeId: '17x27', sizeLabel: '17 × 27 in', gsm: '70', quality: 'normal', rate500: 0 },
  { id: 'ps_17x27_70_g', category: 'paper_sheet', sizeId: '17x27', sizeLabel: '17 × 27 in', gsm: '70', quality: 'good', rate500: 5200 },
  { id: 'ps_17x27_80_n', category: 'paper_sheet', sizeId: '17x27', sizeLabel: '17 × 27 in', gsm: '80', quality: 'normal', rate500: 0 },
  { id: 'ps_17x27_80_g', category: 'paper_sheet', sizeId: '17x27', sizeLabel: '17 × 27 in', gsm: '80', quality: 'good', rate500: 5600 },
  { id: 'ps_17x27_100_n', category: 'paper_sheet', sizeId: '17x27', sizeLabel: '17 × 27 in', gsm: '100', quality: 'normal', rate500: 0 },
  { id: 'ps_17x27_100_g', category: 'paper_sheet', sizeId: '17x27', sizeLabel: '17 × 27 in', gsm: '100', quality: 'good', rate500: 7000 },
];

/** Fixed printing plates + tracing cost by colour (Rs total, not per plate). */
export const DEFAULT_COLOUR_PLATE_COSTS = {
  1: 1200,
  2: 2000,
  4: 3000,
};

export const PAPER_SHEET_PRESETS = [
  { id: '17x27', label: '17 × 27 in', w: 17, h: 27, unit: 'inch' },
  { id: '20x30', label: '20 × 30 in', w: 20, h: 30, unit: 'inch' },
  { id: '22x25', label: '22 × 25 in', w: 22, h: 25, unit: 'inch' },
  { id: '22x28', label: '22 × 28 in', w: 22, h: 28, unit: 'inch' },
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

export function loadReamRates() {
  try {
    const raw = localStorage.getItem(RATES_STORAGE_KEY);
    if (!raw) return DEFAULT_REAM_RATES.map((r) => ({ ...r }));
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return DEFAULT_REAM_RATES.map((r) => ({ ...r }));
    // Merge saved rates onto defaults so new catalog rows appear after updates
    const byId = Object.fromEntries(parsed.map((r) => [r.id, r]));
    return DEFAULT_REAM_RATES.map((def) => {
      const saved = byId[def.id];
      if (!saved) return { ...def };
      return { ...def, rate500: Number(saved.rate500) || 0 };
    });
  } catch {
    return DEFAULT_REAM_RATES.map((r) => ({ ...r }));
  }
}

export function saveReamRates(rates) {
  const list = Array.isArray(rates) ? rates : [];
  localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(list));
  return list;
}

export function resetReamRates() {
  localStorage.removeItem(RATES_STORAGE_KEY);
  return DEFAULT_REAM_RATES.map((r) => ({ ...r }));
}

export function loadColourPlateCosts() {
  try {
    const raw = localStorage.getItem(COLOUR_PLATE_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_COLOUR_PLATE_COSTS };
    const parsed = JSON.parse(raw);
    return {
      1: Number(parsed[1] ?? parsed['1']) || DEFAULT_COLOUR_PLATE_COSTS[1],
      2: Number(parsed[2] ?? parsed['2']) || DEFAULT_COLOUR_PLATE_COSTS[2],
      4: Number(parsed[4] ?? parsed['4']) || DEFAULT_COLOUR_PLATE_COSTS[4],
    };
  } catch {
    return { ...DEFAULT_COLOUR_PLATE_COSTS };
  }
}

export function saveColourPlateCosts(costs) {
  const next = {
    1: Number(costs[1] ?? costs['1']) || 0,
    2: Number(costs[2] ?? costs['2']) || 0,
    4: Number(costs[4] ?? costs['4']) || 0,
  };
  localStorage.setItem(COLOUR_PLATE_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function resetColourPlateCosts() {
  localStorage.removeItem(COLOUR_PLATE_STORAGE_KEY);
  return { ...DEFAULT_COLOUR_PLATE_COSTS };
}

export function lookupReamRate(rates, { category, sizeId, gsm, quality }) {
  const list = Array.isArray(rates) ? rates : DEFAULT_REAM_RATES;
  return list.find((r) => (
    r.category === category
    && r.sizeId === sizeId
    && String(r.gsm) === String(gsm)
    && r.quality === quality
  )) || null;
}

export function sizesForCategory(rates, category) {
  const seen = new Set();
  const out = [];
  (rates || DEFAULT_REAM_RATES).forEach((r) => {
    if (r.category !== category || seen.has(r.sizeId)) return;
    seen.add(r.sizeId);
    out.push({ id: r.sizeId, label: r.sizeLabel });
  });
  return out;
}

export function gsmsForSelection(rates, category, sizeId) {
  const seen = new Set();
  const out = [];
  (rates || DEFAULT_REAM_RATES).forEach((r) => {
    if (r.category !== category || r.sizeId !== sizeId || seen.has(String(r.gsm))) return;
    seen.add(String(r.gsm));
    out.push(String(r.gsm));
  });
  return out;
}

export function applyPaperSelection(form, rates, patch = {}) {
  const next = { ...form, ...patch };
  const category = next.paperCategory || 'paper_sheet';
  const sizes = sizesForCategory(rates, category);
  if (!sizes.some((s) => s.id === next.paperSizeId)) {
    next.paperSizeId = sizes[0]?.id || next.paperSizeId;
  }
  const gsms = gsmsForSelection(rates, category, next.paperSizeId);
  if (!gsms.includes(String(next.paperGsm))) {
    next.paperGsm = gsms[0] || next.paperGsm;
  }
  const row = lookupReamRate(rates, {
    category,
    sizeId: next.paperSizeId,
    gsm: next.paperGsm,
    quality: next.paperQuality || 'normal',
  });
  // If selected quality has no rate, try the other quality
  let rateRow = row;
  if (!rateRow || !(Number(rateRow.rate500) > 0)) {
    const altQ = (next.paperQuality || 'normal') === 'normal' ? 'good' : 'normal';
    const alt = lookupReamRate(rates, {
      category,
      sizeId: next.paperSizeId,
      gsm: next.paperGsm,
      quality: altQ,
    });
    if (alt && Number(alt.rate500) > 0) {
      next.paperQuality = altQ;
      rateRow = alt;
    }
  }
  next.reamRate500 = rateRow ? (Number(rateRow.rate500) || 0) : (Number(next.reamRate500) || 0);
  next.paperCostPerSheet = next.reamRate500 / REAM_SHEETS;

  const preset = PAPER_SHEET_PRESETS.find((p) => p.id === next.paperSizeId);
  if (preset && preset.id !== 'custom') {
    next.sheetPreset = preset.id;
    next.sheetWidth = preset.w;
    next.sheetHeight = preset.h;
    next.sheetUnit = preset.unit;
  }

  const catLabel = PAPER_CATEGORIES.find((c) => c.id === category)?.label || category;
  next.paperType = catLabel;
  return next;
}

export function applyColourPlateCost(form, plateCosts, colourId) {
  const key = String(colourId ?? form.colour ?? '4');
  const costs = plateCosts || DEFAULT_COLOUR_PLATE_COSTS;
  return {
    ...form,
    colour: key,
    colourPlateCost: Number(costs[key] ?? costs[Number(key)]) || 0,
  };
}

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
  { id: '1', label: 'Single Colour', plates: 1, defaultPlateCost: 1200 },
  { id: '2', label: 'Two Colour', plates: 2, defaultPlateCost: 2000 },
  { id: '4', label: 'Four Colour (CMYK)', plates: 4, defaultPlateCost: 3000 },
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

export function defaultFullForm(rates, plateCosts) {
  const base = {
    productName: '',
    jobName: '',
    quantity: 1000,
    finishedWidth: 4,
    finishedHeight: 6.5,
    unit: 'inch',
    paperCategory: 'paper_sheet',
    paperSizeId: '20x30',
    paperGsm: '80',
    paperQuality: 'normal',
    paperType: 'Paper Sheet',
    sheetPreset: '20x30',
    sheetWidth: 20,
    sheetHeight: 30,
    sheetUnit: 'inch',
    reamRate500: 7600,
    paperCostPerSheet: 7600 / REAM_SHEETS,
    printWidth: 4,
    printHeight: 6.5,
    margin: 0,
    wastagePct: 5,
    printMethod: 'Offset',
    colour: '4',
    sides: '1',
    machineCostPerSheet: 0,
    colourPlateCost: 3000,
    platePrice: 0,
    finishing: emptyFinishingState(),
    labourCost: 0,
    packingCost: 0,
    deliveryCost: 0,
    miscCost: 0,
    composingSizeLabel: '',
  };
  const withPaper = applyPaperSelection(base, rates || DEFAULT_REAM_RATES, {});
  return applyColourPlateCost(withPaper, plateCosts || DEFAULT_COLOUR_PLATE_COSTS, withPaper.colour);
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

  // Paper: (sheets ÷ 500) × ream price. Fallback from legacy per-sheet field.
  const reamRate = Number(form.reamRate500) > 0
    ? Number(form.reamRate500)
    : (Number(form.paperCostPerSheet) || 0) * REAM_SHEETS;
  const paperCost = (finalSheets / REAM_SHEETS) * reamRate;
  const reamsUsed = finalSheets / REAM_SHEETS;

  const colour = COLOUR_OPTIONS.find((c) => c.id === String(form.colour)) || COLOUR_OPTIONS[2];
  const sides = SIDE_OPTIONS.find((s) => s.id === String(form.sides)) || SIDE_OPTIONS[0];
  const platesRequired = colour.plates;
  // Fixed plates + tracing cost for selected colour (not per-plate × count)
  const plateCost = Number(form.colourPlateCost) > 0
    ? Number(form.colourPlateCost)
    : (Number(colour.defaultPlateCost) || (platesRequired * (Number(form.platePrice) || 0)));

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
    reamRate500: reamRate,
    reamsUsed,
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
