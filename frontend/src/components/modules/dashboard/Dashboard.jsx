import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { dashboardAPI, expensesAPI } from '@/services/api';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/helpers';import {
  TrendingUp, TrendingDown, ShoppingCart, Clock, CheckCircle, DollarSign,
  Receipt, Users, Calendar, ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';

const CHART_COLORS = ['#F26522', '#2E2E2E', '#10B981', '#F59E0B', '#3B82F6'];

const StatCard = ({ title, value, icon: Icon, trend, trendValue, tint, testId }) => (
  <div
    className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
    data-testid={testId}
  >
    <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-[0.08] blur-2xl group-hover:opacity-20 transition-opacity" style={{ backgroundColor: tint }} />
    <div className="relative flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-gray-500">{title}</p>
        <p className="mt-2 text-xl sm:text-2xl font-bold leading-tight break-words" style={{ color: '#1F2937' }}>{value}</p>
        {trend && (
          <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold">
            {trend === 'up'
              ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
              : <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />}
            <span className={trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}>{trendValue}</span>
            <span className="text-gray-400 font-normal hidden sm:inline">vs last month</span>
          </div>
        )}
      </div>
      <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: tint }}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
  </div>
);

const SectionCard = ({ title, subtitle, action, children, testId }) => (
  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm" data-testid={testId}>
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <div>
        <h3 className="text-base font-semibold" style={{ color: '#1F2937' }}>{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Dashboard = () => {
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [stats, setStats] = useState({
    totalOrders: 0, pendingOrders: 0, completedOrders: 0,
    revenue: 0, expenses: 0, receivables: 0, payables: 0, activeCustomers: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [chartData, setChartData] = useState({ monthlySales: [], orderStatus: [] });

  const fetchDashboardData = useCallback(async () => {
    try {
      const params = {};
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;

      // One GAS round-trip instead of 4 parallel cold starts
      const boot = await dashboardAPI.bootstrap(params);
      const data = boot.data || {};
      setStats(data.stats || {});
      setChartData(data.charts || { monthlySales: [], orderStatus: [] });
      setRecentOrders(Array.isArray(data.recentOrders) ? data.recentOrders : []);

      try {
        const expensesRes = await expensesAPI.getAll(params);
        setRecentExpenses(Array.isArray(expensesRes.data) ? expensesRes.data.slice(0, 5) : []);
      } catch {
        setRecentExpenses([]);
      }
    } catch (error) {
      console.error('Dashboard load failed', error);
    }
  }, [dateRange]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDashboardData(); }, []);

  const handleApplyFilter = () => fetchDashboardData();
  const handleResetFilter = () => {
    setDateRange({ from: '', to: '' });
    setTimeout(fetchDashboardData, 60);
  };

  return (
    <div className="space-y-6" data-testid="dashboard">
      {/* Hero header */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-7 text-white shadow-md"
        style={{ background: 'linear-gradient(135deg, #F26522 0%, #FF8A50 55%, #FFA574 100%)' }}
      >
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 20% 0%, rgba(255,255,255,.35) 0, transparent 40%), radial-gradient(circle at 80% 100%, rgba(255,255,255,.25) 0, transparent 40%)'
        }} />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs sm:text-sm font-medium uppercase tracking-[0.14em] text-white/80">Overview</p>
            <h1 className="mt-1 text-2xl sm:text-3xl md:text-4xl font-bold">Welcome back, Admin</h1>
            <p className="mt-1 text-sm text-white/90 max-w-xl">
              Here&rsquo;s a snapshot of orders, revenue and expenses across your business.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2 bg-white/12 backdrop-blur-sm rounded-xl p-2.5 border border-white/25">
            <div className="flex flex-col">
              <label className="text-[10px] uppercase tracking-wider text-white/80 mb-1">From</label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="bg-white/95 border-0 text-gray-800 h-9 w-[140px]"
                data-testid="date-from-input"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] uppercase tracking-wider text-white/80 mb-1">To</label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="bg-white/95 border-0 text-gray-800 h-9 w-[140px]"
                data-testid="date-to-input"
              />
            </div>
            <Button
              onClick={handleApplyFilter}
              className="h-9 bg-white text-orange-600 hover:bg-white/90 font-semibold"
              data-testid="apply-filter-button"
            >
              <Calendar className="h-4 w-4 mr-1.5" />
              Apply
            </Button>
            <Button
              onClick={handleResetFilter}
              variant="ghost"
              className="h-9 text-white hover:bg-white/20 hover:text-white"
              data-testid="reset-filter-button"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard testId="stat-total-orders" title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} tint="#F26522" trend="up" trendValue="+12%" />
        <StatCard testId="stat-pending" title="Pending" value={stats.pendingOrders} icon={Clock} tint="#F59E0B" />
        <StatCard testId="stat-completed" title="Completed" value={stats.completedOrders} icon={CheckCircle} tint="#10B981" trend="up" trendValue="+8%" />
        <StatCard testId="stat-revenue" title="Revenue" value={formatCurrency(stats.revenue)} icon={DollarSign} tint="#3B82F6" trend="up" trendValue="+15%" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard testId="stat-expenses" title="Expenses" value={formatCurrency(stats.expenses)} icon={Receipt} tint="#EF4444" trend="down" trendValue="-4%" />
        <StatCard testId="stat-receivables" title="Receivables" value={formatCurrency(stats.receivables)} icon={TrendingUp} tint="#8B5CF6" />
        <StatCard testId="stat-payables" title="Payables" value={formatCurrency(stats.payables)} icon={TrendingDown} tint="#EC4899" />
        <StatCard testId="stat-customers" title="Active Customers" value={stats.activeCustomers || 0} icon={Users} tint="#14B8A6" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SectionCard
            testId="monthly-sales-chart"
            title="Monthly Sales Trend"
            subtitle="Revenue trajectory over the last 6 months"
            action={<Badge className="bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-50"><Activity className="h-3 w-3 mr-1" />Live</Badge>}
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
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `Rs ${(v/1000).toFixed(0)}k`} />
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
          title="Order Status"
          subtitle="Current pipeline"
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
                {chartData.orderStatus.map((entry) => (
                  <Cell key={entry.name} fill={CHART_COLORS[chartData.orderStatus.indexOf(entry) % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1F2937', border: 'none', borderRadius: 8, color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {(chartData.orderStatus || []).slice(0, 5).map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[chartData.orderStatus.indexOf(s) % CHART_COLORS.length] }} />
                  <span className="text-gray-700">{s.name}</span>
                </div>
                <span className="font-semibold text-gray-900">{s.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SectionCard
            testId="recent-orders-card"
            title="Recent Orders"
            subtitle={`${recentOrders.length} latest orders`}
            action={<Badge variant="outline" className="text-orange-600 border-orange-200">Live</Badge>}
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
                      <tr key={order.id} className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors" data-testid={`order-row-${order.id}`}>
                        <td className="py-3 px-5 font-semibold text-sm" style={{ color: '#1F2937' }}>{order.orderId}</td>
                        <td className="py-3 px-3 text-sm text-gray-700 truncate max-w-[160px]">{order.customerName}</td>
                        <td className="py-3 px-3 text-sm text-gray-500 hidden sm:table-cell">{formatDate(order.date)}</td>
                        <td className="py-3 px-3 text-right text-sm font-semibold" style={{ color: '#F26522' }}>{formatCurrency(order.amount)}</td>
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
          title="Recent Expenses"
          subtitle={`${recentExpenses.length} entries`}
          action={<Receipt className="h-4 w-4 text-rose-500" />}
        >
          {recentExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No expenses in selected range.</div>
          ) : (
            <div className="space-y-2">
              {recentExpenses.map(exp => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                  data-testid={`recent-expense-${exp.id}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: '#1F2937' }}>{exp.description}</p>
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
    </div>
  );
};

export default Dashboard;
