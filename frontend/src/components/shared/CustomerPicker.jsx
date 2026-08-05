import React, { useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { customersAPI } from '@/services/api';
import { UserPlus, User } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Required customer select + add-new dialog.
 * Blocks quote/order/invoice until a real customer is chosen or created.
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
  accent = '#F26522',
  testId = 'customer-select',
  locked = false,
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ name: '', phone: '', email: '', address: '' });

  const options = useMemo(() => {
    const list = Array.isArray(customers) ? [...customers] : [];
    if (customerId && !list.some((c) => String(c.id) === String(customerId))) {
      list.unshift({
        id: customerId,
        name: customerName || 'Selected customer',
        phone: customerPhone,
      });
    }
    return list;
  }, [customers, customerId, customerName, customerPhone]);

  const selectId = customerId ? String(customerId) : undefined;

  const applyCustomer = (c) => {
    onChange?.({
      customerId: c.id || '',
      customerName: c.name || '',
      customerPhone: c.phone || '',
      customerEmail: c.email || '',
      customerAddress: c.address || '',
    });
  };

  const handleSelect = (id) => {
    if (locked) return;
    if (id === '__new__') {
      setDraft({
        name: customerName || '',
        phone: customerPhone || '',
        email: customerEmail || '',
        address: customerAddress || '',
      });
      setOpen(true);
      return;
    }
    const c = options.find((x) => String(x.id) === String(id));
    if (c) applyCustomer(c);
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
    <div className="space-y-3" data-testid="customer-picker">
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Customer *
        </Label>
        <Select value={selectId} onValueChange={handleSelect} disabled={locked}>
          <SelectTrigger
            className="mt-1 h-11 bg-white border-orange-100 focus:ring-orange-200"
            data-testid={testId}
          >
            <SelectValue placeholder="Select customer or add new" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__new__" className="font-semibold" style={{ color: accent }}>
              <span className="inline-flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add new customer
              </span>
            </SelectItem>
            {options.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}{c.phone ? ` — ${c.phone}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!customerId && (
          <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1">
            Customer select / add required — quotation, order & invoice cannot save without it.
          </p>
        )}
      </div>

      {customerId && (
        <div className="rounded-xl border border-orange-100 bg-[#FFF9F5] px-3 py-2.5 flex items-start gap-2">
          <User className="h-4 w-4 mt-0.5 shrink-0" style={{ color: accent }} />
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-gray-900 truncate">{customerName}</p>
            <p className="text-gray-600 text-xs truncate">
              {[customerPhone, customerEmail].filter(Boolean).join(' · ') || 'No contact details'}
            </p>
            {customerAddress ? (
              <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{customerAddress}</p>
            ) : null}
          </div>
        </div>
      )}

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
