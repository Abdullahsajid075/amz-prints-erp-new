import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { reportsAPI } from '@/services/api';
import { formatCurrency } from '@/utils/helpers';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, ShoppingBag, Wallet, Download, Calendar, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { toast } from 'sonner';

const COLORS = ['#F26522', '#2E2E2E', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];

const Reports = () => {
  const [period, setPeriod] = useState('monthly');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [data, setData] = useState({ sales: [], purchases: [], expenses: [], profitLoss: null, topCustomers: [], topProducts: [], assets: [], comparison: [] });
  const [loading, setLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsAPI.getAll({ period, from: dateRange.from, to: dateRange.to });
      setData(prev => res.data || prev);
    } catch (err) {
      console.error('Failed to fetch reports', err);
      toast.error('Failed to load reports');
    }
    finally { setLoading(false); }
  }, [period, dateRange.from, dateRange.to]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const pl = data.profitLoss || { income: 0, expenses: 0, purchases: 0, profit: 0 };
  const plBreakdown = useMemo(
    () => [{ name: 'Income', value: pl.income }, { name: 'Expenses', value: pl.expenses }, { name: 'Purchases', value: pl.purchases }],
    [pl.income, pl.expenses, pl.purchases]
  );

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Business insights, profit/loss & financial reports</p>
        </div>
        <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export Report</Button>
      </div>

      <Card><CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div><label className="text-xs text-gray-500 font-medium uppercase">Period</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger data-testid="period-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><label className="text-xs text-gray-500 font-medium uppercase">From</label><Input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500 font-medium uppercase">To</label><Input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} /></div>
          <div className="flex items-end"><Button onClick={fetchReports} style={{ backgroundColor: '#F26522' }} className="text-white w-full"><Calendar className="h-4 w-4 mr-2" />Apply</Button></div>
        </div>
      </CardContent></Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#10B981' }}><TrendingUp className="h-6 w-6 text-white" /></div>
          <div><p className="text-xs text-gray-500 uppercase font-medium">Total Income</p><p className="text-xl font-bold text-green-700">{formatCurrency(pl.income)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EF4444' }}><TrendingDown className="h-6 w-6 text-white" /></div>
          <div><p className="text-xs text-gray-500 uppercase font-medium">Expenses</p><p className="text-xl font-bold text-red-600">{formatCurrency(pl.expenses)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#8B5CF6' }}><ShoppingBag className="h-6 w-6 text-white" /></div>
          <div><p className="text-xs text-gray-500 uppercase font-medium">Purchases</p><p className="text-xl font-bold">{formatCurrency(pl.purchases)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: pl.profit >= 0 ? '#F26522' : '#EF4444' }}><DollarSign className="h-6 w-6 text-white" /></div>
          <div><p className="text-xs text-gray-500 uppercase font-medium">{pl.profit >= 0 ? 'Net Profit' : 'Net Loss'}</p><p className="text-xl font-bold" style={{ color: pl.profit >= 0 ? '#F26522' : '#EF4444' }}>{formatCurrency(Math.abs(pl.profit))}</p></div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="pl">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="pl">P&L</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="customers">Top</TabsTrigger>
        </TabsList>

        <TabsContent value="pl" className="space-y-4">
          <Card><CardHeader><CardTitle>Profit & Loss Comparison</CardTitle></CardHeader><CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={data.comparison}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" /><YAxis /><Tooltip /><Legend />
                <Bar dataKey="income" fill="#10B981" name="Income" />
                <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
                <Bar dataKey="purchases" fill="#8B5CF6" name="Purchases" />
                <Bar dataKey="profit" fill="#F26522" name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent></Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card><CardHeader><CardTitle>Profit Trend</CardTitle></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={data.comparison}>
                  <defs><linearGradient id="cP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#F26522" stopOpacity={0.8} /><stop offset="95%" stopColor="#F26522" stopOpacity={0.1} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" /><YAxis /><Tooltip />
                  <Area type="monotone" dataKey="profit" stroke="#F26522" fill="url(#cP)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent></Card>
            <Card><CardHeader><CardTitle>P&L Breakdown</CardTitle></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={plBreakdown} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {plBreakdown.map((entry) => <Cell key={entry.name} fill={COLORS[plBreakdown.indexOf(entry)]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="sales"><Card><CardHeader><CardTitle>Sales Report</CardTitle></CardHeader><CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data.sales}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" /><YAxis /><Tooltip /><Legend />
              <Line type="monotone" dataKey="amount" stroke="#F26522" strokeWidth={2} name="Sales" />
              <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent></Card></TabsContent>

        <TabsContent value="purchases"><Card><CardHeader><CardTitle>Purchase Report</CardTitle></CardHeader><CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.purchases}>
              <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" /><YAxis /><Tooltip /><Legend />
              <Bar dataKey="amount" fill="#8B5CF6" name="Purchase Value" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent></Card></TabsContent>

        <TabsContent value="expenses"><Card><CardHeader><CardTitle>Expense Report by Category</CardTitle></CardHeader><CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie data={data.expenses} cx="50%" cy="50%" outerRadius={110} dataKey="amount" nameKey="category" label={(e) => e.category}>
                {(data.expenses || []).map((cat) => <Cell key={cat.category} fill={COLORS[(data.expenses || []).indexOf(cat) % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent></Card></TabsContent>

        <TabsContent value="assets"><Card><CardHeader><CardTitle>Assets Management</CardTitle></CardHeader><CardContent>
          {(data.assets || []).length === 0 ? (<p className="text-center py-8 text-gray-500">No assets recorded.</p>) : (
            <table className="w-full">
              <thead><tr className="border-b bg-gray-50">
                <th className="text-left py-2 px-3 text-xs uppercase font-semibold text-gray-600">Asset</th>
                <th className="text-left py-2 px-3 text-xs uppercase font-semibold text-gray-600">Category</th>
                <th className="text-right py-2 px-3 text-xs uppercase font-semibold text-gray-600">Purchase Value</th>
                <th className="text-right py-2 px-3 text-xs uppercase font-semibold text-gray-600">Current Value</th>
                <th className="text-right py-2 px-3 text-xs uppercase font-semibold text-gray-600">Depreciation</th>
              </tr></thead>
              <tbody>
                {data.assets.map((a) => (
                  <tr key={a.id || a.name} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{a.name}</td>
                    <td className="py-2 px-3"><Badge variant="outline">{a.category}</Badge></td>
                    <td className="py-2 px-3 text-right">{formatCurrency(a.purchaseValue)}</td>
                    <td className="py-2 px-3 text-right font-semibold">{formatCurrency(a.currentValue)}</td>
                    <td className="py-2 px-3 text-right text-red-600">-{formatCurrency(a.purchaseValue - a.currentValue)}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-orange-50">
                  <td colSpan="3" className="py-2 px-3 text-right">Total Asset Value:</td>
                  <td className="py-2 px-3 text-right" style={{ color: '#F26522' }}>{formatCurrency(data.assets.reduce((s, a) => s + a.currentValue, 0))}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          )}
        </CardContent></Card></TabsContent>

        <TabsContent value="customers"><div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card><CardHeader><CardTitle>Top Customers</CardTitle></CardHeader><CardContent>
            {(data.topCustomers || []).map((c, i) => (
              <div key={c.id || c.name} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: COLORS[i % COLORS.length] }}>{i + 1}</div>
                  <span className="font-medium">{c.name}</span>
                </div>
                <span className="font-bold" style={{ color: '#F26522' }}>{formatCurrency(c.amount)}</span>
              </div>
            ))}
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Top Products</CardTitle></CardHeader><CardContent>
            {(data.topProducts || []).map((p, i) => (
              <div key={p.id || p.name} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: COLORS[i % COLORS.length] }}>{i + 1}</div>
                  <span className="font-medium">{p.name}</span>
                </div>
                <div className="text-right"><p className="font-bold" style={{ color: '#F26522' }}>{formatCurrency(p.revenue)}</p><p className="text-xs text-gray-500">{p.quantity} sold</p></div>
              </div>
            ))}
          </CardContent></Card>
        </div></TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
