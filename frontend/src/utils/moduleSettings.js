import { POS_MAJOR_SERVICES } from '@/utils/printHelpers';

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
};

export const DEFAULT_POS_SETTINGS = {
  requireRegister: true,
  showCalculator: true,
  showWebsiteQr: true,
  showInvoiceQr: true,
  poweredBy: 'Powered By Amazon ERP',
  slipServices: POS_MAJOR_SERVICES,
  defaultPayment: 'Cash',
};

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
  };
}

export function mergePosSettings(api = {}) {
  const pos = asObject(api.pos);
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
  };
}
