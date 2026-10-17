import { cn } from '../../lib/utils';

export default function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-white/10 text-ink-muted',
    accent: 'bg-accent/15 text-accent border border-accent/30',
    violet: 'bg-violet/15 text-violet-glow border border-violet/30',
    lime: 'bg-lime/15 text-lime border border-lime/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
