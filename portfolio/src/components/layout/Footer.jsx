import Container from '../ui/Container';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-12">
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-display font-bold text-sm">
              S
            </span>
            <span className="font-display font-semibold">Studio</span>
          </div>

          <p className="text-sm text-ink-subtle">
            © {new Date().getFullYear()} Studio. Crafted with passion.
          </p>

          <div className="flex items-center gap-6">
            {['Dribbble', 'Behance', 'Instagram', 'LinkedIn'].map((platform) => (
              <a
                key={platform}
                href="#"
                className="text-sm text-ink-muted hover:text-accent transition-colors"
              >
                {platform}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
