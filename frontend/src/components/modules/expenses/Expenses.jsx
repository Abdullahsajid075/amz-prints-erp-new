import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { expensesAPI } from '@/services/api';
import { formatCurrency, formatDate } from '@/utils/helpers';
import {
  Plus, Search, Edit, Trash2, Receipt, TrendingDown, Calendar, Filter, X, Save,
  Building, Zap, Wrench, Fuel, Users as UsersIcon, ShoppingBag, MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { key: 'Office', label: 'Office Expenses', icon: Building, color: '#3B82F6' },
  { key: 'Salaries', label: 'Salaries & Wages', icon: UsersIcon, color: '#10B981' },
  { key: 'Utilities', label: 'Utilities', icon: Zap, color: '#F59E0B' },
  { key: 'Machinery', label: 'Machinery & Repairs', icon: Wrench, color: '#8B5CF6' },
  { key: 'Fuel', label: 'Fuel & Transport', icon: Fuel, color: '#EF4444' },
  { key: 'Supplies', label: 'Supplies & Materials', icon: ShoppingBag, color: '#EC4899' },
  { key: 'Other', label: 'Miscellaneous', icon: MoreHorizontal, color: '#6B7280' }
];

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Card', 'UPI', 'Cheque'];

const emptyExpense = {
  date: new Date().toISOString().split('T')[0],
  category: 'Office',
  description: '',
  amount: 0,
  paymentMethod: 'Cash',
  paidTo: '',
  notes: ''
};

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', category: undefined, from: '', to: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyExpense);
  const [saving, setSaving] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.category) params.category = filters.category;
      const response = await expensesAPI.getAll(params);
      setExpenses(response.data || []);
    } catch (err) {
      console.error('Failed to fetch expenses', err);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [filters.from, filters.to, filters.category]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchExpenses(); }, []);

  const filtered = expenses.filter(e =>
    !filters.search ||
    e.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
    e.paidTo?.toLowerCase().includes(filters.search.toLowerCase())
  );

  const totals = {
    total: filtered.reduce((s, e) => s + (e.amount || 0), 0),
    thisMonth: filtered.filter(e => {
      const d = new Date(e.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, e) => s + (e.amount || 0), 0),
    today: filtered.filter(e => e.date === new Date().toISOString().split('T')[0])
      .reduce((s, e) => s + (e.amount || 0), 0),
    count: filtered.length
  };

  const categoryTotals = CATEGORIES.map(cat => ({
    ...cat,
    total: filtered.filter(e => e.category === cat.key).reduce((s, e) => s + (e.amount || 0), 0),
    count: filtered.filter(e => e.category === cat.key).length
  })).filter(c => c.count > 0);

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyExpense);
    setDialogOpen(true);
  };

  const openEdit = (expense) => {
    setEditing(expense);
    setFormData(expense);
    setDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await expensesAPI.update(editing.id, formData);
        toast.success('Expense updated');
      } else {
        await expensesAPI.create(formData);
        toast.success('Expense recorded');
      }
      setDialogOpen(false);
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this expense?')) {
      try {
        await expensesAPI.delete(id);
        toast.success('Expense deleted');
        fetchExpenses();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const applyFilter = () => fetchExpenses();
  const resetFilter = () => {
    setFilters({ search: '', category: undefined, from: '', to: '' });
    setTimeout(fetchExpenses, 100);
  };

  const getCategoryConfig = (key) => CATEGORIES.find(c => c.key === key) || CATEGORIES[6];

  return (
    <div className="space-y-6" data-testid="expenses-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#2E2E2E' }}>Expenses</h1>
          <p className="text-gray-600 mt-1">Track and manage all business expenses</p>
        </div>
        <Button
          onClick={openCreate}
          style={{ backgroundColor: '#F26522' }}
          className="text-white"
          data-testid="add-expense-button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Record Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EF4444' }}>
              <TrendingDown className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Total Expenses</p>
              <p className="text-xl font-bold" style={{ color: '#2E2E2E' }}>{formatCurrency(totals.total)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F59E0B' }}>
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">This Month</p>
              <p className="text-xl font-bold" style={{ color: '#2E2E2E' }}>{formatCurrency(totals.thisMonth)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F26522' }}>
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Today</p>
              <p className="text-xl font-bold" style={{ color: '#2E2E2E' }}>{formatCurrency(totals.today)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#8B5CF6' }}>
              <Filter className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Total Entries</p>
              <p className="text-xl font-bold" style={{ color: '#2E2E2E' }}>{totals.count}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {categoryTotals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Breakdown by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {categoryTotals.map(cat => (
                <div key={cat.key} className="p-3 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors">
                  <div className="w-8 h-8 rounded flex items-center justify-center mb-2" style={{ backgroundColor: cat.color }}>
                    <cat.icon className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-xs text-gray-500 truncate">{cat.label}</p>
                  <p className="text-sm font-bold" style={{ color: '#2E2E2E' }}>{formatCurrency(cat.total)}</p>
                  <p className="text-xs text-gray-400">{cat.count} entries</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search expenses..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
                data-testid="expense-search-input"
              />
            </div>
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              placeholder="From date"
              data-testid="expense-from-date"
            />
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              placeholder="To date"
              data-testid="expense-to-date"
            />
            <div className="flex gap-2">
              <Button onClick={applyFilter} style={{ backgroundColor: '#F26522' }} className="text-white flex-1">
                <Filter className="h-4 w-4 mr-1" />
                Apply
              </Button>
              <Button onClick={resetFilter} variant="outline" className="flex-1">Reset</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expense List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading expenses...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">No expenses recorded yet.</p>
              <Button onClick={openCreate} style={{ backgroundColor: '#F26522' }} className="text-white">
                <Plus className="h-4 w-4 mr-2" />
                Record First Expense
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-600">Category</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-600">Description</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-600">Paid To</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold uppercase text-gray-600">Method</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase text-gray-600">Amount</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold uppercase text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(expense => {
                    const cat = getCategoryConfig(expense.category);
                    const Icon = cat.icon;
                    return (
                      <tr key={expense.id} className="border-b hover:bg-orange-50 transition-colors" data-testid={`expense-row-${expense.id}`}>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDate(expense.date)}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded flex items-center justify-center" style={{ backgroundColor: cat.color }}>
                              <Icon className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="text-sm font-medium">{cat.label}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm" style={{ color: '#2E2E2E' }}>{expense.description}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{expense.paidTo || '-'}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">{expense.paymentMethod}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right text-sm font-bold text-red-600">
                          -{formatCurrency(expense.amount)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(expense)} data-testid={`edit-expense-${expense.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(expense.id)} data-testid={`delete-expense-${expense.id}`}>
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 font-bold" style={{ backgroundColor: '#FFF3ED' }}>
                    <td colSpan="5" className="py-3 px-4 text-right uppercase text-sm">Total:</td>
                    <td className="py-3 px-4 text-right text-lg" style={{ color: '#F26522' }}>{formatCurrency(totals.total)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" data-testid="expense-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold" style={{ color: '#2E2E2E' }}>
              {editing ? 'Edit Expense' : 'Record New Expense'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  data-testid="expense-date-input"
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount (Rs) *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  required
                  data-testid="expense-amount-input"
                />
              </div>
            </div>

            <div>
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger data-testid="expense-category-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                placeholder="What is this expense for?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                data-testid="expense-description-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paidTo">Paid To</Label>
                <Input
                  id="paidTo"
                  placeholder="Vendor / Person name"
                  value={formData.paidTo}
                  onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
                  data-testid="expense-paidto-input"
                />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}>
                  <SelectTrigger data-testid="expense-payment-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional details..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                data-testid="expense-notes-input"
              />
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: '#F26522' }}
                className="text-white"
                disabled={saving}
                data-testid="save-expense-button"
              >
                <Save className="h-4 w-4 mr-1" />
                {saving ? 'Saving...' : editing ? 'Update' : 'Record Expense'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Expenses;
