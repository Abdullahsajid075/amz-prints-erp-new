import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { dashboardAPI, expensesAPI } from '@/services/api';
import { useAuth, getUserDisplayName } from '@/context/AuthContext';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/helpers';
import {
  TrendingUp, TrendingDown, ShoppingCart, Clock, CheckCircle, DollarSign,
  Receipt, Users, Calendar, Activity, FileText, FileSpreadsheet, RefreshCw,
  ArrowRight, Wallet
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const CHART_COLORS = ['#F26522', '#2E2E2E', '#10B981', '#F59E0B', '#3B82F6'];

const SectionLabel = ({ title, hint }) => (
  <div className="flex items-baseline justify-between gap-3 mb-3">
    <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-500">{title}</h2>
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
);

const StatCard = ({ title, value, icon: Icon, tint, testId, onClick, hint }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={`group relative w-full text-left overflow-hidden rounded-2xl bg-white border border-gray-100 p-4 sm:p-5 transition-all duration-200 ${
      onClick ? 'hover:shadow-md hover:border-orange-200 cursor-pointer' : 'cursor-default'
    }`}
    data-testid={testId}
  >
    <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-[0.07] blur-2xl" style={{ backgroundColor: tint }} />
    <div className="relative flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-gray-500">{title}</p>
        <p className="mt-1.5 text-xl sm:text-2xl font-bold leading-tight break-words text-gray-800">{value}</p>
        {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
      </div>
      <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: tint }}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
    {onClick && (
      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">
        Open <ArrowRight className="h-3 w-3" />
      </span>
    )}
  </button>
);

const SectionCard = ({ title, subtitle, action, children, testId }) => (
  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm h-full" data-testid={testId}>
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <div>
        <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuotations: 0, totalOrders: 0, totalInvoices: 0,
    pendingOrders: 0, completedOrders: 0,
    revenue: 0, expenses: 0, receivables: 0, payables: 0, activeCustomers: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [chartData, setChartData] = useState({ monthlySales: [], orderStatus: [] });

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;

      const boot = await dashboardAPI.bootstrap(params);
      const data = boot.data || {};
      setStats(data.stats || {});
      setChartData(data.charts || { monthlySales: [], orderStatus: [] });
      setRecentOrders(Array.isArray(data.recentOrders) ? data.recentOrders : []);

      try {
        const expensesRes = await expensesAPI.getAll(params);
        const list = Array.isArray(expensesRes.data) ? expensesRes.data : [];
        setRecentExpenses(list.slice(0, 5));
        const expenseTotal = list.reduce((s, e) => s + Number(e.amount || 0), 0);
        setStats((prev) => ({
          ...prev,
          ...(data.stats || {}),
          expenses: Number((data.stats || {}).expenses) > 0
            ? (data.stats || {}).expenses
            : expenseTotal,
        }));
      } catch {
        setRecentExpenses([]);
      }
    } catch (error) {
      console.error('Dashboard load failed', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDashboardData(); }, []);

  const handleApplyFilter = () => fetchDashboardData();
  const handleResetFilter = () => {
    setDateRange({ from: '', to: '' });
    setTimeout(fetchDashboardData, 60);
  };

  const displayName = getUserDisplayName(user);
  const net = Number(stats.revenue || 0) - Number(stats.expenses || 0);

  return (
    <div className="space-y-8" data-testid="dashboard">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-orange-600">Dashboard</p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome Back, {displayName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Business overview — documents, finance, and operations in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
          <div className="flex flex-col">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 px-1">From</label>
            <Input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="h-9 w-[140px] border-gray-200"
              data-testid="date-from-input"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 px-1">To</label>
            <Input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="h-9 w-[140px] border-gray-200"
              data-testid="date-to-input"
            />
          </div>
          <Button
            onClick={handleApplyFilter}
            className="h-9 font-semibold text-white"
            style={{ backgroundColor: '#F26522' }}
            data-testid="apply-filter-button"
            disabled={loading}
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            Apply
          </Button>
          <Button
            onClick={handleResetFilter}
            variant="outline"
            className="h-9"
            data-testid="reset-filter-button"
            disabled={loading}
          >
            Reset
          </Button>
          <Button
            onClick={fetchDashboardData}
            variant="ghost"
            className="h-9 px-2"
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 1. Documents */}
      <section>
        <SectionLabel title="Documents" hint="Quotations · Orders · Invoices" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            testId="stat-total-quotations"
            title="Quotations"
            value={stats.totalQuotations || 0}
            icon={FileText}
            tint="#8B5CF6"
            onClick={() => navigate('/quotations')}
          />
          <StatCard
            testId="stat-total-orders"
            title="Orders"
            value={stats.totalOrders || 0}
            icon={ShoppingCart}
            tint="#F26522"
            onClick={() => navigate('/orders')}
          />
          <StatCard
            testId="stat-total-invoices"
            title="Invoices"
            value={stats.totalInvoices || 0}
            icon={FileSpreadsheet}
            tint="#0EA5E9"
            onClick={() => navigate('/invoices')}
          />
        </div>
      </section>

      {/* 2. Finance */}
      <section>
        <SectionLabel title="Finance" hint="Money in & out" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            testId="stat-revenue"
            title="Revenue"
            value={formatCurrency(stats.revenue)}
            icon={DollarSign}
            tint="#10B981"
            onClick={() => navigate('/invoices')}
          />
          <StatCard
            testId="stat-expenses"
            title="Expenses"
            value={formatCurrency(stats.expenses)}
            icon={Receipt}
            tint="#EF4444"
            onClick={() => navigate('/accounts/expenses')}
          />
          <StatCard
            testId="stat-receivables"
            title="Receivables"
            value={formatCurrency(stats.receivables)}
            icon={TrendingUp}
            tint="#7C3AED"
            hint="Balance due from customers"
          />
          <StatCard
            testId="stat-payables"
            title="Net position"
            value={formatCurrency(net)}
            icon={net >= 0 ? Wallet : TrendingDown}
            tint={net >= 0 ? '#14B8A6' : '#EC4899'}
            hint="Revenue − expenses"
          />
        </div>
      </section>

      {/* 3. Operations */}
      <section>
        <SectionLabel title="Operations" hint="Order pipeline & customers" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            testId="stat-pending"
            title="Pending orders"
            value={stats.pendingOrders}
            icon={Clock}
            tint="#F59E0B"
            onClick={() => navigate('/orders')}
          />
          <StatCard
            testId="stat-completed"
            title="Completed / delivered"
            value={stats.completedOrders}
            icon={CheckCircle}
            tint="#059669"
            onClick={() => navigate('/orders')}
          />
          <StatCard
            testId="stat-customers"
            title="Customers"
            value={stats.activeCustomers || 0}
            icon={Users}
            tint="#3B82F6"
            onClick={() => navigate('/customers')}
          />
        </div>
      </section>

      {/* 4. Charts */}
      <section>
        <SectionLabel title="Analytics" hint="Trends & status mix" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <SectionCard
              testId="monthly-sales-chart"
              title="Monthly sales"
              subtitle="Revenue over the last 6 months"
              action={
                <Badge className="bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-50">
                  <Activity className="h-3 w-3 mr-1" />Live
                </Badge>
              }
            >
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData.monthlySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F26522" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#F26522" stopOpacity={0} />
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
                    formatter={(v) => formatCurrency(v)}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#F26522" strokeWidth={2.5} fill="url(#salesFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </SectionCard>
          </div>

          <SectionCard
            testId="order-status-chart"
            title="Order status"
            subtitle="Current pipeline mix"
          >
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData.orderStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(chartData.orderStatus || []).map((entry, i) => (
                    <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1F2937', border: 'none', borderRadius: 8, color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              {(chartData.orderStatus || []).slice(0, 5).map((s, i) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-gray-700">{s.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{s.value}</span>
                </div>
              ))}
              {!(chartData.orderStatus || []).length && (
                <p className="text-center text-sm text-gray-400 py-4">No status data yet.</p>
              )}
            </div>
          </SectionCard>
        </div>
      </section>

      {/* 5. Recent activity */}
      <section>
        <SectionLabel title="Recent activity" hint="Latest orders & expenses" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <SectionCard
              testId="recent-orders-card"
              title="Recent orders"
              subtitle={`${recentOrders.length} latest`}
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-orange-600 h-8"
                  onClick={() => navigate('/orders')}
                >
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
                          <td className="py-3 px-3 text-right text-sm font-semibold text-orange-600">{formatCurrency(order.amount)}</td>
                          <td className="py-3 px-5 text-right">
                            <Badge className={`${getStatusColor(order.status)} text-[10px]`}>{order.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>

          <SectionCard
            testId="recent-expenses-card"
            title="Recent expenses"
            subtitle={`${recentExpenses.length} entries`}
            action={
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 h-8"
                onClick={() => navigate('/accounts/expenses')}
              >
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
          </SectionCard>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
