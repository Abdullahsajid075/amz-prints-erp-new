import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { projects } from '../../data/content';
import Badge from '../ui/Badge';
import Container, { Section, SectionHeader } from '../ui/Container';

export default function Work() {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <Section id="work">
      <Container>
        <SectionHeader
          label="Selected Work"
          title="Projects that speak louder than words"
          description="A curated collection of brand identities, digital products, and creative campaigns."
        />

        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((project, index) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onMouseEnter={() => setHoveredId(project.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="group relative glass rounded-3xl overflow-hidden cursor-pointer"
            >
              {/* Project visual */}
              <div
                className={`relative aspect-[4/3] bg-gradient-to-br ${project.color} overflow-hidden`}
              >
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="font-display text-[8rem] md:text-[10rem] font-bold text-white/10 group-hover:text-white/20 transition-colors duration-500 group-hover:scale-110 transform"
                    style={{ transition: 'transform 0.5s ease' }}
                  >
                    {project.id}
                  </span>
                </div>

                {/* Hover overlay */}
                <motion.div
                  initial={false}
                  animate={{ opacity: hoveredId === project.id ? 1 : 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                >
                  <span className="flex items-center gap-2 font-medium text-white">
                    View Project <ArrowUpRight size={18} />
                  </span>
                </motion.div>
              </div>

              {/* Project info */}
              <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-mono text-xs text-ink-subtle uppercase tracking-wider mb-1">
                      {project.category} · {project.year}
                    </p>
                    <h3 className="font-display font-semibold text-xl md:text-2xl text-ink group-hover:text-accent transition-colors">
                      {project.title}
                    </h3>
                  </div>
                  <span
                    className="hidden sm:flex w-10 h-10 rounded-full border border-white/20 items-center justify-center group-hover:bg-accent group-hover:border-accent transition-all"
                  >
                    <ArrowUpRight size={16} className="group-hover:rotate-45 transition-transform" />
                  </span>
                </div>
                <p className="text-ink-muted text-sm leading-relaxed mb-4">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </Container>
    </Section>
  );
}
