import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { dashboardAPI, expensesAPI, purchasesAPI } from '@/services/api';
import { totalVendorPayables } from '@/utils/vendorPayables';
import { useAuth, getUserDisplayName } from '@/context/AuthContext';
import { useBrand } from '@/context/BrandContext';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/helpers';
import {
  TrendingUp, TrendingDown, ShoppingCart, CheckCircle, DollarSign,
  Receipt, Users, Calendar, Activity, FileText, FileSpreadsheet, RefreshCw,
  ArrowRight, Wallet, Plus, Ticket, Store, AlertTriangle, Search,
  Palette, Printer, PackageCheck, Sparkles, Calculator
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

const PIPELINE = [
  { key: 'designingOrders', label: 'Design / Proof', icon: Palette, tint: '#8B5CF6', match: (s) => /design|proof/i.test(s) },
  { key: 'printingOrders', label: 'Production', icon: Printer, tint: '#F59E0B', match: (s) => /print|finish|pack/i.test(s) },
  { key: 'readyOrders', label: 'Ready', icon: PackageCheck, tint: '#0EA5E9', match: (s) => /^ready$/i.test(s) },
  { key: 'completedOrders', label: 'Delivered', icon: CheckCircle, tint: '#10B981', match: (s) => /deliver/i.test(s) },
];

const QUICK_ACTIONS = [
  { label: 'New Order', path: '/orders/new', module: 'orders', icon: Plus, tint: '#F26522' },
  { label: 'Token Booking', path: '/tokens', module: 'tokens', icon: Ticket, tint: '#0EA5E9' },
  { label: 'POS Sale', path: '/pos', module: 'pos', icon: Store, tint: '#10B981' },
  { label: 'Quotation', path: '/quotations/new', module: 'quotations', icon: FileText, tint: '#8B5CF6' },
  { label: 'Invoice', path: '/invoices/new', module: 'invoices', icon: FileSpreadsheet, tint: '#F59E0B' },
  { label: 'Customer', path: '/customers', module: 'customers', icon: Users, tint: '#64748B' },
  { label: 'Cost Calc', path: '/calculator', module: 'calculator', icon: Calculator, tint: '#0D9488' },
];

function greetingForHour(h) {
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function ymd(d) {
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Inclusive yyyy-MM-dd filter (same semantics as GAS). */
function inDateRange(rowDate, from, to) {
  if (!from && !to) return true;
  const dk = String(rowDate || '').trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dk)) return false;
  if (from && dk < from) return false;
  if (to && dk > to) return false;
  return true;
}

function datePresets() {
  const today = new Date();
  const to = ymd(today);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    today: { from: to, to },
    week: { from: ymd(weekStart), to },
    month: { from: ymd(monthStart), to },
    all: { from: '', to: '' },
  };
}

const MetricTile = ({ label, value, sub, icon: Icon, tint, onClick, testId }) => (
  <button
    type="button"
    data-testid={testId}
    onClick={onClick}
    disabled={!onClick}
    className={`erp-kpi text-left w-full ${
      onClick ? 'cursor-pointer' : 'cursor-default'
    }`}
    style={{
      background: `linear-gradient(155deg, ${tint}12 0%, #ffffff 52%)`,
      borderColor: `${tint}28`,
    }}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <p className="mt-1.5 font-display text-xl sm:text-2xl font-bold text-ink break-words">{value}</p>
        {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
      </div>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: tint }}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
  </button>
);

const Panel = ({ title, subtitle, action, children, className = '', testId }) => (
  <div className={`erp-panel ${className}`} data-testid={testId}>
    <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-black/[0.05]">
      <div className="min-w-0">
        <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
    <div className="p-4 sm:p-5">{children}</div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, canAccessModule } = useAuth();
  const { company, primary } = useBrand();
  const brand = primary || '#F26522';

  const quickActions = useMemo(
    () => QUICK_ACTIONS.filter((a) => canAccessModule(a.module)),
    [canAccessModule]
  );

  const goIfAllowed = useCallback((path, moduleKey) => {
    if (!canAccessModule(moduleKey)) return;
    navigate(path);
  }, [canAccessModule, navigate]);

  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [jumpQuery, setJumpQuery] = useState('');
  const [stats, setStats] = useState({
    totalQuotations: 0, totalOrders: 0, totalInvoices: 0,
    pendingOrders: 0, completedOrders: 0, readyOrders: 0,
    designingOrders: 0, printingOrders: 0,
    revenue: 0, expenses: 0, receivables: 0, collected: 0, payables: 0,
    activeCustomers: 0, fulfillmentRate: 0, collectionRate: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [attention, setAttention] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [chartData, setChartData] = useState({ monthlySales: [], orderStatus: [] });

  const fetchDashboardDataWith = useCallback(async (range) => {
    const from = range?.from || '';
    const to = range?.to || '';
    setLoading(true);
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const bootPromise = dashboardAPI.bootstrap(params);
      const expensesPromise = expensesAPI.getAll().catch(() => ({ data: [] }));
      const purchasesPromise = purchasesAPI.getAll().catch(() => ({ data: [] }));

      const boot = await bootPromise;
      const data = boot.data || {};
      setStats((prev) => ({ ...prev, ...(data.stats || {}) }));
      setChartData(data.charts || { monthlySales: [], orderStatus: [] });
      setRecentOrders(Array.isArray(data.recentOrders) ? data.recentOrders : []);
      setAttention(Array.isArray(data.attention) ? data.attention : []);
      setLoading(false);

      const [expensesRes, purchasesRes] = await Promise.all([expensesPromise, purchasesPromise]);
      const allExpenses = Array.isArray(expensesRes.data) ? expensesRes.data : [];
      const list = allExpenses.filter((e) => inDateRange(e.date, from, to));
      setRecentExpenses(list.slice(0, 6));
      const expenseTotal = list.reduce((s, e) => s + Number(e.amount || 0), 0);
      const purchaseList = (Array.isArray(purchasesRes.data) ? purchasesRes.data : [])
        .filter((p) => inDateRange(p.purchaseDate || p.date, from, to));
      const payablesFromPurchases = totalVendorPayables(purchaseList);
      const serverExpenses = Number(data.stats?.expenses);
      const serverPayables = Number(data.stats?.payables || data.stats?.vendorPayables);
      setStats((prev) => ({
        ...prev,
        // Prefer filtered server total when present (incl. 0); else client sum
        expenses: Number.isFinite(serverExpenses) ? serverExpenses : expenseTotal,
        payables: Number.isFinite(serverPayables) ? serverPayables : payablesFromPurchases,
      }));
    } catch (error) {
      console.error('Dashboard load failed', error);
      setLoading(false);
    }
  }, []);

  const fetchDashboardData = useCallback(() => {
    return fetchDashboardDataWith(dateRange);
  }, [dateRange, fetchDashboardDataWith]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDashboardData(); }, []);

  const displayName = getUserDisplayName(user);
  const greeting = greetingForHour(new Date().getHours());
  // Cash net = Payments Cash In − Cash Out (do not mix with Expenses sheet)
  const net = Number.isFinite(Number(stats.cashNet))
    ? Number(stats.cashNet)
    : Number(stats.cashIn || 0) - Number(stats.cashOut || 0);
  const todayLabel = new Date().toLocaleDateString('en-PK', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const pipelineCounts = useMemo(() => {
    const fromStats = {
      designingOrders: Number(stats.designingOrders || 0),
      printingOrders: Number(stats.printingOrders || 0),
      readyOrders: Number(stats.readyOrders || 0),
      completedOrders: Number(stats.completedOrders || 0),
    };
    // Fallback from status chart if bootstrap older
    if (!fromStats.designingOrders && !fromStats.printingOrders && !fromStats.readyOrders) {
      (chartData.orderStatus || []).forEach((row) => {
        PIPELINE.forEach((p) => {
          if (p.match(row.name)) fromStats[p.key] += Number(row.value || 0);
        });
      });
    }
    return fromStats;
  }, [stats, chartData.orderStatus]);

  const pipelineTotal = Math.max(
    1,
    pipelineCounts.designingOrders
      + pipelineCounts.printingOrders
      + pipelineCounts.readyOrders
      + pipelineCounts.completedOrders
  );

  const handleJump = (e) => {
    e.preventDefault();
    const q = jumpQuery.trim().toLowerCase();
    if (!q) return;
    const hit = recentOrders.find((o) =>
      String(o.orderId || '').toLowerCase().includes(q)
      || String(o.trackingNumber || '').toLowerCase().includes(q)
      || String(o.customerName || '').toLowerCase().includes(q)
      || String(o.customerPhone || '').includes(q)
    ) || attention.find((o) =>
      String(o.orderId || '').toLowerCase().includes(q)
      || String(o.trackingNumber || '').toLowerCase().includes(q)
      || String(o.customerName || '').toLowerCase().includes(q)
    );
    if (hit?.id) navigate(`/orders/${hit.id}/edit`);
    else navigate(`/orders?search=${encodeURIComponent(jumpQuery.trim())}`);
  };

  return (
    <div className="erp-page space-y-5" data-testid="dashboard">
      {/* Command hero — ink + brand accent */}
      <div
        className="relative overflow-hidden rounded-2xl text-white shadow-[0_16px_40px_rgba(28,36,48,0.18)]"
        style={{
          background: `
            radial-gradient(700px 280px at 0% 0%, ${brand}66, transparent 55%),
            linear-gradient(145deg, #151B24 0%, #1C2430 55%, #10151C 100%)
          `,
        }}
      >
        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-5">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/65">
                <Sparkles className="h-3.5 w-3.5" style={{ color: brand }} strokeWidth={2.25} />
                {company?.name || 'AMZ Prints'} · Command
              </div>
              <h1 className="mt-2 font-display text-2xl sm:text-3xl lg:text-[2.1rem] font-bold leading-tight tracking-tight">
                {greeting}, {displayName}
              </h1>
              <p className="mt-1 text-sm text-white/70">{todayLabel}</p>
            </div>

            <div className="flex flex-col gap-2 sm:items-stretch">
              <form onSubmit={handleJump} className="flex gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                    style={{ color: brand }}
                    strokeWidth={2.5}
                  />
                  <Input
                    value={jumpQuery}
                    onChange={(e) => setJumpQuery(e.target.value)}
                    placeholder="Find order / tracking / customer"
                    className="pl-9 h-10 w-full sm:w-[260px] bg-white border-0 text-ink placeholder:text-slate-400 shadow-sm rounded-xl"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-10 shrink-0 bg-white font-bold shadow-sm rounded-xl"
                  style={{ color: brand }}
                >
                  Go
                </Button>
              </form>

              <div className="flex flex-wrap items-end gap-2">
                <div className="flex flex-wrap items-end gap-2 rounded-xl bg-white/95 p-1.5 shadow-sm">
                  <div className="flex flex-wrap gap-1 px-1 pb-0.5">
                    {[
                      { key: 'today', label: 'Today' },
                      { key: 'week', label: '7 days' },
                      { key: 'month', label: 'Month' },
                      { key: 'all', label: 'All' },
                    ].map((p) => (
                      <Button
                        key={p.key}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] px-2 rounded-lg"
                        disabled={loading}
                        onClick={() => {
                          const next = datePresets()[p.key];
                          setDateRange(next);
                          fetchDashboardDataWith(next);
                        }}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>
                  <label className="flex flex-col gap-0.5 px-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 px-1">From</span>
                    <Input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                      className="h-9 w-[148px] border-slate-200 bg-white text-ink [color-scheme:light] rounded-lg"
                      data-testid="date-from-input"
                    />
                  </label>
                  <label className="flex flex-col gap-0.5 px-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 px-1">To</span>
                    <Input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                      className="h-9 w-[148px] border-slate-200 bg-white text-ink [color-scheme:light] rounded-lg"
                      data-testid="date-to-input"
                    />
                  </label>
                  <Button
                    onClick={fetchDashboardData}
                    className="h-9 mb-0.5 shrink-0 text-white rounded-lg"
                    style={{ backgroundColor: brand }}
                    data-testid="apply-filter-button"
                    disabled={loading}
                  >
                    <Calendar className="h-4 w-4 mr-1.5 text-white" strokeWidth={2.5} />
                    Apply
                  </Button>
                </div>
                <Button
                  onClick={fetchDashboardData}
                  className="h-10 w-10 shrink-0 bg-white hover:bg-white/90 shadow-sm rounded-xl"
                  style={{ color: brand }}
                  disabled={loading}
                  title="Refresh"
                >
                  <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} strokeWidth={2.5} />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              { label: 'Revenue', value: formatCurrency(stats.revenue), hint: `${stats.collectionRate || 0}% collected` },
              { label: 'Receivables', value: formatCurrency(stats.receivables), hint: 'Customer balances' },
              { label: 'Net position', value: formatCurrency(net), hint: 'Cash In − Cash Out (Payments)' },
              { label: 'Open orders', value: stats.pendingOrders || 0, hint: `${stats.fulfillmentRate || 0}% fulfilled` },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded-xl border border-white/10 bg-white/[0.06] backdrop-blur-sm p-3.5 transition-transform duration-300 hover:-translate-y-0.5"
              >
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/65 font-bold">{k.label}</p>
                <p className="mt-1 font-display text-lg sm:text-xl font-bold">{k.value}</p>
                <p className="text-[11px] text-white/55 mt-0.5">{k.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {quickActions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Quick actions</h2>
          </div>
          <div className="flex flex-nowrap items-stretch gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.path}
                  type="button"
                  onClick={() => navigate(a.path)}
                  className="group inline-flex items-center gap-2.5 shrink-0 rounded-xl border border-black/[0.06] bg-white px-3 py-2.5 text-left hover:shadow-md hover:border-orange-200/80 transition-all"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: a.tint }}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-ink whitespace-nowrap">{a.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-orange-400 shrink-0 transition-colors" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Documents + health */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricTile
          testId="stat-total-quotations"
          label="Quotations"
          value={stats.totalQuotations || 0}
          icon={FileText}
          tint="#8B5CF6"
          onClick={canAccessModule('quotations') ? () => goIfAllowed('/quotations', 'quotations') : undefined}
        />
        <MetricTile
          testId="stat-total-orders"
          label="Orders"
          value={stats.totalOrders || 0}
          sub={`${stats.pendingOrders || 0} in pipeline`}
          icon={ShoppingCart}
          tint={brand}
          onClick={canAccessModule('orders') ? () => goIfAllowed('/orders', 'orders') : undefined}
        />
        <MetricTile
          testId="stat-total-invoices"
          label="Invoices"
          value={stats.totalInvoices || 0}
          icon={FileSpreadsheet}
          tint="#0EA5E9"
          onClick={canAccessModule('invoices') ? () => goIfAllowed('/invoices', 'invoices') : undefined}
        />
        <MetricTile
          testId="stat-customers"
          label="Customers"
          value={stats.activeCustomers || 0}
          icon={Users}
          tint="#64748B"
          onClick={canAccessModule('customers') ? () => goIfAllowed('/customers', 'customers') : undefined}
        />
      </section>

      {/* Pipeline + Attention */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Panel
          className="lg:col-span-3"
          testId="pipeline-panel"
          title="Order pipeline"
          subtitle="Where work sits right now"
          action={
            <Badge className="bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-50">
              <Activity className="h-3 w-3 mr-1" />Live
            </Badge>
          }
        >
          <div className="space-y-4">
            {PIPELINE.map((stage) => {
              const Icon = stage.icon;
              const count = pipelineCounts[stage.key] || 0;
              const pct = Math.round((count / pipelineTotal) * 100);
              return (
                <button
                  key={stage.key}
                  type="button"
                  onClick={() => navigate('/orders')}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${stage.tint}22`, color: stage.tint }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-sm font-medium text-gray-800">{stage.label}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: stage.tint }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-[10px] uppercase text-amber-700 font-semibold">Pending</p>
              <p className="text-lg font-bold text-amber-800" data-testid="stat-pending">{stats.pendingOrders || 0}</p>
            </div>
            <div className="rounded-xl bg-sky-50 p-3">
              <p className="text-[10px] uppercase text-sky-700 font-semibold">Ready</p>
              <p className="text-lg font-bold text-sky-800">{stats.readyOrders || 0}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="text-[10px] uppercase text-emerald-700 font-semibold">Delivered</p>
              <p className="text-lg font-bold text-emerald-800" data-testid="stat-completed">{stats.completedOrders || 0}</p>
            </div>
            <div className="rounded-xl bg-orange-50 p-3">
              <p className="text-[10px] uppercase text-orange-700 font-semibold">Fulfillment</p>
              <p className="text-lg font-bold text-orange-800">{stats.fulfillmentRate || 0}%</p>
            </div>
          </div>
        </Panel>

        <Panel
          className="lg:col-span-2"
          testId="attention-panel"
          title="Needs attention"
          subtitle="Ready or unpaid balances"
          action={<AlertTriangle className="h-4 w-4 text-amber-500" />}
        >
          {attention.length === 0 ? (
            <div className="text-center py-10 text-sm text-gray-500">
              All clear — nothing urgent right now.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {attention.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => navigate(`/orders/${o.id}/edit`)}
                  className="w-full flex items-start justify-between gap-3 rounded-xl border border-gray-100 p-3 hover:bg-orange-50/50 hover:border-orange-200 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{o.orderId}</p>
                    <p className="text-xs text-gray-500 truncate">{o.customerName}</p>
                    <div className="mt-1.5">
                      <Badge className={`${getStatusColor(o.status)} text-[10px]`}>{o.status}</Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">Balance</p>
                    <p className="text-sm font-bold text-rose-600">
                      {formatCurrency(o.balanceAmount || o.balance || 0)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Panel>
      </section>

      {/* Finance row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricTile
          testId="stat-revenue"
          label="Revenue"
          value={formatCurrency(stats.revenue)}
          icon={DollarSign}
          tint="#10B981"
          onClick={() => navigate('/invoices')}
        />
        <MetricTile
          testId="stat-expenses"
          label="Expenses"
          value={formatCurrency(stats.expenses)}
          icon={Receipt}
          tint="#EF4444"
          onClick={() => navigate('/accounts/expenses')}
        />
        <MetricTile
          testId="stat-receivables"
          label="Receivables"
          value={formatCurrency(stats.receivables)}
          sub={`${stats.collectionRate || 0}% collection rate`}
          icon={TrendingUp}
          tint="#F59E0B"
          onClick={() => navigate('/orders')}
        />
        <MetricTile
          testId="stat-payables"
          label="Vendor payables"
          value={formatCurrency(stats.payables || stats.vendorPayables || 0)}
          icon={Wallet}
          tint="#E11D48"
          onClick={() => navigate('/purchases')}
        />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel
          className="lg:col-span-2"
          testId="monthly-sales-chart"
          title="Monthly sales"
          subtitle="Last 6 months revenue & order volume"
        >
          {(chartData.monthlySales || []).length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">
              No sales trend data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData.monthlySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashSalesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={brand} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={brand} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `Rs ${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{ background: '#1F2937', border: 'none', borderRadius: 8, color: '#fff' }}
                  formatter={(v, name) => (name === 'sales' ? formatCurrency(v) : v)}
                />
                <Area type="monotone" dataKey="sales" stroke={brand} strokeWidth={2.5} fill="url(#dashSalesFill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel testId="order-status-chart" title="Status mix" subtitle="Orders by stage">
          {(chartData.orderStatus || []).length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-sm text-gray-400">No status data.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData.orderStatus} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip contentStyle={{ background: '#1F2937', border: 'none', borderRadius: 8, color: '#fff' }} />
                <Bar dataKey="value" fill={brand} radius={[0, 6, 6, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </section>

      {/* Recent activity */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel
          className="lg:col-span-2"
          testId="recent-orders-card"
          title="Recent orders"
          subtitle={`${recentOrders.length} latest`}
          action={
            <Button variant="ghost" size="sm" className="text-orange-600 h-8" onClick={() => navigate('/orders')}>
              View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          }
        >
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No recent orders found.</div>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-5 text-[11px] uppercase tracking-wider font-semibold text-gray-500">Order</th>
                    <th className="text-left py-2 px-3 text-[11px] uppercase tracking-wider font-semibold text-gray-500">Customer</th>
                    <th className="text-left py-2 px-3 text-[11px] uppercase tracking-wider font-semibold text-gray-500 hidden sm:table-cell">Date</th>
                    <th className="text-right py-2 px-3 text-[11px] uppercase tracking-wider font-semibold text-gray-500">Amount</th>
                    <th className="text-right py-2 px-5 text-[11px] uppercase tracking-wider font-semibold text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-50 hover:bg-orange-50/40 transition-colors cursor-pointer"
                      data-testid={`order-row-${order.id}`}
                      onClick={() => navigate(`/orders/${order.id}/edit`)}
                    >
                      <td className="py-3 px-5 font-semibold text-sm text-gray-800">{order.orderId}</td>
                      <td className="py-3 px-3 text-sm text-gray-700 truncate max-w-[160px]">{order.customerName}</td>
                      <td className="py-3 px-3 text-sm text-gray-500 hidden sm:table-cell">{formatDate(order.date)}</td>
                      <td className="py-3 px-3 text-right text-sm font-semibold text-orange-600">
                        {formatCurrency(order.totalAmount ?? order.amount ?? 0)}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <Badge className={`${getStatusColor(order.status)} text-[10px]`}>{order.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel
          testId="recent-expenses-card"
          title="Recent expenses"
          subtitle={`${recentExpenses.length} entries`}
          action={
            <Button variant="ghost" size="sm" className="text-rose-600 h-8" onClick={() => navigate('/accounts/expenses')}>
              View all <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          }
        >
          {recentExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No expenses in selected range.</div>
          ) : (
            <div className="space-y-2">
              {recentExpenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                  data-testid={`recent-expense-${exp.id}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate text-gray-800">{exp.description}</p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {exp.category} · {formatDate(exp.date)}
                    </p>
                  </div>
                  <p className="ml-3 font-semibold text-rose-600 text-sm whitespace-nowrap">
                    -{formatCurrency(exp.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
};

export default Dashboard;
