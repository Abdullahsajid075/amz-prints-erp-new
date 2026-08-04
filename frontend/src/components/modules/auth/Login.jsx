import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useBrand } from '@/context/BrandContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Lock, Mail, AlertCircle, Search, Package, Calendar, User, CheckCircle2, Circle, Clock, Truck } from 'lucide-react';
import { trackPublic } from '@/services/api';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/helpers';

const AdminLoginForm = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(credentials);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <Alert variant="destructive" data-testid="login-error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">Email / Username</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            id="email"
            type="text"
            placeholder="Enter your email or username"
            value={credentials.email}
            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
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
            type="password"
            placeholder="Enter your password"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
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
        disabled={loading}
        data-testid="login-submit-button"
      >
        {loading ? 'Signing in...' : 'Sign In as Admin'}
      </Button>
    </form>
  );
};

const WORKFLOW_STEPS = [
  { key: 'Order Received', icon: Package, label: 'Order Received' },
  { key: 'Designing', icon: Circle, label: 'Designing' },
  { key: 'Proof Approval', icon: Circle, label: 'Proof Approval' },
  { key: 'Printing', icon: Circle, label: 'Printing' },
  { key: 'Finishing', icon: Circle, label: 'Finishing' },
  { key: 'Packing', icon: Circle, label: 'Packing' },
  { key: 'Ready', icon: Circle, label: 'Ready' },
  { key: 'Delivered', icon: Truck, label: 'Delivered' }
];

const OrderTrackingForm = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setOrder(null);

    try {
      const id = trackingNumber.trim();
      if (!id) {
        setError('Please enter a tracking number or order ID.');
        return;
      }
      const response = await trackPublic(id);
      if (response.data) {
        setOrder(response.data);
      } else {
        setError('No order found with this tracking number or order ID.');
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message
        || err?.message
        || 'Order not found. Check tracking number / order ID and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (stepKey) => {
    if (!order) return 'pending';
    const stepIndex = WORKFLOW_STEPS.findIndex(s => s.key === stepKey);
    const currentIndex = WORKFLOW_STEPS.findIndex(s => s.key === order.status);
    if (order.status === 'Cancelled') return 'cancelled';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleTrack} className="space-y-4">
        {error && (
          <Alert variant="destructive" data-testid="tracking-error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
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
          disabled={loading}
          data-testid="track-order-button"
        >
          <Search className="h-4 w-4 mr-2" />
          {loading ? 'Tracking...' : 'Track My Order'}
        </Button>
      </form>

      {order && (
        <div className="mt-6 space-y-4 p-4 rounded-lg border-2" style={{ borderColor: '#F26522', backgroundColor: '#FFF9F5' }} data-testid="tracking-result">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase">Tracking Number</p>
              <h3 className="text-xl font-bold" style={{ color: '#2E2E2E' }}>{order.trackingNumber || order.orderId}</h3>
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
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        backgroundColor: status === 'completed' ? '#10B981' : status === 'active' ? '#F26522' : '#E5E7EB',
                        color: status === 'pending' ? '#9CA3AF' : 'white'
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
                          fontWeight: status === 'active' ? '700' : '500'
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
  );
};

const Login = () => {
  const { company, primary } = useBrand();

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #F5F7FB 0%, #E8ECF4 100%)' }}>
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
              style={{ backgroundColor: primary || '#F26522' }}
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
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6" data-testid="login-tabs">
              <TabsTrigger value="admin" data-testid="admin-tab" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <Lock className="h-4 w-4 mr-2" />
                Admin Login
              </TabsTrigger>
              <TabsTrigger value="tracking" data-testid="tracking-tab" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <Package className="h-4 w-4 mr-2" />
                Track Order
              </TabsTrigger>
            </TabsList>
            <TabsContent value="admin" data-testid="admin-tab-content">
              <AdminLoginForm />
            </TabsContent>
            <TabsContent value="tracking" data-testid="tracking-tab-content">
              <OrderTrackingForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
