import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import { tasksAPI, employeesAPI } from '@/services/api';
import { clearGasCache } from '@/services/gasClient';
import { useAuth, getUserDisplayName } from '@/context/AuthContext';
import {
  Plus, Search, Edit, Trash2, ListTodo, Clock, PlayCircle, PauseCircle,
  CheckCircle2, XCircle, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUSES = ['Pending', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const STATUS_STYLE = {
  Pending: { bg: 'bg-amber-50 text-amber-800 border-amber-200', tint: '#F59E0B', icon: Clock },
  'In Progress': { bg: 'bg-sky-50 text-sky-800 border-sky-200', tint: '#0EA5E9', icon: PlayCircle },
  'On Hold': { bg: 'bg-slate-100 text-slate-700 border-slate-200', tint: '#64748B', icon: PauseCircle },
  Completed: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', tint: '#10B981', icon: CheckCircle2 },
  Cancelled: { bg: 'bg-rose-50 text-rose-800 border-rose-200', tint: '#F43F5E', icon: XCircle },
};

const PRIORITY_STYLE = {
  Low: 'bg-slate-100 text-slate-600',
  Medium: 'bg-blue-50 text-blue-700',
  High: 'bg-orange-50 text-orange-800',
  Urgent: 'bg-red-50 text-red-700',
};

const emptyForm = {
  title: '',
  description: '',
  assigneeId: '',
  assigneeName: '',
  priority: 'Medium',
  status: 'Pending',
  deadline: '',
};

function ymd(value) {
  const s = String(value || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}

function isOverdue(task) {
  const d = ymd(task.deadline);
  if (!d || task.status === 'Completed' || task.status === 'Cancelled') return false;
  return d < new Date().toISOString().slice(0, 10);
}

const Tasks = () => {
  const { user, hasFullAccess } = useAuth();
  const me = getUserDisplayName(user);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [deadlineFilter, setDeadlineFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      clearGasCache();
      const [taskRes, empRes] = await Promise.all([
        tasksAPI.getAll(),
        employeesAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setTasks(Array.isArray(taskRes.data) ? taskRes.data : []);
      const emps = Array.isArray(empRes.data) ? empRes.data : [];
      setEmployees(emps.filter((e) => String(e.status || 'Active').toLowerCase() !== 'inactive'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c = { total: tasks.length, overdue: 0 };
    STATUSES.forEach((s) => { c[s] = 0; });
    tasks.forEach((t) => {
      c[t.status] = (c[t.status] || 0) + 1;
      if (isOverdue(t)) c.overdue += 1;
    });
    return c;
  }, [tasks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const today = new Date().toISOString().slice(0, 10);
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (employeeFilter !== 'all' && t.assigneeId !== employeeFilter) return false;
      if (deadlineFilter === 'overdue' && !isOverdue(t)) return false;
      if (deadlineFilter === 'today' && ymd(t.deadline) !== today) return false;
      if (deadlineFilter === 'upcoming' && (!ymd(t.deadline) || ymd(t.deadline) <= today || t.status === 'Completed')) return false;
      if (!q) return true;
      return [t.title, t.description, t.assigneeName, t.priority, t.status]
        .some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [tasks, search, statusFilter, priorityFilter, employeeFilter, deadlineFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (task) => {
    setEditing(task);
    setForm({
      title: task.title || '',
      description: task.description || '',
      assigneeId: task.assigneeId || '',
      assigneeName: task.assigneeName || '',
      priority: task.priority || 'Medium',
      status: task.status || 'Pending',
      deadline: ymd(task.deadline),
    });
    setDialogOpen(true);
  };

  const pickAssignee = (empId) => {
    const emp = employees.find((e) => e.id === empId);
    setForm((f) => ({
      ...f,
      assigneeId: empId,
      assigneeName: emp ? emp.name : '',
    }));
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        createdByName: me,
      };
      if (editing) await tasksAPI.update(editing.id, body);
      else await tasksAPI.create(body);
      toast.success(editing ? 'Task updated' : 'Task created');
      setDialogOpen(false);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save task');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (task, status) => {
    try {
      await tasksAPI.updateStatus(task.id, status);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status } : t)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update status');
    }
  };

  const remove = async (task) => {
    if (!window.confirm(`Delete task “${task.title}”?`)) return;
    try {
      await tasksAPI.delete(task.id);
      toast.success('Task deleted');
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete task');
    }
  };

  const isMine = (task) => {
    const empId = user?.employeeId || user?.employee_id || '';
    return (empId && task.assigneeId === empId)
      || (me && String(task.assigneeName || '').toLowerCase() === me.toLowerCase());
  };

  return (
    <div className="erp-page space-y-4" data-testid="tasks-page">
      <PageHeader
        eyebrow="Operations"
        title="Internal Tasks"
        subtitle="Assign daily work, track status, and keep deadlines visible."
        testId="tasks-header"
        actions={(
          <Button onClick={openCreate} data-testid="task-new">
            <Plus className="h-4 w-4 mr-1" /> New task
          </Button>
        )}
      />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
        {STATUSES.map((s) => {
          const meta = STATUS_STYLE[s];
          const Icon = meta.icon;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
              className={`erp-kpi text-left ${statusFilter === s ? 'ring-2 ring-offset-1' : ''}`}
              style={statusFilter === s ? { ringColor: meta.tint } : undefined}
              data-testid={`task-kpi-${s.replace(/\s+/g, '-').toLowerCase()}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wide text-slate-500">{s}</span>
                <Icon className="h-4 w-4" style={{ color: meta.tint }} />
              </div>
              <p className="text-2xl font-bold mt-1" style={{ color: meta.tint }}>{counts[s] || 0}</p>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setDeadlineFilter(deadlineFilter === 'overdue' ? 'all' : 'overdue')}
          className={`erp-kpi text-left ${deadlineFilter === 'overdue' ? 'ring-2 ring-rose-400' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wide text-slate-500">Overdue</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold mt-1 text-rose-600">{counts.overdue}</p>
        </button>
      </div>

      <div className="erp-panel p-3 flex flex-col lg:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" placeholder="Search title, assignee, notes…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="h-10 rounded-md border px-3 text-sm" value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
          <option value="all">All employees</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select className="h-10 rounded-md border px-3 text-sm" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="all">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select className="h-10 rounded-md border px-3 text-sm" value={deadlineFilter} onChange={(e) => setDeadlineFilter(e.target.value)}>
          <option value="all">Any deadline</option>
          <option value="today">Due today</option>
          <option value="upcoming">Upcoming</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="erp-panel overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-slate-500">Loading tasks…</p>
        ) : !filtered.length ? (
          <div className="p-10 text-center text-slate-500">
            <ListTodo className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>No tasks match these filters.</p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((task) => {
              const style = STATUS_STYLE[task.status] || STATUS_STYLE.Pending;
              return (
                <article key={task.id} className="p-4 flex flex-col md:flex-row md:items-start gap-3" data-testid="task-row">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-ink">{task.title}</h3>
                      <Badge className={`${style.bg} border`}>{task.status}</Badge>
                      <Badge className={PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.Medium}>{task.priority}</Badge>
                      {isOverdue(task) ? <Badge className="bg-rose-600 text-white">Overdue</Badge> : null}
                      {isMine(task) ? <Badge variant="outline">Assigned to you</Badge> : null}
                    </div>
                    {task.description ? <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{task.description}</p> : null}
                    <p className="text-xs text-slate-500 mt-2">
                      {task.assigneeName || 'Unassigned'}
                      {task.deadline ? ` · Due ${ymd(task.deadline)}` : ''}
                      {task.createdByName ? ` · By ${task.createdByName}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <select
                      className="h-9 rounded-md border px-2 text-sm"
                      value={task.status}
                      onChange={(e) => changeStatus(task, e.target.value)}
                      data-testid="task-status"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(task)}><Edit className="h-4 w-4" /></Button>
                    {(hasFullAccess || isMine(task) || task.createdBy === user?.id) ? (
                      <Button size="sm" variant="ghost" onClick={() => remove(task)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit task' : 'New internal task'}</DialogTitle>
            <DialogDescription>Assign work to an employee and track it to completion.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Follow up paper stock" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Assign to</Label>
                <select className="mt-1 h-10 w-full rounded-md border px-3 text-sm" value={form.assigneeId} onChange={(e) => pickAssignee(e.target.value)}>
                  <option value="">Unassigned</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}{e.designation ? ` · ${e.designation}` : ''}</option>)}
                </select>
              </div>
              <div>
                <Label>Deadline</Label>
                <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </div>
              <div>
                <Label>Priority</Label>
                <select className="mt-1 h-10 w-full rounded-md border px-3 text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <Label>Status</Label>
                <select className="mt-1 h-10 w-full rounded-md border px-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save task'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tasks;
