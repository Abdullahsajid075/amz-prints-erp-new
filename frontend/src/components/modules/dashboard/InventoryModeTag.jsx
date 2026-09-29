import React from 'react';
import { Link } from 'react-router-dom';
import useInventoryMode from '@/hooks/useInventoryMode';
import { inventoryModeCountdownParts } from '@/utils/inventoryMode';

const InventoryModeTag = () => {
  const { mode, active, now } = useInventoryMode();
  if (!active) return null;
  const parts = inventoryModeCountdownParts(mode, now);

  return (
    <aside
      className="fixed top-[4.6rem] right-2 sm:right-5 z-40"
      data-testid="inventory-mode-tag"
    >
      <Link
        to="/warehouse/inventory/settings"
        className="block w-[168px] rounded-xl shadow-lg overflow-hidden border border-orange-300/80"
        style={{
          background: 'linear-gradient(180deg, #ff8a1a 0%, #ff6d00 55%, #e85d00 100%)',
        }}
        title="Inventory Mode is on — correct stock until this countdown ends"
      >
        <div className="px-3 pt-2.5 pb-2 text-white">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] leading-tight">
            Inventory Mode
          </p>
          <div className="mt-2 grid grid-cols-4 gap-1 text-center">
            {parts.map((part) => (
              <div key={part.key} className="rounded-md bg-black/25 py-1 px-0.5">
                <div className="font-display text-sm font-bold tabular-nums leading-none">{part.value}</div>
                <div className="mt-0.5 text-[7px] uppercase tracking-wide text-white/80">{part.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Link>
    </aside>
  );
};

export default InventoryModeTag;
