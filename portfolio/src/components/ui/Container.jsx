import { cn } from '../../lib/utils';

export default function Container({ children, className, as: Tag = 'div' }) {
  return (
    <Tag className={cn('mx-auto w-full max-w-7xl px-6 lg:px-8', className)}>
      {children}
    </Tag>
  );
}

export function Section({ children, id, className }) {
  return (
    <section id={id} className={cn('relative py-24 lg:py-32', className)}>
      {children}
    </section>
  );
}

export function SectionHeader({ label, title, description, align = 'left' }) {
  return (
    <div
      className={cn(
        'mb-16 max-w-2xl',
        align === 'center' && 'mx-auto text-center'
      )}
    >
      {label && (
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-4">
          {label}
        </p>
      )}
      <h2 className="font-display font-bold text-display-md text-ink mb-4">
        {title}
      </h2>
      {description && (
        <p className="text-lg text-ink-muted leading-relaxed">{description}</p>
      )}
    </div>
  );
}
