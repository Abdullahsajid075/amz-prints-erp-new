import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { employeesAPI } from '@/services/api';
import { useBrand } from '@/context/BrandContext';
import { formatCurrency } from '@/utils/helpers';
import {
  Plus, Search, Edit, Trash2, UsersRound, Phone, Mail, Briefcase, Building2,
} from 'lucide-react';
import { toast } from 'sonner';

const empty = {
  name: '',
  phone: '',
  email: '',
  role: 'Staff',
  department: 'General',
  joinDate: new Date().toISOString().slice(0, 10),
  salary: '',
  status: 'Active',
  address: '',
  notes: '',
};

const ROLES = ['Staff', 'Manager', 'Designer', 'Production', 'Accounts', 'Sales', 'HR', 'Admin', 'Other'];
const DEPARTMENTS = ['General', 'Sales', 'Design', 'Production', 'Accounts', 'HR', 'Warehouse', 'Management'];

const Employees = () => {
  const { primary } = useBrand();
  const accent = primary || '#F26522';
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeesAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : [];
      setEmployees(list.map((e) => ({
        id: e.id,
        name: e.name || '',
        phone: e.phone || '',
        email: e.email || '',
        role: e.role || 'Staff',
        department: e.department || 'General',
        joinDate: e.joinDate || e.joindate || '',
        salary: e.salary,
        status: e.status || 'Active',
        address: e.address || '',
        notes: e.notes || '',
      })));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [e.name, e.phone, e.email, e.role, e.department, e.status]
        .some((v) => String(v || '').toLowerCase().includes(q))
    );
  }, [employees, search]);

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter((e) => String(e.status || 'Active').toLowerCase() === 'active').length,
    departments: new Set(employees.map((e) => e.department || 'General')).size,
  }), [employees]);

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setDialogOpen(true);
  };

  const openEdit = (emp) => {
    setEditing(emp);
    setForm({
      ...empty,
      ...emp,
      salary: emp.salary != null ? String(emp.salary) : '',
      joinDate: emp.joinDate || emp.joindate || empty.joinDate,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        salary: form.salary === '' ? '' : Number(form.salary) || 0,
      };
      if (editing) {
        await employeesAPI.update(editing.id, payload);
        toast.success('Employee updated');
      } else {
        await employeesAPI.create(payload);
        toast.success('Employee added');
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee?')) return;
    try {
      await employeesAPI.delete(id);
      toast.success('Deleted');
      load();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6" data-testid="employees-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#1F2937' }}>HR · Employees</h1>
          <p className="text-gray-600 mt-1">Staff directory, roles, departments & status</p>
        </div>
        <Button onClick={openCreate} className="text-white" style={{ backgroundColor: accent }} data-testid="add-employee-button">
          <Plus className="h-4 w-4 mr-2" />Add Employee
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: accent }}>
              <UsersRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Total</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500 text-white">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Active</p>
              <p className="text-lg font-bold text-emerald-700">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Departments</p>
              <p className="text-lg font-bold">{stats.departments}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input className="pl-9" placeholder="Search employees…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading employees…</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No employees yet. Click Add Employee to create the HR directory.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((emp) => (
            <Card key={emp.id} className="hover:shadow-md transition-shadow" data-testid={`employee-${emp.id}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-lg" style={{ color: '#1F2937' }}>{emp.name}</p>
                    <p className="text-sm text-gray-500">{emp.role || 'Staff'} · {emp.department || 'General'}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={String(emp.status || '').toLowerCase() === 'active' ? 'border-emerald-300 text-emerald-700' : 'border-gray-300 text-gray-500'}
                  >
                    {emp.status || 'Active'}
                  </Badge>
                </div>
                {emp.phone && <p className="text-sm text-gray-600 flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{emp.phone}</p>}
                {emp.email && <p className="text-sm text-gray-600 flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{emp.email}</p>}
                {emp.salary !== '' && emp.salary != null && (
                  <p className="text-sm font-medium" style={{ color: accent }}>Salary: {formatCurrency(Number(emp.salary) || 0)}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(emp)}>
                    <Edit className="h-3.5 w-3.5 mr-1" />Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(emp.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit employee' : 'Add employee'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label>Full name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>Role</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <Label>Department</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                >
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <Label>Join date</Label>
                <Input type="date" value={form.joinDate} onChange={(e) => setForm({ ...form, joinDate: e.target.value })} />
              </div>
              <div>
                <Label>Salary</Label>
                <Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
              </div>
              <div>
                <Label>Status</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Notes</Label>
                <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="text-white" style={{ backgroundColor: accent }} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Employees;
