import React from 'react';
import { ERP_LEGAL_NAME } from '@/utils/erpApps';

/** Logo on a white plate plus company text — stays visible on orange or white. */
const BrandLockup = ({
  company,
  accent = '#ff6d00',
  invert = false,
  compact = false,
}) => {
  const name = company?.name || 'AMZ Prints';
  const legal = ERP_LEGAL_NAME;
  const logo = company?.logo;

  return (
    <div className="flex items-center gap-2.5 min-w-0" data-testid="brand-lockup">
      <div
        className={`shrink-0 rounded-xl bg-white flex items-center justify-center shadow-md ring-2 ${compact ? 'h-9 w-9 p-1' : 'h-11 w-11 p-1.5'} ${invert ? 'ring-white/90' : 'ring-slate-200'}`}
      >
        {logo ? (
          <img src={logo} alt={name} className="h-full w-full object-contain" />
        ) : (
          <div
            className="w-full h-full rounded-lg flex items-center justify-center"
            style={{ backgroundColor: accent }}
          >
            <span className={`text-white font-display font-bold ${compact ? 'text-sm' : 'text-lg'}`}>
              {name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div className="min-w-0 leading-tight">
        <p className={`font-display font-bold truncate ${compact ? 'text-sm' : 'text-base'} ${invert ? 'text-white' : 'text-ink'}`}>
          {name}
        </p>
        <p className={`font-semibold leading-snug ${compact ? 'text-[10px]' : 'text-[11px]'} ${invert ? 'text-white/90' : 'text-slate-600'}`}>
          {legal}
        </p>
      </div>
    </div>
  );
};

export default BrandLockup;
