import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { gasRequest } from '@/services/gasClient';

const BRAND_CACHE_KEY = 'amz_erp_brand_v1';

const defaultBrand = {
  company: {
    name: 'AMZ Prints',
    tagline: 'Professional Printing & Advertising Services',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxId: '',
    authorizedSignatory: 'Authorized Person',
    logo: '',
    stamp: '',
    signature: '',
  },
  theme: {
    primary: '#F26522',
    secondary: '#2E2E2E',
    accent: '#10B981',
  },
  invoice: {
    prefix: 'INV-',
    taxRate: 0,
    terms: 'Payment due within 30 days.',
    showQR: true,
    showStamp: true,
    showSignature: true,
    template: 'classic',
  },
};

function readCachedBrand() {
  try {
    const raw = localStorage.getItem(BRAND_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.company) return null;
    return {
      company: { ...defaultBrand.company, ...(parsed.company || {}) },
      theme: { ...defaultBrand.theme, ...(parsed.theme || {}) },
      invoice: { ...defaultBrand.invoice, ...(parsed.invoice || {}) },
    };
  } catch {
    return null;
  }
}

function writeCachedBrand(brand) {
  try {
    localStorage.setItem(BRAND_CACHE_KEY, JSON.stringify({
      company: brand.company,
      theme: brand.theme,
      invoice: brand.invoice,
    }));
  } catch {
    /* quota */
  }
}

function pickImageField(data, topKey, nestedVal) {
  // Top-level keys win even when empty (clear stamp/signature must stick)
  if (Object.prototype.hasOwnProperty.call(data, topKey)) return data[topKey] || '';
  return nestedVal || '';
}

function normalizeBrandPayload(data) {
  if (!data || typeof data !== 'object') return null;
  const companyRaw = typeof data.company === 'object' ? data.company : {};
  const company = { ...defaultBrand.company, ...companyRaw };
  company.logo = pickImageField(data, 'companyLogo', company.logo);
  company.stamp = pickImageField(data, 'companyStamp', company.stamp);
  company.signature = pickImageField(data, 'companySignature', company.signature);
  return {
    company,
    theme: { ...defaultBrand.theme, ...(typeof data.theme === 'object' ? data.theme : {}) },
    invoice: { ...defaultBrand.invoice, ...(typeof data.invoice === 'object' ? data.invoice : {}) },
  };
}

function imgSig(v) {
  if (!v) return '0';
  const s = String(v);
  // Prefix of data-URLs is identical — use length + tail so stamp/signature changes detect
  return `${s.length}:${s.slice(-80)}`;
}

function brandSignature(b) {
  if (!b) return '';
  return [
    b.company?.name,
    b.company?.tagline,
    b.company?.authorizedSignatory,
    imgSig(b.company?.logo),
    imgSig(b.company?.stamp),
    imgSig(b.company?.signature),
    b.theme?.primary,
    b.invoice?.showStamp,
    b.invoice?.showSignature,
    b.invoice?.template,
  ].join('|');
}

const BrandContext = createContext(null);

export const useBrand = () => {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrand must be used within BrandProvider');
  return ctx;
};

/** Only mounts inside authenticated app shell — never on /login. */
export const BrandProvider = ({ children }) => {
  const initial = useRef(readCachedBrand());
  const [brand, setBrand] = useState(initial.current || defaultBrand);
  const [loading, setLoading] = useState(!initial.current);
  const booted = useRef(false);
  const sigRef = useRef(brandSignature(initial.current || defaultBrand));

  const applyTheme = useCallback((theme) => {
    const root = document.documentElement;
    if (theme?.primary) root.style.setProperty('--brand-primary', theme.primary);
    if (theme?.secondary) root.style.setProperty('--brand-secondary', theme.secondary);
    if (theme?.accent) root.style.setProperty('--brand-accent', theme.accent);
  }, []);

  const applyBrand = useCallback((next) => {
    if (!next) return;
    const sig = brandSignature(next);
    if (sig === sigRef.current) return;
    sigRef.current = sig;
    setBrand(next);
    applyTheme(next.theme);
    writeCachedBrand(next);
  }, [applyTheme]);

  const refreshBrand = useCallback(async () => {
    try {
      const pub = await gasRequest('GET', '/public/branding');
      const next = normalizeBrandPayload(pub.data);
      if (next) applyBrand(next);
    } catch {
      /* keep cache */
    } finally {
      setLoading(false);
    }
  }, [applyBrand]);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    if (initial.current?.theme) applyTheme(initial.current.theme);
    setLoading(false);
    refreshBrand();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({ brand, loading, refreshBrand, primary: brand.theme.primary, company: brand.company }),
    [brand, loading, refreshBrand]
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
};

export default BrandContext;
