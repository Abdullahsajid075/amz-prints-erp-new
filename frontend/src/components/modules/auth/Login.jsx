import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { authAPI } from '@/services/api';
import { tokenStorage } from '@/services/tokenStorage';
import { clearGasCache } from '@/services/gasClient';

const BRAND_CACHE_KEY = 'amz_erp_brand_v1';

const DEFAULT_COMPANY = {
  name: 'AMZ Prints',
  tagline: 'Enterprise Resource Planning',
  logo: '',
};

/** Local cache only — no BrandProvider / no network on this page. */
function readFrozenBrand() {
  try {
    const raw = localStorage.getItem(BRAND_CACHE_KEY);
    if (!raw) return { company: DEFAULT_COMPANY, primary: '#F26522' };
    const parsed = JSON.parse(raw);
    const company = { ...DEFAULT_COMPANY, ...(parsed?.company || {}) };
    if (parsed?.companyLogo && !company.logo) company.logo = parsed.companyLogo;
    return {
      company,
      primary: parsed?.theme?.primary || '#F26522',
    };
  } catch {
    return { company: DEFAULT_COMPANY, primary: '#F26522' };
  }
}

/**
 * Standalone login page — NOT under BrandProvider / AuthProvider.
 * Order tracking is public via /track link only (not on login).
 */
const Login = () => {
  const { company, primary } = useMemo(() => readFrozenBrand(), []);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const accent = primary || '#F26522';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const response = await authAPI.login(credentials);
      const { token, user } = response.data || {};
      if (!token) {
        setLoginError('Login failed — no token returned.');
        return;
      }
      tokenStorage.setToken(token);
      tokenStorage.setUser(user || null);
      clearGasCache();
      window.location.assign('/dashboard');
    } catch (error) {
      setLoginError(
        error?.response?.data?.message
        || 'Login failed. Please check your credentials.'
      );
      setLoginLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2" data-testid="login-page">
      {/* Brand plane */}
      <section
        className="relative hidden lg:flex flex-col justify-between p-10 xl:p-14 text-white overflow-hidden"
        style={{
          background: `
            radial-gradient(800px 480px at 10% 20%, ${accent}55, transparent 55%),
            radial-gradient(600px 400px at 90% 80%, rgba(255,255,255,0.08), transparent 50%),
            linear-gradient(155deg, #151B24 0%, #1C2430 55%, #10151C 100%)
          `,
        }}
      >
        <div className="relative z-10">
          {company.logo ? (
            <img
              src={company.logo}
              alt={company.name || 'Company logo'}
              className="h-12 w-auto max-w-[200px] object-contain brightness-0 invert"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: accent }}
            >
              <span className="text-white font-display font-bold text-2xl">
                {(company.name || 'A').charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="relative z-10 max-w-lg">
          <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/60 mb-3">
            Press Ops
          </p>
          <h1 className="font-display text-4xl xl:text-5xl font-bold leading-[1.05] tracking-tight">
            {company.name || 'AMZ Prints'}
          </h1>
          <p className="mt-4 text-base text-white/75 leading-relaxed">
            {company.tagline || 'Orders, production, cash, and counter — one command interface.'}
          </p>
        </div>

        <p className="relative z-10 text-xs text-white/40 tracking-wide">
          Authorized staff access only
        </p>
      </section>

      {/* Form plane */}
      <section className="flex items-center justify-center p-6 sm:p-10 bg-[var(--canvas-tint)]">
        <div
          className="w-full max-w-md erp-panel p-7 sm:p-8"
          data-testid="login-card"
        >
          <div className="lg:hidden mb-6 flex items-center gap-3">
            {company.logo ? (
              <img
                src={company.logo}
                alt={company.name || 'Company logo'}
                className="h-10 w-auto max-w-[140px] object-contain"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: accent }}
              >
                <span className="text-white font-display font-bold text-xl">
                  {(company.name || 'A').charAt(0)}
                </span>
              </div>
            )}
            <div>
              <p className="font-display font-bold text-ink text-lg leading-tight">
                {company.name || 'AMZ Prints'}
              </p>
              <p className="text-xs text-slate-500">Press Ops</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-ink">Sign in</h2>
            <p className="text-sm text-slate-500 mt-1">
              Use your staff email or username to continue.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5" autoComplete="on" data-testid="admin-tab-content">
            {loginError && (
              <Alert variant="destructive" data-testid="login-error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-ink">
                Email / Username
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your email or username"
                  value={credentials.email}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))}
                  className="pl-10 h-11 rounded-xl"
                  required
                  data-testid="login-email-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-ink">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
                  className="pl-10 h-11 rounded-xl"
                  required
                  data-testid="login-password-input"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-sm font-bold rounded-xl text-white shadow-md"
              style={{ backgroundColor: accent }}
              disabled={loginLoading}
              data-testid="login-submit-button"
            >
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Login;
