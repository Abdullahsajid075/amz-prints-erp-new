import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SORT_DIR_OPTIONS } from '@/utils/sortBy';

/**
 * Compact Sort by + direction controls for list toolbars.
 * @param {{ field: string, dir: 'asc'|'desc' }} value
 * @param {(next: { field: string, dir: 'asc'|'desc' }) => void} onChange
 * @param {{ value: string, label: string }[]} options
 */
export default function SortBar({ value, onChange, options = [], className = '' }) {
  const field = value?.field || options[0]?.value || '';
  const dir = value?.dir === 'asc' ? 'asc' : 'desc';

  return (
    <div className={`flex flex-wrap items-end gap-2 ${className}`}>
      <div className="min-w-[140px] flex-1">
        <label className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold px-0.5">Sort by</label>
        <Select
          value={field}
          onValueChange={(f) => onChange?.({ field: f, dir })}
        >
          <SelectTrigger className="h-9 text-sm" data-testid="sort-by-select">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-[110px]">
        <label className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold px-0.5">Order</label>
        <Select
          value={dir}
          onValueChange={(d) => onChange?.({ field, dir: d })}
        >
          <SelectTrigger className="h-9 text-sm" data-testid="sort-dir-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_DIR_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
