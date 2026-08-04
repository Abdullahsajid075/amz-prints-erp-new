import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { settingsAPI } from '@/services/api';
import { gasRequest } from '@/services/gasClient';
import { tokenStorage } from '@/services/tokenStorage';

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
    /* quota */
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

const BrandContext = createContext(null);

export const useBrand = () => {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrand must be used within BrandProvider');
  return ctx;
};

export const BrandProvider = ({ children }) => {
  const cached = readCachedBrand();
  const [brand, setBrand] = useState(cached || defaultBrand);
  const [loading, setLoading] = useState(!cached);
  const booted = useRef(false);

  const applyTheme = useCallback((theme) => {
    const root = document.documentElement;
    if (theme?.primary) root.style.setProperty('--brand-primary', theme.primary);
    if (theme?.secondary) root.style.setProperty('--brand-secondary', theme.secondary);
    if (theme?.accent) root.style.setProperty('--brand-accent', theme.accent);
  }, []);

  const applyBrand = useCallback((next) => {
    if (!next) return;
    setBrand(next);
    applyTheme(next.theme);
    writeCachedBrand(next);
  }, [applyTheme]);

  const refreshBrand = useCallback(async () => {
    try {
      // Public branding — safe on login page (no auth)
      try {
        const pub = await gasRequest('GET', '/public/branding');
        const next = normalizeBrandPayload(pub.data);
        if (next) applyBrand(next);
      } catch {
        /* keep cached / default */
      }

      // Authenticated settings ONLY when logged in — avoids 401 → login reload loop
      const token = tokenStorage.getToken();
      if (token) {
        try {
          const res = await settingsAPI.get();
          const next = normalizeBrandPayload(res.data);
          if (next) applyBrand(next);
        } catch {
          /* ignore */
        }
      }
    } finally {
      setLoading(false);
    }
  }, [applyBrand]);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    if (cached?.theme) applyTheme(cached.theme);
    refreshBrand();
  }, [applyTheme, cached, refreshBrand]);

  const value = useMemo(
    () => ({ brand, loading, refreshBrand, primary: brand.theme.primary, company: brand.company }),
    [brand, loading, refreshBrand]
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
};

export default BrandContext;
