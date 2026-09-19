import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { customersAPI } from '@/services/api';
import { customerMatchesQuery } from '@/utils/customerSearch';
import { UserPlus, User, Search, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Searchable customer select + add-new dialog.
 * Type name or phone to filter — works with large customer lists.
 */
export default function CustomerPicker({
  customers = [],
  customerId = '',
  customerName = '',
  customerPhone = '',
  customerEmail = '',
  customerAddress = '',
  onChange,
  onCustomersChange,
  accent = '#ff6d00',
  testId = 'customer-select',
  locked = false,
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ name: '', phone: '', email: '', address: '' });
  const [query, setQuery] = useState('');
  const [listOpen, setListOpen] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const options = useMemo(() => {
    const list = (Array.isArray(customers) ? customers : [])
      .filter((c) => c && (c.id || c.name))
      .map((c) => ({
        ...c,
        id: String(c.id || c.phone || c.name),
      }));
    if (customerId && !list.some((c) => String(c.id) === String(customerId))) {
      list.unshift({
        id: String(customerId),
        name: customerName || 'Selected customer',
        phone: customerPhone,
        email: customerEmail,
        address: customerAddress,
      });
    }
    return list;
  }, [customers, customerId, customerName, customerPhone, customerEmail, customerAddress]);

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return options.slice(0, 80);
    return options.filter((c) => customerMatchesQuery(c, q)).slice(0, 80);
  }, [options, query]);

  useEffect(() => {
    if (!listOpen) return undefined;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setListOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [listOpen]);

  const applyCustomer = (c) => {
    onChange?.({
      customerId: c.id || '',
      customerName: c.name || '',
      customerPhone: c.phone || '',
      customerEmail: c.email || '',
      customerAddress: c.address || '',
    });
    setQuery('');
    setListOpen(false);
  };

  const clearCustomer = () => {
    if (locked) return;
    onChange?.({
      customerId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      customerAddress: '',
    });
    setQuery('');
    setListOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const openAdd = () => {
    setDraft({
      name: query.trim() && !/^\d+$/.test(query.trim()) ? query.trim() : (customerName || ''),
      phone: /^\d/.test(query.trim()) ? query.trim() : (customerPhone || ''),
      email: customerEmail || '',
      address: customerAddress || '',
    });
    setListOpen(false);
    setOpen(true);
  };

  const handleCreate = async () => {
    if (!draft.name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    if (!draft.phone.trim()) {
      toast.error('Customer phone is required');
      return;
    }
    setSaving(true);
    try {
      const res = await customersAPI.create({
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        email: draft.email.trim(),
        address: draft.address.trim(),
      });
      const c = res.data || {};
      onCustomersChange?.(c);
      applyCustomer(c);
      setOpen(false);
      setDraft({ name: '', phone: '', email: '', address: '' });
      toast.success('Customer added');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to add customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3" data-testid="customer-picker" ref={wrapRef}>
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Customer *
        </Label>

        {customerId && !listOpen ? (
          <div
            className="mt-1 rounded-xl border border-orange-100 bg-[#FFF9F5] px-3 py-2.5 flex items-start gap-2"
            data-testid={testId}
          >
            <User className="h-4 w-4 mt-0.5 shrink-0" style={{ color: accent }} />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold text-gray-900 truncate">{customerName}</p>
              <p className="text-gray-600 text-xs truncate">
                {[customerPhone, customerEmail].filter(Boolean).join(' · ') || 'No contact details'}
              </p>
              {customerAddress ? (
                <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{customerAddress}</p>
              ) : null}
            </div>
            {!locked && (
              <div className="flex gap-1 shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    setQuery('');
                    setListOpen(true);
                    setTimeout(() => inputRef.current?.focus(), 0);
                  }}
                >
                  Change
                </Button>
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={clearCustomer} title="Clear">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              ref={inputRef}
              className="h-11 pl-9 pr-9 bg-white border-orange-100 focus-visible:ring-orange-200"
              placeholder="Search name or phone…"
              value={query}
              disabled={locked}
              data-testid={testId}
              onFocus={() => setListOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setListOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setListOpen(false);
                if (e.key === 'Enter' && filtered.length === 1) {
                  e.preventDefault();
                  applyCustomer(filtered[0]);
                }
              }}
              autoComplete="off"
            />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />

            {listOpen && !locked && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-64 overflow-y-auto">
                <button
                  type="button"
                  className="w-full text-left px-3 py-2.5 text-sm font-semibold border-b hover:bg-orange-50 flex items-center gap-2"
                  style={{ color: accent }}
                  onClick={openAdd}
                >
                  <UserPlus className="h-4 w-4" />
                  Add new customer{query.trim() ? ` “${query.trim()}”` : ''}
                </button>
                {filtered.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-gray-500">
                    No match for “{query.trim()}”. Add new customer above.
                  </p>
                ) : (
                  filtered.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 border-b last:border-0"
                      onClick={() => applyCustomer(c)}
                    >
                      <span className="font-medium text-gray-900">{c.name}</span>
                      {c.phone ? <span className="text-gray-500"> — {c.phone}</span> : null}
                      {c.city ? <span className="block text-[11px] text-gray-400">{c.city}</span> : null}
                    </button>
                  ))
                )}
                {options.length > 80 && !query.trim() && (
                  <p className="px-3 py-1.5 text-[11px] text-gray-400 bg-gray-50">
                    Showing first 80 — type to search all {options.length}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {!customerId && (
          <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1">
            Search or add a customer — required before save.
            {options.length === 0 ? ' No customers yet — use “Add new customer”.' : ''}
          </p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" data-testid="new-customer-dialog">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Saved to Customers — then used on this form.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label>Name *</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                data-testid="new-cust-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone *</Label>
                <Input
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  placeholder="03XXXXXXXXX"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Textarea
                rows={2}
                value={draft.address}
                onChange={(e) => setDraft({ ...draft, address: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-3">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              className="text-white"
              style={{ backgroundColor: accent }}
              disabled={saving}
              onClick={handleCreate}
              data-testid="save-new-customer"
            >
              {saving ? 'Saving…' : 'Save Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function requireCustomer(form) {
  if (!form?.customerId) {
    toast.error('Please select or add a customer first');
    return false;
  }
  if (!String(form.customerName || '').trim() || !String(form.customerPhone || '').trim()) {
    toast.error('Selected customer needs name and phone');
    return false;
  }
  return true;
}
