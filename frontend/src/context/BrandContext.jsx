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
    /* quota — often from huge logos; keep UI brand anyway */
  }
}

function normalizeBrandPayload(data) {
  if (!data || typeof data !== 'object') return null;
  const companyRaw = typeof data.company === 'object' ? data.company : {};
  const company = { ...defaultBrand.company, ...companyRaw };
  if (data.companyLogo && !company.logo) company.logo = data.companyLogo;
  if (data.companyStamp && !company.stamp) company.stamp = data.companyStamp;
  return {
    company,
    theme: { ...defaultBrand.theme, ...(typeof data.theme === 'object' ? data.theme : {}) },
    invoice: { ...defaultBrand.invoice, ...(typeof data.invoice === 'object' ? data.invoice : {}) },
  };
}

function brandSignature(b) {
  if (!b) return '';
  return [
    b.company?.name,
    b.company?.tagline,
    b.company?.logo ? String(b.company.logo).slice(0, 64) : '',
    b.company?.logo ? String(b.company.logo).length : 0,
    b.theme?.primary,
  ].join('|');
}

const BrandContext = createContext(null);

export const useBrand = () => {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrand must be used within BrandProvider');
  return ctx;
};

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
    // Skip no-op updates — prevents login logo flicker / re-render loops
    if (sig === sigRef.current) return;
    sigRef.current = sig;
    setBrand(next);
    applyTheme(next.theme);
    writeCachedBrand(next);
  }, [applyTheme]);

  const refreshBrand = useCallback(async () => {
    setLoading(false);
    try {
      const pub = await gasRequest('GET', '/public/branding');
      const next = normalizeBrandPayload(pub.data);
      if (next) applyBrand(next);
    } catch {
      /* keep cached / default — never redirect */
    } finally {
      setLoading(false);
    }
  }, [applyBrand]);

  // Mount once. On /login skip network fetch — huge logo payloads were thrashing the form.
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    if (initial.current?.theme) applyTheme(initial.current.theme);
    setLoading(false);
    const path = typeof window !== 'undefined' ? window.location.pathname || '' : '';
    if (path === '/login' || path.endsWith('/login')) return;
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
