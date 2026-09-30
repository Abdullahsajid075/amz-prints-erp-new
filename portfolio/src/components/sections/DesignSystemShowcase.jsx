import { motion } from 'framer-motion';
import { designTokens } from '../../data/content';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Container, { Section, SectionHeader } from '../ui/Container';

function ColorSwatch({ name, value, usage }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="glass rounded-2xl overflow-hidden group"
    >
      <div
        className="aspect-[3/2] relative"
        style={{ backgroundColor: value }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="font-medium text-ink text-sm">{name}</p>
          <code className="font-mono text-xs text-ink-subtle">{value}</code>
        </div>
        <p className="text-xs text-ink-muted">{usage}</p>
      </div>
    </motion.div>
  );
}

function TypeSample({ name, role, weights, sample, className }) {
  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="font-mono text-xs text-accent uppercase tracking-wider mb-1">{role}</p>
          <h4 className="font-display font-semibold text-xl text-ink">{name}</h4>
        </div>
        <Badge variant="accent">{weights}</Badge>
      </div>
      <p className={`text-3xl md:text-4xl text-ink ${className}`}>{sample}</p>
    </div>
  );
}

export default function DesignSystemShowcase() {
  return (
    <Section id="design-system">
      <Container>
        <SectionHeader
          label="Design System"
          title="Built with intention"
          description="A token-based design system ensuring consistency, scalability, and craft across every touchpoint."
          align="center"
        />

        {/* Colors */}
        <div className="mb-20">
          <h3 className="font-display font-semibold text-xl text-ink mb-6 flex items-center gap-3">
            <span className="w-8 h-px bg-accent" />
            Color Palette
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(designTokens.colors).map(([key, token]) => (
              <ColorSwatch key={key} {...token} />
            ))}
          </div>
        </div>

        {/* Typography */}
        <div className="mb-20">
          <h3 className="font-display font-semibold text-xl text-ink mb-6 flex items-center gap-3">
            <span className="w-8 h-px bg-accent" />
            Typography
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <TypeSample
              name="Syne"
              role="Display"
              weights="400–800"
              sample="Design Bold"
              className="font-display font-bold"
            />
            <TypeSample
              name="DM Sans"
              role="Body"
              weights="300–700"
              sample="Clean & readable"
              className="font-body"
            />
            <TypeSample
              name="JetBrains Mono"
              role="Mono"
              weights="400–500"
              sample="LABEL_TEXT"
              className="font-mono text-2xl"
            />
          </div>
        </div>

        {/* Components preview */}
        <div className="mb-20">
          <h3 className="font-display font-semibold text-xl text-ink mb-6 flex items-center gap-3">
            <span className="w-8 h-px bg-accent" />
            Components
          </h3>
          <div className="glass rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Buttons */}
              <div>
                <p className="font-mono text-xs text-ink-subtle uppercase tracking-wider mb-4">Buttons</p>
                <div className="flex flex-wrap gap-3">
                  <Button size="sm">Primary</Button>
                  <Button variant="secondary" size="sm">Secondary</Button>
                  <Button variant="outline" size="sm">Outline</Button>
                  <Button variant="ghost" size="sm">Ghost</Button>
                </div>
              </div>

              {/* Badges */}
              <div>
                <p className="font-mono text-xs text-ink-subtle uppercase tracking-wider mb-4">Badges</p>
                <div className="flex flex-wrap gap-3">
                  <Badge>Default</Badge>
                  <Badge variant="accent">Accent</Badge>
                  <Badge variant="violet">Violet</Badge>
                  <Badge variant="lime">Lime</Badge>
                </div>
              </div>

              {/* Spacing */}
              <div>
                <p className="font-mono text-xs text-ink-subtle uppercase tracking-wider mb-4">Spacing Scale</p>
                <div className="flex items-end gap-2">
                  {designTokens.spacing.map((space) => (
                    <div key={space} className="flex flex-col items-center gap-1">
                      <div
                        className="bg-accent/30 rounded-sm"
                        style={{ width: space, height: space }}
                      />
                      <span className="font-mono text-[10px] text-ink-subtle">{space}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Radius */}
              <div>
                <p className="font-mono text-xs text-ink-subtle uppercase tracking-wider mb-4">Border Radius</p>
                <div className="flex gap-4">
                  {Object.entries(designTokens.radius).map(([key, value]) => (
                    <div key={key} className="flex flex-col items-center gap-2">
                      <div
                        className="w-12 h-12 bg-violet/20 border border-violet/30"
                        style={{ borderRadius: value }}
                      />
                      <span className="font-mono text-[10px] text-ink-subtle">{key}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Motion principles */}
        <div className="text-center">
          <p className="font-mono text-xs text-accent uppercase tracking-[0.2em] mb-4">
            Motion Principles
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {['Purposeful', 'Smooth', 'Delightful'].map((principle, i) => (
              <motion.div
                key={principle}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                  className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-accent/20 to-violet/20 flex items-center justify-center"
                >
                  <span className="font-display font-bold text-2xl text-accent">{i + 1}</span>
                </motion.div>
                <p className="font-display font-semibold text-ink">{principle}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
