import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { employeesAPI } from '@/services/api';
import { clearGasCache } from '@/services/gasClient';
import { compressImageFile } from '@/utils/productImage';
import {
  printEmployeeCard,
  printEmployeeBadge,
  printExperienceLetter,
} from '@/utils/employeeDocuments';
import { useBrand } from '@/context/BrandContext';
import { formatCurrency } from '@/utils/helpers';
import { sortBy } from '@/utils/sortBy';
import SortBar from '@/components/shared/SortBar';
import {
  Plus, Search, Edit, Trash2, UsersRound, Phone, Briefcase, Building2, ImagePlus,
  IdCard, BadgeCheck, FileText, Download,
} from 'lucide-react';
import { toast } from 'sonner';

const EMPLOYEE_SORT_OPTS = [
  { value: 'name', label: 'Name' },
  { value: 'designation', label: 'Designation' },
  { value: 'department', label: 'Department' },
  { value: 'joinDate', label: 'Join date' },
  { value: 'status', label: 'Status' },
];

const empty = {
  employeeCode: '',
  name: '',
  phone: '',
  email: '',
  cnic: '',
  role: 'Staff',
  designation: '',
  department: 'General',
  joinDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: '',
  salary: '',
  status: 'Active',
  address: '',
  city: '',
  emergencyContact: '',
  emergencyPhone: '',
  notes: '',
  photo: '',
};

const ROLES = ['Staff', 'Manager', 'Designer', 'Production', 'Accounts', 'Sales', 'HR', 'Admin', 'Cashier', 'CEO', 'Director', 'Intern', 'Student', 'Other'];
const DESIGNATIONS = [
  'CEO',
  'Director',
  'Manager',
  'Senior Designer',
  'Designer',
  'Production Supervisor',
  'Accounts Officer',
  'Sales Executive',
  'HR Officer',
  'Cashier',
  'Intern',
  'Student',
  'Other',
];
const DEPARTMENTS = ['General', 'Sales', 'Design', 'Production', 'Accounts', 'HR', 'Warehouse', 'Management', 'Executive'];

const normalizeEmployee = (e) => ({
  id: e.id,
  employeeCode: e.employeeCode || e.employeecode || '',
  name: e.name || '',
  phone: e.phone || '',
  email: e.email || '',
  cnic: e.cnic || '',
  role: e.role || 'Staff',
  designation: e.designation || '',
  department: e.department || 'General',
  joinDate: e.joinDate || e.joindate || '',
  endDate: e.endDate || e.enddate || '',
  validFrom: e.validFrom || e.validfrom || '',
  validUntil: e.validUntil || e.validuntil || '',
  salary: e.salary,
  status: e.status || 'Active',
  address: e.address || '',
  city: e.city || '',
  emergencyContact: e.emergencyContact || e.emergencycontact || '',
  emergencyPhone: e.emergencyPhone || e.emergencyphone || '',
  notes: e.notes || '',
  photo: e.photo || e.image || '',
});

const Employees = () => {
  const { primary, company } = useBrand();
  const accent = primary || '#ff6d00';
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState({ field: 'name', dir: 'asc' });
  const [roleFilter, setRoleFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [docsEmp, setDocsEmp] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      clearGasCache();
      const res = await employeesAPI.getAll();
      const list = Array.isArray(res.data) ? res.data : [];
      setEmployees(list.map(normalizeEmployee));
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
    return employees.filter((e) => {
      if (roleFilter !== 'all' && String(e.role || '') !== roleFilter) return false;
      if (!q) return true;
      return [e.name, e.phone, e.email, e.role, e.department, e.designation, e.employeeCode, e.cnic, e.status]
        .some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [employees, search, roleFilter]);

  const sorted = useMemo(() => sortBy(filtered, sort, {
    name: (e) => e.name || '',
    designation: (e) => e.designation || '',
    department: (e) => e.department || '',
    joinDate: (e) => e.joinDate || '',
    status: (e) => e.status || '',
  }), [filtered, sort]);

  const stats = useMemo(() => ({
    total: employees.length,
    active: employees.filter((e) => String(e.status || 'Active').toLowerCase() === 'active').length,
    designers: employees.filter((e) => /designer/i.test(e.role || '') || /designer/i.test(e.designation || '')).length,
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
      salary: emp.salary != null && emp.salary !== '' ? String(emp.salary) : '',
      joinDate: emp.joinDate || empty.joinDate,
      endDate: emp.endDate || '',
      validFrom: emp.validFrom || emp.joinDate || empty.validFrom,
      validUntil: emp.validUntil || '',
      photo: emp.photo || '',
    });
    setDialogOpen(true);
  };

  const openDocs = (emp) => {
    setDocsEmp(emp);
    setDocsOpen(true);
  };

  const runDoc = (fn) => {
    if (!docsEmp) return;
    const res = fn(docsEmp, company || {});
    if (!res?.ok) toast.error('Popup blocked — allow popups to print / save PDF');
    else toast.message('Print dialog open — choose Save as PDF if needed');
  };

  const onPickPhoto = async (ev) => {
    const file = ev.target.files?.[0];
    ev.target.value = '';
    if (!file) return;
    setImageBusy(true);
    try {
      const dataUrl = await compressImageFile(file);
      setForm((prev) => ({ ...prev, photo: dataUrl }));
      toast.success('Photo ready');
    } catch (err) {
      toast.error(err.message || 'Photo failed');
    } finally {
      setImageBusy(false);
    }
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
        salary: form.salary === '' ? 0 : Number(form.salary) || 0,
        photo: form.photo || '',
        endDate: form.endDate || '',
        validFrom: form.validFrom || '',
        validUntil: form.validUntil || '',
      };
      if (editing) {
        await employeesAPI.update(editing.id, payload);
        toast.success('Employee updated');
      } else {
        await employeesAPI.create(payload);
        toast.success('Employee added');
      }
      clearGasCache();
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
    <div className="space-y-5" data-testid="employees-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1F2937' }}>HR · Employees</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Staff directory · ID card / badge / experience letter · Designers appear in order assignment
          </p>
        </div>
        <Button onClick={openCreate} className="text-white h-9" style={{ backgroundColor: accent }} data-testid="add-employee-button">
          <Plus className="h-4 w-4 mr-1.5" />Add Employee
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: accent }}>
              <UsersRound className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Total</p>
              <p className="text-base font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-500 text-white">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Active</p>
              <p className="text-base font-bold text-emerald-700">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-sky-500 text-white">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Designers</p>
              <p className="text-base font-bold">{stats.designers}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-end">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-9 h-9" placeholder="Search employees…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <SortBar value={sort} onChange={setSort} options={EMPLOYEE_SORT_OPTS} className="w-full sm:w-auto sm:min-w-[280px]" />
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500 text-sm">Loading employees…</div>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-500 text-sm">
            No employees yet. Add staff here — set role <strong>Designer</strong> for order assignment.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {sorted.map((emp) => (
            <Card key={emp.id} className="overflow-hidden hover:shadow-sm transition-shadow" data-testid={`employee-${emp.id}`}>
              <CardContent className="p-0">
                <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden relative">
                  {emp.photo ? (
                    <img src={emp.photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UsersRound className="h-8 w-8 text-gray-300" />
                  )}
                  <Badge
                    variant="outline"
                    className={`absolute top-1 right-1 text-[9px] px-1 py-0 h-4 bg-white/90 ${
                      String(emp.status || '').toLowerCase() === 'active'
                        ? 'border-emerald-300 text-emerald-700'
                        : 'border-gray-300 text-gray-500'
                    }`}
                  >
                    {emp.status || 'Active'}
                  </Badge>
                </div>
                <div className="p-2 space-y-1">
                  <p className="font-semibold text-sm leading-tight line-clamp-1" style={{ color: '#1F2937' }}>{emp.name}</p>
                  <p className="text-[11px] text-gray-500 line-clamp-1">
                    {emp.designation || emp.role || 'Staff'}
                    {emp.department ? ` · ${emp.department}` : ''}
                  </p>
                  {emp.validUntil && (
                    <p className="text-[10px] text-amber-700">Valid till {emp.validUntil}</p>
                  )}
                  {emp.phone && (
                    <p className="text-[11px] text-gray-600 flex items-center gap-1 truncate">
                      <Phone className="h-3 w-3 shrink-0" />{emp.phone}
                    </p>
                  )}
                  {emp.salary != null && emp.salary !== '' && Number(emp.salary) > 0 && (
                    <p className="text-[11px] font-medium" style={{ color: accent }}>{formatCurrency(Number(emp.salary) || 0)}</p>
                  )}
                  <div className="flex gap-1 pt-1">
                    <Button size="sm" variant="outline" className="h-7 flex-1 text-[11px]" onClick={() => openEdit(emp)}>
                      <Edit className="h-3 w-3 mr-1" />Edit
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" title="Card / Badge / Letter" onClick={() => openDocs(emp)}>
                      <IdCard className="h-3.5 w-3.5" style={{ color: accent }} />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDelete(emp.id)}>
                      <Trash2 className="h-3 w-3 text-rose-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={docsOpen} onOpenChange={setDocsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Documents — {docsEmp?.name}</DialogTitle>
            <DialogDescription>
              Print or Save as PDF from the browser print dialog. Card {`2.2"×3.5"`} · Badge 65×25 mm.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Button className="justify-start text-white h-10" style={{ backgroundColor: accent }} onClick={() => runDoc(printEmployeeCard)}>
              <IdCard className="h-4 w-4 mr-2" /> View / Download ID Card (double-sided)
            </Button>
            <Button variant="outline" className="justify-start h-10" onClick={() => runDoc(printEmployeeBadge)}>
              <BadgeCheck className="h-4 w-4 mr-2" /> View / Download Name Badge
            </Button>
            <Button variant="outline" className="justify-start h-10" onClick={() => runDoc(printExperienceLetter)}>
              <FileText className="h-4 w-4 mr-2" /> Download Experience Letter
            </Button>
            <p className="text-[11px] text-gray-500 flex items-start gap-1.5 pt-1">
              <Download className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              Experience letter uses Settings logo, stamp &amp; signature. QR opens public verification.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit employee' : 'Add employee'}</DialogTitle>
            <DialogDescription>
              Photo saves even without Google Drive (compressed). Set card validity for ID cards.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg border bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
                {form.photo ? (
                  <img src={form.photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <ImagePlus className="h-5 w-5 text-gray-300" />
                )}
              </div>
              <div className="space-y-1 flex-1">
                <Label>Photo</Label>
                <Input type="file" accept="image/*" onChange={onPickPhoto} disabled={imageBusy} className="text-xs" />
                {form.photo && (
                  <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-red-600 px-0" onClick={() => setForm({ ...form, photo: '' })}>
                    Remove photo
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label>Full name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <Label>Employee code</Label>
                <Input value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })} placeholder="EMP-001" />
              </div>
              <div>
                <Label>CNIC</Label>
                <Input value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value })} placeholder="xxxxx-xxxxxxx-x" />
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
                <Label>Role *</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <Label>Designation</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={DESIGNATIONS.includes(form.designation) ? form.designation : (form.designation ? 'Other' : '')}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === 'Other') setForm({ ...form, designation: form.designation && !DESIGNATIONS.includes(form.designation) ? form.designation : '' });
                    else setForm({ ...form, designation: v });
                  }}
                >
                  <option value="">Select…</option>
                  {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                {(form.designation === '' || form.designation === 'Other' || !DESIGNATIONS.includes(form.designation)) && (
                  <Input
                    className="mt-1.5"
                    value={form.designation === 'Other' ? '' : form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    placeholder="Custom designation"
                  />
                )}
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
                <Label>End date (experience letter)</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <div>
                <Label>Card valid from</Label>
                <Input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
              </div>
              <div>
                <Label>Card valid until</Label>
                <Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
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
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div>
                <Label>Emergency contact</Label>
                <Input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
              </div>
              <div>
                <Label>Emergency phone</Label>
                <Input value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Notes</Label>
                <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="text-white" style={{ backgroundColor: accent }} disabled={saving || imageBusy}>
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
