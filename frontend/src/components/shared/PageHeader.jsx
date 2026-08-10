import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared page chrome — title row + optional actions.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
  eyebrow,
  testId,
}) {
  return (
    <header
      className={cn(
        'flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-1',
        className
      )}
      data-testid={testId}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-slate-400 mb-1">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-2xl font-bold text-ink tracking-tight truncate">
          {title}
        </h2>
        {subtitle ? (
          <p className="text-sm text-slate-500 mt-0.5 max-w-2xl">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
      ) : null}
    </header>
  );
}

export function PagePanel({ title, subtitle, action, children, className, testId }) {
  return (
    <section className={cn('erp-panel', className)} data-testid={testId}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-black/[0.05]">
          <div className="min-w-0">
            {title ? (
              <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
            ) : null}
            {subtitle ? (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export default PageHeader;
