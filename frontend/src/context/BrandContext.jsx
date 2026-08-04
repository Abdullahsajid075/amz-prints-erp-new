import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { settingsAPI } from '@/services/api';
import { gasRequest } from '@/services/gasClient';

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

const BrandContext = createContext(null);

export const useBrand = () => {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrand must be used within BrandProvider');
  return ctx;
};

export const BrandProvider = ({ children }) => {
  const [brand, setBrand] = useState(defaultBrand);
  const [loading, setLoading] = useState(true);

  const applyTheme = useCallback((theme) => {
    const root = document.documentElement;
    if (theme?.primary) root.style.setProperty('--brand-primary', theme.primary);
    if (theme?.secondary) root.style.setProperty('--brand-secondary', theme.secondary);
    if (theme?.accent) root.style.setProperty('--brand-accent', theme.accent);
  }, []);

  const refreshBrand = useCallback(async () => {
    try {
      // Public branding first (works on login page without auth)
      try {
        const pub = await gasRequest('GET', '/public/branding');
        if (pub.data) {
          const next = {
            company: { ...defaultBrand.company, ...(pub.data.company || {}) },
            theme: { ...defaultBrand.theme, ...(pub.data.theme || {}) },
            invoice: { ...defaultBrand.invoice, ...(pub.data.invoice || {}) },
          };
          setBrand(next);
          applyTheme(next.theme);
        }
      } catch {
        /* ignore public fail */
      }

      // Full settings when authenticated
      try {
        const res = await settingsAPI.get();
        if (res.data) {
          const next = {
            company: { ...defaultBrand.company, ...(res.data.company || {}) },
            theme: { ...defaultBrand.theme, ...(res.data.theme || {}) },
            invoice: { ...defaultBrand.invoice, ...(res.data.invoice || {}) },
          };
          setBrand(next);
          applyTheme(next.theme);
        }
      } catch {
        /* guest / unauthorized */
      }
    } finally {
      setLoading(false);
    }
  }, [applyTheme]);

  useEffect(() => {
    refreshBrand();
  }, [refreshBrand]);

  const value = useMemo(
    () => ({ brand, loading, refreshBrand, primary: brand.theme.primary, company: brand.company }),
    [brand, loading, refreshBrand]
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
};

export default BrandContext;
