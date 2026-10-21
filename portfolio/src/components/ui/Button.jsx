import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const variants = {
  primary: 'bg-accent text-white hover:bg-accent-glow glow-accent',
  secondary: 'glass text-ink hover:bg-white/10',
  ghost: 'text-ink-muted hover:text-ink hover:bg-white/5',
  outline: 'border border-white/20 text-ink hover:border-accent hover:text-accent',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  href,
  ...props
}) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
    variants[variant],
    sizes[size],
    className
  );

  if (href) {
    return (
      <motion.a
        href={href}
        className={classes}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      className={classes}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
