import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  CheckCircle2, XCircle, AlertTriangle, GripVertical, User,
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

function TaskCard({ task, onEdit, onDelete, overlay }) {
  const style = STATUS_STYLE[task.status] || STATUS_STYLE.Pending;
  return (
    <article
      className={`rounded-xl border bg-white p-3 shadow-sm ${overlay ? 'shadow-xl ring-2 ring-orange-200' : 'hover:shadow-md'}`}
      data-testid="task-card"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 mt-0.5 text-slate-300 shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-ink text-sm leading-snug">{task.title}</h3>
          <div className="flex flex-wrap gap-1 mt-1.5">
            <Badge className={PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.Medium}>{task.priority}</Badge>
            {isOverdue(task) ? <Badge className="bg-rose-600 text-white">Overdue</Badge> : null}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <User className="h-3 w-3" />
            {task.assigneeName || 'Unassigned'}
          </p>
          {task.deadline ? (
            <p className="text-[11px] text-slate-500 mt-0.5">Due {ymd(task.deadline)}</p>
          ) : null}
          <p className="text-[10px] uppercase tracking-wide mt-1" style={{ color: style.tint }}>{task.status}</p>
          <div className="flex gap-1 mt-2">
            <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={(e) => { e.stopPropagation(); onDelete(task); }}>
              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function SortableTaskCard({ task, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', status: task.status },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function StatusColumn({ status, tasks, onEdit, onDelete }) {
  const meta = STATUS_STYLE[status];
  const Icon = meta.icon;
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: 'status', status } });
  return (
    <section
      className={`min-w-[240px] w-[240px] shrink-0 rounded-2xl border bg-slate-50/80 ${isOver ? 'ring-2 ring-orange-300' : ''}`}
      data-testid={`task-column-${status.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <header className="px-3 py-2.5 flex items-center justify-between border-b bg-white/80 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.tint }} />
          <h2 className="text-sm font-semibold">{status}</h2>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <Icon className="h-3.5 w-3.5" style={{ color: meta.tint }} />
          <Badge variant="outline">{tasks.length}</Badge>
        </div>
      </header>
      <div ref={setNodeRef} className="p-2 space-y-2 min-h-[220px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400">Drop tasks here</p>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
            ))
          )}
        </SortableContext>
      </div>
    </section>
  );
}

const Tasks = () => {
  const { user, hasFullAccess } = useAuth();
  const me = getUserDisplayName(user);
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [deadlineFilter, setDeadlineFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const today = new Date().toISOString().slice(0, 10);
    return tasks.filter((t) => {
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (employeeFilter !== 'all' && t.assigneeId !== employeeFilter) return false;
      if (deadlineFilter === 'overdue' && !isOverdue(t)) return false;
      if (deadlineFilter === 'today' && ymd(t.deadline) !== today) return false;
      if (deadlineFilter === 'upcoming' && (!ymd(t.deadline) || ymd(t.deadline) <= today || t.status === 'Completed')) return false;
      if (!q) return true;
      return [t.title, t.description, t.assigneeName, t.priority, t.status]
        .some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [tasks, search, priorityFilter, employeeFilter, deadlineFilter]);

  const byStatus = useMemo(() => {
    const map = {};
    STATUSES.forEach((s) => { map[s] = []; });
    filtered.forEach((t) => {
      const key = STATUSES.includes(t.status) ? t.status : 'Pending';
      map[key].push(t);
    });
    return map;
  }, [filtered]);

  const counts = useMemo(() => {
    const c = { total: tasks.length, overdue: 0 };
    STATUSES.forEach((s) => { c[s] = 0; });
    tasks.forEach((t) => {
      c[t.status] = (c[t.status] || 0) + 1;
      if (isOverdue(t)) c.overdue += 1;
    });
    return c;
  }, [tasks]);

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
      const body = { ...form, createdByName: me };
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
    if (!task?.id || task.status === status) return;
    const prev = task.status;
    setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, status } : t)));
    try {
      await tasksAPI.updateStatus(task.id, status);
    } catch (err) {
      setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, status: prev } : t)));
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

  const canDelete = (task) => {
    const empId = user?.employeeId || user?.employee_id || '';
    const mine = (empId && task.assigneeId === empId)
      || (me && String(task.assigneeName || '').toLowerCase() === me.toLowerCase());
    return hasFullAccess || mine || task.createdBy === user?.id;
  };

  const activeTask = tasks.find((t) => t.id === activeId);

  const onDragEnd = async (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;
    const overStatus = over.data?.current?.status
      || (STATUSES.includes(over.id) ? over.id : tasks.find((t) => t.id === over.id)?.status);
    if (overStatus && overStatus !== task.status) {
      await changeStatus(task, overStatus);
    }
  };

  return (
    <div className="erp-page space-y-4" data-testid="tasks-page">
      <PageHeader
        eyebrow="Operations"
        title="Internal Tasks"
        subtitle="CRM-style board — drag cards to update status instantly."
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
            <div key={s} className="erp-kpi text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wide text-slate-500">{s}</span>
                <Icon className="h-4 w-4" style={{ color: meta.tint }} />
              </div>
              <p className="text-2xl font-bold mt-1" style={{ color: meta.tint }}>{counts[s] || 0}</p>
            </div>
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

      {loading ? (
        <p className="p-8 text-center text-slate-500">Loading tasks…</p>
      ) : !filtered.length ? (
        <div className="erp-panel p-10 text-center text-slate-500">
          <ListTodo className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>No tasks match these filters.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={(e) => setActiveId(e.active.id)}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="flex gap-3 overflow-x-auto pb-4" data-testid="task-board">
            {STATUSES.map((status) => (
              <StatusColumn
                key={status}
                status={status}
                tasks={byStatus[status] || []}
                onEdit={openEdit}
                onDelete={(task) => { if (canDelete(task)) remove(task); else toast.error('You can only delete your own tasks'); }}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask ? <div className="w-[228px]"><TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} overlay /></div> : null}
          </DragOverlay>
        </DndContext>
      )}

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
