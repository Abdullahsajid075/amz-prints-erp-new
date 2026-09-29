import { POS_MAJOR_SERVICES } from './printHelpers.js';
import { DEFAULT_INVENTORY_MODE, parseInventoryMode } from './inventoryMode.js';

export const DEFAULT_PRODUCT_CATEGORIES = [
  'Business Cards', 'Flyers & Brochures', 'Posters', 'Banners', 'Stickers & Labels',
  'Books & Magazines', 'Packaging', 'Signage', 'Apparel Printing', 'Photo Prints', 'Services', 'Other',
];

export const DEFAULT_PRODUCT_MATERIALS = [
  'Premium Card Stock', 'Matte Paper', 'Glossy Paper', 'Vinyl', 'Canvas',
  'PVC', 'Fabric', 'Metal', 'Acrylic', 'Corrugated',
];

export const DEFAULT_INVENTORY_SETTINGS = {
  trackStock: true,
  allowNegativeStock: false,
  deductOnSale: true,
  defaultLowStock: 5,
  categories: DEFAULT_PRODUCT_CATEGORIES,
  materials: DEFAULT_PRODUCT_MATERIALS,
  inventoryMode: DEFAULT_INVENTORY_MODE,
};

export const POS_STICKER_PRESETS = [
  { id: 'pos80', label: 'POS 80×40 mm', widthMm: 80, heightMm: 40 },
  { id: '50x30', label: '50×30 mm', widthMm: 50, heightMm: 30 },
  { id: '40x30', label: '40×30 mm', widthMm: 40, heightMm: 30 },
];

export const DEFAULT_POS_SETTINGS = {
  requireRegister: true,
  showCalculator: true,
  showWebsiteQr: true,
  showInvoiceQr: true,
  poweredBy: 'Powered By Amazon ERP',
  slipServices: POS_MAJOR_SERVICES,
  defaultPayment: 'Cash',
  barcodeScan: true,
  stickerWidthMm: 80,
  stickerHeightMm: 40,
  stickerMarginMm: 2,
  showBarcode: true,
};

/** Inventory tags print on the POS 80mm sticker roll (CODE128). */
export function posStickerPayload(cfg = {}) {
  const widthMm = Number(cfg.stickerWidthMm ?? cfg.widthMm) || 80;
  const heightMm = Number(cfg.stickerHeightMm ?? cfg.heightMm) || 40;
  const marginRaw = Number(cfg.stickerMarginMm ?? cfg.marginMm);
  return {
    widthMm,
    heightMm,
    marginMm: Number.isFinite(marginRaw) ? marginRaw : 2,
    showBarcode: cfg.showBarcode !== false,
  };
}

function stickerFromApi(pos, tags) {
  if (pos.stickerWidthMm != null || pos.stickerHeightMm != null) {
    return {
      stickerWidthMm: Number(pos.stickerWidthMm) || 80,
      stickerHeightMm: Number(pos.stickerHeightMm) || 40,
      stickerMarginMm: Number.isFinite(Number(pos.stickerMarginMm)) ? Number(pos.stickerMarginMm) : 2,
      showBarcode: pos.showBarcode !== false,
    };
  }
  const w = Number(tags.widthMm);
  const h = Number(tags.heightMm);
  // Old inventory default was 40×25 — migrate to the POS 80mm sticker roll.
  if ((w === 40 && h === 25) || !(w > 0 && h > 0)) {
    return {
      stickerWidthMm: 80,
      stickerHeightMm: 40,
      stickerMarginMm: Number.isFinite(Number(tags.marginMm)) ? Number(tags.marginMm) : 2,
      showBarcode: tags.showBarcode !== false,
    };
  }
  return {
    stickerWidthMm: w,
    stickerHeightMm: h,
    stickerMarginMm: Number.isFinite(Number(tags.marginMm)) ? Number(tags.marginMm) : 2,
    showBarcode: tags.showBarcode !== false,
  };
}

function asObject(raw) {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function asStringList(value, fallback) {
  if (Array.isArray(value) && value.length) {
    return value.map((v) => {
      if (v && typeof v === 'object') return String(v.name || '').trim();
      return String(v || '').trim();
    }).filter(Boolean);
  }
  return [...fallback];
}

export function normalizeCatalogItems(value, fallback = []) {
  const raw = Array.isArray(value) && value.length ? value : fallback;
  const seen = new Set();
  const out = [];
  raw.forEach((item) => {
    const name = typeof item === 'string' ? item.trim() : String(item?.name || '').trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({
      name,
      active: typeof item === 'object' ? item.active !== false : true,
    });
  });
  return out;
}

export function activeCatalogNames(items, fallback = []) {
  const list = normalizeCatalogItems(items, fallback);
  const active = list.filter((i) => i.active !== false).map((i) => i.name);
  return active.length ? active : [...fallback];
}

export function mergeInventorySettings(api = {}) {
  const inv = asObject(api.inventory);
  const prod = asObject(api.products);
  return {
    ...DEFAULT_INVENTORY_SETTINGS,
    trackStock: inv.trackStock != null ? !!inv.trackStock : prod.trackStock !== false,
    allowNegativeStock: !!(inv.allowNegativeStock ?? prod.allowNegativeStock),
    deductOnSale: inv.deductOnSale !== false,
    defaultLowStock: Number(inv.defaultLowStock != null ? inv.defaultLowStock : 5) || 5,
    categories: activeCatalogNames(inv.categories || prod.categories, DEFAULT_PRODUCT_CATEGORIES),
    materials: activeCatalogNames(inv.materials || prod.materials, DEFAULT_PRODUCT_MATERIALS),
    categoryItems: normalizeCatalogItems(inv.categoryItems || inv.categories || prod.categories, DEFAULT_PRODUCT_CATEGORIES),
    materialItems: normalizeCatalogItems(inv.materialItems || inv.materials || prod.materials, DEFAULT_PRODUCT_MATERIALS),
    inventoryMode: parseInventoryMode(inv.inventoryMode || api.inventoryMode),
  };
}

export function mergePosSettings(api = {}) {
  const pos = asObject(api.pos);
  const tags = asObject(api.priceTags);
  const sticker = stickerFromApi(pos, tags);
  return {
    ...DEFAULT_POS_SETTINGS,
    ...pos,
    requireRegister: true,
    showCalculator: pos.showCalculator !== false,
    showWebsiteQr: true,
    showInvoiceQr: true,
    poweredBy: String(pos.poweredBy || DEFAULT_POS_SETTINGS.poweredBy),
    slipServices: asStringList(pos.slipServices, POS_MAJOR_SERVICES),
    defaultPayment: pos.defaultPayment || 'Cash',
    barcodeScan: pos.barcodeScan !== false,
    ...sticker,
  };
}
