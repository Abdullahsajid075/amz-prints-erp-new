import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, MapPin, ArrowUpRight } from 'lucide-react';
import Button from '../ui/Button';
import Container, { Section, SectionHeader } from '../ui/Container';

export default function Contact() {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setFormState({ name: '', email: '', message: '' });
  };

  return (
    <Section id="contact" className="relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/10 rounded-full blur-[150px]" />

      <Container className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Left — CTA */}
          <div>
            <SectionHeader
              label="Get in Touch"
              title="Let's create something amazing together"
              description="Have a project in mind? I'd love to hear about it. Drop me a message and let's start a conversation."
            />

            <div className="space-y-6">
              <a
                href="mailto:hello@studio.design"
                className="flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl glass flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                  <Mail size={20} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm text-ink-subtle">Email</p>
                  <p className="text-ink group-hover:text-accent transition-colors">
                    hello@studio.design
                  </p>
                </div>
              </a>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl glass flex items-center justify-center">
                  <MapPin size={20} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm text-ink-subtle">Location</p>
                  <p className="text-ink">Available Worldwide · Remote</p>
                </div>
              </div>
            </div>

            {/* Social links */}
            <div className="flex gap-4 mt-10">
              {['Dribbble', 'Behance', 'LinkedIn'].map((platform) => (
                <a
                  key={platform}
                  href="#"
                  className="group flex items-center gap-1 text-sm text-ink-muted hover:text-accent transition-colors"
                >
                  {platform}
                  <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>

          {/* Right — Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            className="glass rounded-3xl p-8 md:p-10"
          >
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block font-mono text-xs uppercase tracking-wider text-ink-subtle mb-2">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block font-mono text-xs uppercase tracking-wider text-ink-subtle mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formState.email}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
                  placeholder="you@email.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block font-mono text-xs uppercase tracking-wider text-ink-subtle mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-ink placeholder:text-ink-subtle focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors resize-none"
                  placeholder="Tell me about your project..."
                />
              </div>

              <Button type="submit" size="lg" className="w-full">
                {submitted ? 'Message Sent!' : 'Send Message'}
                <Send size={18} />
              </Button>
            </div>
          </motion.form>
        </div>
      </Container>
    </Section>
  );
}
