import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Lock, Mail, AlertCircle, Search, Package, Calendar, User, CheckCircle2, Circle, Clock, Truck } from 'lucide-react';
import { authAPI, trackPublic } from '@/services/api';
import { tokenStorage } from '@/services/tokenStorage';
import { clearGasCache } from '@/services/gasClient';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/helpers';

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

const WORKFLOW_STEPS = [
  { key: 'Order Received', icon: Package, label: 'Order Received' },
  { key: 'Designing', icon: Circle, label: 'Designing' },
  { key: 'Proof Approval', icon: Circle, label: 'Proof Approval' },
  { key: 'Printing', icon: Circle, label: 'Printing' },
  { key: 'Finishing', icon: Circle, label: 'Finishing' },
  { key: 'Packing', icon: Circle, label: 'Packing' },
  { key: 'Ready', icon: Circle, label: 'Ready' },
  { key: 'Delivered', icon: Truck, label: 'Delivered' },
];

/**
 * Standalone login page — NOT under BrandProvider / AuthProvider.
 * Providers were causing remount / API / 401 loops that wiped the form.
 */
const Login = () => {
  const { company, primary } = useMemo(() => readFrozenBrand(), []);

  const [tab, setTab] = useState('admin');
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [trackingNumber, setTrackingNumber] = useState('');
  const [order, setOrder] = useState(null);
  const [trackError, setTrackError] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);

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
      // Full navigation mounts the app shell once (no React bounce loop)
      window.location.assign('/dashboard');
    } catch (error) {
      setLoginError(
        error?.response?.data?.message
        || 'Login failed. Please check your credentials.'
      );
      setLoginLoading(false);
    }
  };

  const handleTrack = async (e) => {
    e.preventDefault();
    setTrackError('');
    setTrackLoading(true);
    setOrder(null);
    try {
      const id = trackingNumber.trim();
      if (!id) {
        setTrackError('Please enter a tracking number or order ID.');
        return;
      }
      const response = await trackPublic(id);
      if (response.data) setOrder(response.data);
      else setTrackError('No order found with this tracking number or order ID.');
    } catch (err) {
      setTrackError(
        err?.response?.data?.message
        || err?.message
        || 'Order not found. Check tracking number / order ID and try again.'
      );
    } finally {
      setTrackLoading(false);
    }
  };

  const getStepStatus = (stepKey) => {
    if (!order) return 'pending';
    const stepIndex = WORKFLOW_STEPS.findIndex((s) => s.key === stepKey);
    const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.key === order.status);
    if (order.status === 'Cancelled') return 'cancelled';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
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
          <div className="grid grid-cols-2 gap-1 mb-6 p-1 rounded-lg bg-muted" data-testid="login-tabs">
            <button
              type="button"
              data-testid="admin-tab"
              className={`flex items-center justify-center gap-2 h-9 rounded-md text-sm font-medium transition-colors ${
                tab === 'admin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
              onClick={() => setTab('admin')}
            >
              <Lock className="h-4 w-4" />
              Admin Login
            </button>
            <button
              type="button"
              data-testid="tracking-tab"
              className={`flex items-center justify-center gap-2 h-9 rounded-md text-sm font-medium transition-colors ${
                tab === 'tracking' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
              onClick={() => setTab('tracking')}
            >
              <Package className="h-4 w-4" />
              Track Order
            </button>
          </div>

          <div className={tab === 'admin' ? 'block' : 'hidden'} data-testid="admin-tab-content">
            <form onSubmit={handleLogin} className="space-y-5" autoComplete="on">
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
                style={{ backgroundColor: '#F26522' }}
                disabled={loginLoading}
                data-testid="login-submit-button"
              >
                {loginLoading ? 'Signing in...' : 'Sign In as Admin'}
              </Button>
            </form>
          </div>

          <div className={tab === 'tracking' ? 'block' : 'hidden'} data-testid="tracking-tab-content">
            <div className="space-y-5">
              <form onSubmit={handleTrack} className="space-y-4">
                {trackError && (
                  <Alert variant="destructive" data-testid="tracking-error">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{trackError}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="tracking" className="text-sm font-medium">Tracking Number / Order ID</Label>
                  <div className="relative">
                    <Package className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="tracking"
                      type="text"
                      placeholder="e.g. TRK-1234 or ORD-..."
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="pl-10 h-12"
                      required
                      data-testid="tracking-number-input"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Use the tracking number from your receipt, or your order ID.</p>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  style={{ backgroundColor: '#F26522' }}
                  disabled={trackLoading}
                  data-testid="track-order-button"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {trackLoading ? 'Tracking...' : 'Track My Order'}
                </Button>
              </form>

              {order && (
                <div
                  className="mt-6 space-y-4 p-4 rounded-lg border-2"
                  style={{ borderColor: '#F26522', backgroundColor: '#FFF9F5' }}
                  data-testid="tracking-result"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-medium uppercase">Tracking Number</p>
                      <h3 className="text-xl font-bold" style={{ color: '#2E2E2E' }}>
                        {order.trackingNumber || order.orderId}
                      </h3>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} text-sm px-3 py-1`}>
                      {order.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-3 border-b border-orange-200">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 mt-0.5" style={{ color: '#F26522' }} />
                      <div>
                        <p className="text-xs text-gray-500">Customer</p>
                        <p className="text-sm font-semibold" style={{ color: '#2E2E2E' }}>{order.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-0.5" style={{ color: '#F26522' }} />
                      <div>
                        <p className="text-xs text-gray-500">Delivery Date</p>
                        <p className="text-sm font-semibold" style={{ color: '#2E2E2E' }}>{formatDate(order.deliveryDate)}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase mb-3">Order Progress</p>
                    <div className="space-y-3">
                      {WORKFLOW_STEPS.map((step) => {
                        const status = getStepStatus(step.key);
                        const StepIcon = step.icon;
                        return (
                          <div key={step.key} className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: status === 'completed' ? '#10B981' : status === 'active' ? '#F26522' : '#E5E7EB',
                                color: status === 'pending' ? '#9CA3AF' : 'white',
                              }}
                            >
                              {status === 'completed' ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : status === 'active' ? (
                                <Clock className="h-4 w-4 animate-pulse" />
                              ) : (
                                <StepIcon className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p
                                className="text-sm font-medium"
                                style={{
                                  color: status === 'completed' ? '#10B981' : status === 'active' ? '#F26522' : '#9CA3AF',
                                  fontWeight: status === 'active' ? '700' : '500',
                                }}
                              >
                                {step.label}
                              </p>
                            </div>
                            {status === 'active' && (
                              <Badge style={{ backgroundColor: '#F26522' }} className="text-white text-xs">
                                In Progress
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-orange-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Total Amount</p>
                      <p className="text-lg font-bold" style={{ color: '#F26522' }}>
                        {formatCurrency(order.totalAmount || 0)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Balance Due</p>
                      <p className="text-sm font-bold" style={{ color: '#2E2E2E' }}>
                        {formatCurrency((order.totalAmount || 0) - (order.advancePayment || 0))}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
