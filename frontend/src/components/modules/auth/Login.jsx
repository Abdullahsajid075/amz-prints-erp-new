import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    if (!raw) return { company: DEFAULT_COMPANY, primary: '#ff6d00' };
    const parsed = JSON.parse(raw);
    const company = { ...DEFAULT_COMPANY, ...(parsed?.company || {}) };
    if (parsed?.companyLogo && !company.logo) company.logo = parsed.companyLogo;
    return {
      company,
      primary: parsed?.theme?.primary || '#ff6d00',
    };
  } catch {
    return { company: DEFAULT_COMPANY, primary: '#ff6d00' };
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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #F5F7FB 0%, #E8ECF4 100%)' }}
    >
      <Card className="w-full max-w-md shadow-2xl" data-testid="login-card">
        <CardHeader className="space-y-4 text-center pb-6">
          {company.logo ? (
            <img
              src={company.logo}
              alt={company.name || 'Company logo'}
              className="mx-auto h-20 w-auto max-w-[180px] object-contain bg-transparent"
            />
          ) : (
            <div
              className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: primary }}
            >
              <span className="text-white font-bold text-3xl">
                {(company.name || 'A').charAt(0)}
              </span>
            </div>
          )}
          <div>
            <CardTitle className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>
              {company.name || 'AMZ Prints'}
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {company.tagline || 'Enterprise Resource Planning'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5" autoComplete="on" data-testid="admin-tab-content">
            {loginError && (
              <Alert variant="destructive" data-testid="login-error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email / Username</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your email or username"
                  value={credentials.email}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))}
                  className="pl-10 h-12"
                  required
                  data-testid="login-email-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
                  className="pl-10 h-12"
                  required
                  data-testid="login-password-input"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              style={{ backgroundColor: '#ff6d00' }}
              disabled={loginLoading}
              data-testid="login-submit-button"
            >
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
