import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { productMatchesQuery } from '@/utils/productSearch';
import { Search, ChevronDown, X } from 'lucide-react';

/**
 * Type-to-filter catalog picker — every word in the query must match.
 */
export default function ProductPicker({
  catalog = [],
  value = '',
  selectedName = '',
  onSelect,
  placeholder = 'Type to search product…',
  label = 'Product *',
  testId = 'product-select',
  required = false,
  filterFn,
}) {
  const [query, setQuery] = useState('');
  const [listOpen, setListOpen] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const selected = useMemo(
    () => (catalog || []).find((p) => String(p.id) === String(value)),
    [catalog, value]
  );

  const displayName = selected?.name || selectedName || '';

  const filtered = useMemo(() => {
    let list = Array.isArray(catalog) ? catalog.filter((p) => p && (p.id || p.name)) : [];
    if (typeof filterFn === 'function') list = list.filter(filterFn);
    const q = query.trim();
    if (!q) return list.slice(0, 80);
    return list.filter((p) => productMatchesQuery(p, q)).slice(0, 80);
  }, [catalog, query, filterFn]);

  useEffect(() => {
    if (!listOpen) return undefined;
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setListOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [listOpen]);

  const pick = (p) => {
    onSelect?.(p);
    setQuery('');
    setListOpen(false);
  };

  const clear = () => {
    onSelect?.(null);
    setQuery('');
    setListOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="relative" ref={wrapRef}>
      {label ? <Label className="text-xs">{label}</Label> : null}
      <div className="relative mt-0.5">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          ref={inputRef}
          className="bg-white h-9 pl-8 pr-16"
          data-testid={testId}
          placeholder={displayName || placeholder}
          value={listOpen ? query : (query || displayName)}
          required={required && !value}
          onFocus={() => {
            setListOpen(true);
            if (!query && displayName) setQuery('');
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setListOpen(true);
          }}
        />
        <div className="absolute right-1 top-1 flex items-center gap-0.5">
          {value ? (
            <button type="button" className="p-1.5 rounded hover:bg-gray-100 text-gray-500" onClick={clear} title="Clear">
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
            onClick={() => setListOpen((o) => !o)}
            tabIndex={-1}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {listOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {filtered.map((p) => {
            const isSvc = String(p.productType || '').toLowerCase() === 'service';
            return (
              <button
                key={p.id}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-orange-50 border-b last:border-0 ${
                  String(p.id) === String(value) ? 'bg-orange-50/80' : ''
                }`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(p)}
              >
                <span className="font-medium truncate block">
                  {isSvc ? 'Svc · ' : ''}
                  {p.name}
                </span>
              </button>
            );
          })}
          {!filtered.length && (
            <p className="px-3 py-3 text-xs text-gray-500">No match — try another word</p>
          )}
        </div>
      )}
    </div>
  );
}
