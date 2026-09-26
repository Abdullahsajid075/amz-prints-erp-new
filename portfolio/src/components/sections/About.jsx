import { motion } from 'framer-motion';
import { stats, services } from '../../data/content';
import Container, { Section, SectionHeader } from '../ui/Container';
import { Palette, Layout, Layers, Sparkles } from 'lucide-react';

const iconMap = { Palette, Layout, Layers, Sparkles };

export default function About() {
  return (
    <Section id="about" className="bg-canvas-elevated">
      <Container>
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          {/* Left column — About text */}
          <div>
            <SectionHeader
              label="About Me"
              title="Design is my language"
            />
            <div className="space-y-6 text-ink-muted leading-relaxed">
              <p className="text-lg">
                With over 5 years of experience in visual design, I've helped
                startups and established brands create identities that resonate
                and interfaces that convert.
              </p>
              <p>
                My approach blends strategic thinking with bold aesthetics. I believe
                great design isn't just about looking good — it's about solving
                problems, telling stories, and creating emotional connections.
              </p>
              <p>
                When I'm not pushing pixels, you'll find me exploring typography,
                collecting design books, or sketching ideas in my notebook.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 mt-12">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass rounded-2xl p-6"
                >
                  <p className="font-display font-bold text-3xl md:text-4xl text-gradient mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-ink-muted">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right column — Services */}
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-4">
              What I Do
            </p>
            <h3 className="font-display font-bold text-2xl md:text-3xl text-ink mb-8">
              Services tailored to your vision
            </h3>

            <div className="space-y-4">
              {services.map((service, i) => {
                const Icon = iconMap[service.icon];
                return (
                  <motion.div
                    key={service.title}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group glass rounded-2xl p-6 hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                        <Icon size={22} className="text-accent" />
                      </div>
                      <div>
                        <h4 className="font-display font-semibold text-lg text-ink mb-2 group-hover:text-accent transition-colors">
                          {service.title}
                        </h4>
                        <p className="text-sm text-ink-muted leading-relaxed">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
