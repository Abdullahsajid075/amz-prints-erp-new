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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { customersAPI, settingsAPI } from '@/services/api';
import { customerMatchesQuery } from '@/utils/customerSearch';
import { resolveCrmStages, normalizeStageKey, DEFAULT_CRM_STAGES } from '@/utils/crmStages';
import { useBrand } from '@/context/BrandContext';
import { useAuth } from '@/context/AuthContext';
import {
  Search, StickyNote, Phone, Mail, Plus, Trash2, GripVertical, Users, Trophy, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

function CustomerCard({ customer, stageColor, onOpen, dragOverlay = false }) {
  return (
    <div
      className={`rounded-lg border bg-white p-3 shadow-sm ${dragOverlay ? 'shadow-lg ring-2 ring-orange-200' : 'hover:border-orange-200'}`}
      style={{ borderColor: '#E5E7EB' }}
    >
      <div className="flex items-start gap-2">
        {!dragOverlay && <GripVertical className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate" style={{ color: '#1F2937' }}>{customer.name || 'Unnamed'}</p>
          {customer.phone && (
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 truncate">
              <Phone className="h-3 w-3 shrink-0" />{customer.phone}
            </p>
          )}
          {customer.email && (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 truncate">
              <Mail className="h-3 w-3 shrink-0" />{customer.email}
            </p>
          )}
          {customer.city && <p className="text-[11px] text-gray-400 mt-1">{customer.city}</p>}
          <div className="mt-2 flex items-center justify-between gap-2">
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${stageColor}18`, color: stageColor }}
            >
              CRM
            </span>
            {!dragOverlay && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); onOpen(customer); }}>
                <StickyNote className="h-3 w-3 mr-1" />Notes
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableCustomerCard({ customer, stageColor, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: customer.id,
    data: { type: 'customer', customer },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} data-testid={`crm-card-${customer.id}`}>
      <CustomerCard customer={customer} stageColor={stageColor} onOpen={onOpen} />
    </div>
  );
}

function StageColumn({ stage, customers, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key, data: { type: 'stage', stageKey: stage.key } });
  return (
    <Card
      className={`flex flex-col min-w-[260px] w-[260px] shrink-0 ${isOver ? 'ring-2 ring-orange-300' : ''}`}
      data-testid={`crm-stage-${stage.key}`}
    >
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="flex items-center justify-between text-sm font-semibold">
          <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
            {stage.label}
          </span>
          <Badge variant="outline" className="text-xs">{customers.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-3 flex-1">
        <div
          ref={setNodeRef}
          className="space-y-2 min-h-[120px] rounded-md p-1 transition-colors"
          style={{ backgroundColor: isOver ? `${stage.color}10` : 'transparent' }}
        >
          <SortableContext items={customers.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {customers.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-xs">Drop customers here</p>
            ) : (
              customers.map((c) => (
                <SortableCustomerCard key={c.id} customer={c} stageColor={stage.color} onOpen={onOpen} />
              ))
            )}
          </SortableContext>
        </div>
      </CardContent>
    </Card>
  );
}

const CustomerCRM = () => {
  const { primary } = useBrand();
  const { user } = useAuth();
  const accent = primary || '#ff6d00';

  const [allCustomers, setAllCustomers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stages, setStages] = useState(DEFAULT_CRM_STAGES);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const [quickOpen, setQuickOpen] = useState(false);
  const [addMode, setAddMode] = useState('new'); // new | existing
  const [existingId, setExistingId] = useState('');
  const [quickForm, setQuickForm] = useState({ name: '', phone: '', email: '', city: '', stage: 'lead', notes: '' });
  const [savingQuick, setSavingQuick] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [custRes, setRes] = await Promise.all([
        customersAPI.getAll(),
        settingsAPI.get().catch(() => ({ data: {} })),
      ]);
      const list = Array.isArray(custRes.data) ? custRes.data : [];
      setAllCustomers(list);
      // Only manually added CRM members — never auto-import directory
      setCustomers(list.filter((c) => c.inCrm === true));
      setStages(resolveCrmStages(setRes.data?.crm));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load CRM');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    return customers.filter((c) => {
      if (customerMatchesQuery(c, search)) return true;
      return String(c.stage || '').toLowerCase().includes(search.trim().toLowerCase());
    });
  }, [customers, search]);

  const byStage = useMemo(() => {
    const map = {};
    stages.forEach((s) => { map[s.key] = []; });
    const known = new Set(stages.map((s) => s.key));
    const fallback = stages[0]?.key || 'lead';
    filtered.forEach((c) => {
      const key = normalizeStageKey(c.stage);
      const bucket = known.has(key) ? key : fallback;
      if (!map[bucket]) map[bucket] = [];
      map[bucket].push(c);
    });
    return map;
  }, [filtered, stages]);

  const stats = useMemo(() => ({
    total: customers.length,
    won: customers.filter((c) => normalizeStageKey(c.stage) === 'won').length,
    lost: customers.filter((c) => normalizeStageKey(c.stage) === 'lost').length,
    active: customers.filter((c) => !['won', 'lost'].includes(normalizeStageKey(c.stage))).length,
  }), [customers]);

  const activeCustomer = activeId ? customers.find((c) => c.id === activeId) : null;
  const activeStageColor = activeCustomer
    ? (stages.find((s) => s.key === normalizeStageKey(activeCustomer.stage))?.color || accent)
    : accent;

  const findStageOf = (customerId) => {
    const c = customers.find((x) => x.id === customerId);
    return c ? normalizeStageKey(c.stage) : null;
  };

  const moveCustomer = async (customerId, newStage) => {
    const stage = normalizeStageKey(newStage);
    const prev = customers.find((c) => c.id === customerId);
    if (!prev || normalizeStageKey(prev.stage) === stage) return;

    setCustomers((list) => list.map((c) => (c.id === customerId ? { ...c, stage } : c)));
    try {
      await customersAPI.updateStage(customerId, stage);
      toast.success(`${prev.name || 'Customer'} → ${stages.find((s) => s.key === stage)?.label || stage}`);
    } catch (err) {
      console.error(err);
      setCustomers((list) => list.map((c) => (c.id === customerId ? { ...c, stage: prev.stage } : c)));
      toast.error(err.response?.data?.message || 'Failed to move stage');
    }
  };

  const onDragStart = (event) => setActiveId(event.active.id);

  const onDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const customerId = active.id;
    let targetStage = null;
    if (over.data?.current?.type === 'stage') {
      targetStage = over.data.current.stageKey;
    } else if (over.data?.current?.type === 'customer') {
      targetStage = findStageOf(over.id);
    } else if (stages.some((s) => s.key === over.id)) {
      targetStage = over.id;
    } else {
      targetStage = findStageOf(over.id);
    }
    if (targetStage) moveCustomer(customerId, targetStage);
  };

  const openDetail = async (customer) => {
    setSelected(customer);
    setDetailOpen(true);
    setNoteText('');
    setNotesLoading(true);
    try {
      const res = await customersAPI.getNotes(customer.id);
      setNotes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notes');
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  };

  const addNote = async () => {
    if (!selected || !noteText.trim()) return;
    setSavingNote(true);
    try {
      const res = await customersAPI.addNote(selected.id, {
        note: noteText.trim(),
        createdBy: user?.name || user?.username || 'staff',
      });
      setNotes((prev) => [res.data, ...prev]);
      setNoteText('');
      toast.success('Note added');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to add note');
    } finally {
      setSavingNote(false);
    }
  };

  const removeNote = async (noteId) => {
    if (!selected || !window.confirm('Delete this note?')) return;
    try {
      await customersAPI.deleteNote(selected.id, noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success('Note deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete note');
    }
  };

  const notInCrm = useMemo(
    () => allCustomers.filter((c) => !c.inCrm),
    [allCustomers]
  );

  const saveQuick = async (e) => {
    e.preventDefault();
    setSavingQuick(true);
    try {
      const stage = normalizeStageKey(quickForm.stage || 'lead');
      if (addMode === 'existing') {
        if (!existingId) {
          toast.error('Select a customer');
          setSavingQuick(false);
          return;
        }
        await customersAPI.setCrm(existingId, { inCrm: true, stage });
        toast.success('Customer added to CRM');
      } else {
        if (!quickForm.name.trim() || !quickForm.phone.trim()) {
          toast.error('Name and phone required');
          setSavingQuick(false);
          return;
        }
        const initialNote = quickForm.notes.trim();
        const res = await customersAPI.create({
          name: quickForm.name.trim(),
          phone: quickForm.phone.trim(),
          email: quickForm.email.trim(),
          city: quickForm.city.trim(),
          stage,
          inCrm: true,
          notes: initialNote,
        });
        const newId = res.data?.id;
        if (newId && initialNote) {
          try {
            await customersAPI.addNote(newId, {
              note: initialNote,
              createdBy: user?.name || user?.username || 'staff',
            });
          } catch { /* ignore */ }
        }
        toast.success('Customer added to CRM');
      }
      setQuickOpen(false);
      setAddMode('new');
      setExistingId('');
      setQuickForm({ name: '', phone: '', email: '', city: '', stage: 'lead', notes: '' });
      load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to add to CRM');
    } finally {
      setSavingQuick(false);
    }
  };

  const removeFromCrm = async () => {
    if (!selected || !window.confirm('Remove this customer from CRM board? (Customer directory stays intact)')) return;
    try {
      await customersAPI.setCrm(selected.id, { inCrm: false });
      toast.success('Removed from CRM');
      setDetailOpen(false);
      setSelected(null);
      load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to remove from CRM');
    }
  };

  return (
    <div className="space-y-5" data-testid="crm-page">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#1F2937' }}>Customer CRM</h1>
          <p className="text-gray-600 mt-1">Only customers you add here — drag stages and keep notes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search name, phone, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="crm-search"
            />
          </div>
          <Button onClick={() => setQuickOpen(true)} className="text-white" style={{ backgroundColor: accent }} data-testid="crm-add-customer">
            <Plus className="h-4 w-4 mr-1.5" />Add to CRM
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: accent }}>
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Total</p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500 text-white">
              <StickyNote className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">In pipeline</p>
              <p className="text-lg font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500 text-white">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Won</p>
              <p className="text-lg font-bold text-emerald-700">{stats.won}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500 text-white">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Lost</p>
              <p className="text-lg font-bold text-rose-600">{stats.lost}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500">Loading CRM board…</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="flex gap-3 overflow-x-auto pb-4" data-testid="crm-board">
            {stages.map((stage) => (
              <StageColumn
                key={stage.key}
                stage={stage}
                customers={byStage[stage.key] || []}
                onOpen={openDetail}
              />
            ))}
          </div>
          <DragOverlay>
            {activeCustomer ? (
              <div className="w-[244px]">
                <CustomerCard customer={activeCustomer} stageColor={activeStageColor} onOpen={() => {}} dragOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" data-testid="crm-notes-dialog">
          <DialogHeader>
            <DialogTitle>{selected?.name || 'Customer'} — Notes</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-gray-50 p-3 text-sm space-y-1">
                {selected.phone && <p className="flex items-center gap-2 text-gray-700"><Phone className="h-3.5 w-3.5" />{selected.phone}</p>}
                {selected.email && <p className="flex items-center gap-2 text-gray-600"><Mail className="h-3.5 w-3.5" />{selected.email}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  Stage:{' '}
                  <span className="font-semibold">
                    {stages.find((s) => s.key === normalizeStageKey(selected.stage))?.label || selected.stage || 'Lead'}
                  </span>
                </p>
                {selected.notes && (
                  <p className="text-xs text-gray-500 pt-1 border-t mt-2">Profile note: {selected.notes}</p>
                )}
              </div>

              <div>
                <Label>Add CRM note</Label>
                <Textarea
                  className="mt-1"
                  rows={3}
                  placeholder="Call summary, follow-up, quote discussion…"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  data-testid="crm-note-input"
                />
                <Button
                  className="mt-2 text-white"
                  style={{ backgroundColor: accent }}
                  disabled={savingNote || !noteText.trim()}
                  onClick={addNote}
                  data-testid="crm-note-save"
                >
                  <Plus className="h-4 w-4 mr-1" />{savingNote ? 'Saving…' : 'Add note'}
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Timeline</p>
                {notesLoading ? (
                  <p className="text-sm text-gray-400 py-4 text-center">Loading notes…</p>
                ) : notes.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">No notes yet</p>
                ) : (
                  notes.map((n) => (
                    <div key={n.id} className="rounded-lg border p-3 bg-white">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap flex-1">{n.note}</p>
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => removeNote(n.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        </Button>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2">
                        {n.createdBy || 'staff'}
                        {n.createdAt ? ` · ${new Date(n.createdAt).toLocaleString()}` : ''}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <Button type="button" variant="outline" className="w-full text-rose-600 border-rose-200" onClick={removeFromCrm}>
                Remove from CRM
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add customer to CRM</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveQuick} className="space-y-3">
            <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-muted">
              <button
                type="button"
                className={`h-9 rounded-md text-sm font-medium ${addMode === 'new' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                onClick={() => setAddMode('new')}
              >
                New customer
              </button>
              <button
                type="button"
                className={`h-9 rounded-md text-sm font-medium ${addMode === 'existing' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
                onClick={() => setAddMode('existing')}
              >
                From directory
              </button>
            </div>

            {addMode === 'existing' ? (
              <div>
                <Label>Select customer *</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1"
                  value={existingId}
                  onChange={(e) => setExistingId(e.target.value)}
                  required
                >
                  <option value="">Choose…</option>
                  {notInCrm.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.phone ? ` · ${c.phone}` : ''}
                    </option>
                  ))}
                </select>
                {!notInCrm.length && (
                  <p className="text-xs text-gray-500 mt-1">All directory customers are already in CRM, or directory is empty.</p>
                )}
              </div>
            ) : (
              <>
                <div>
                  <Label>Name *</Label>
                  <Input value={quickForm.name} onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })} required={addMode === 'new'} />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input value={quickForm.phone} onChange={(e) => setQuickForm({ ...quickForm, phone: e.target.value })} required={addMode === 'new'} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={quickForm.email} onChange={(e) => setQuickForm({ ...quickForm, email: e.target.value })} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={quickForm.city} onChange={(e) => setQuickForm({ ...quickForm, city: e.target.value })} />
                </div>
                <div>
                  <Label>Initial note (optional)</Label>
                  <Textarea
                    rows={2}
                    value={quickForm.notes}
                    onChange={(e) => setQuickForm({ ...quickForm, notes: e.target.value })}
                  />
                </div>
              </>
            )}

            <div>
              <Label>Stage</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={quickForm.stage}
                onChange={(e) => setQuickForm({ ...quickForm, stage: e.target.value })}
              >
                {stages.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setQuickOpen(false)}>Cancel</Button>
              <Button type="submit" className="text-white" style={{ backgroundColor: accent }} disabled={savingQuick}>
                {savingQuick ? 'Saving…' : 'Add to CRM'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerCRM;
