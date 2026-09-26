import { motion } from 'framer-motion';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import Button from '../ui/Button';
import Container from '../ui/Container';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet/20 rounded-full blur-[120px] animate-pulse-glow" />

      <Container className="relative z-10 pt-32 pb-20">
        <div className="max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-3 mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-lime" />
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-ink-muted">
              Available for projects
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-bold text-display-xl text-ink mb-8"
          >
            Designing
            <br />
            <span className="text-gradient">experiences</span>
            <br />
            that inspire
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-xl text-ink-muted max-w-xl leading-relaxed mb-12"
          >
            I'm a multidisciplinary designer crafting bold brand identities,
            intuitive interfaces, and visual systems that leave lasting impressions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap items-center gap-4"
          >
            <Button href="#work" size="lg">
              View My Work
              <ArrowUpRight size={18} />
            </Button>
            <Button href="#contact" variant="outline" size="lg">
              Get in Touch
            </Button>
          </motion.div>
        </div>

        {/* Floating card */}
        <motion.div
          initial={{ opacity: 0, x: 40, rotate: 3 }}
          animate={{ opacity: 1, x: 0, rotate: 3 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 w-72 glass rounded-2xl p-6 animate-float"
        >
          <div className="aspect-square rounded-xl bg-gradient-to-br from-accent/30 to-violet/30 mb-4 flex items-center justify-center">
            <span className="font-display text-6xl font-bold text-white/20">Aa</span>
          </div>
          <p className="font-mono text-xs text-ink-subtle uppercase tracking-wider mb-1">
            Latest Project
          </p>
          <p className="font-display font-semibold text-lg">Nova Brand Identity</p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="font-mono text-xs text-ink-subtle uppercase tracking-wider">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowDown size={20} className="text-ink-muted" />
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
