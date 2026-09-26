import { marqueeItems } from '../../data/content';

export default function Marquee() {
  const items = [...marqueeItems, ...marqueeItems];

  return (
    <div className="relative py-6 border-y border-white/10 overflow-hidden bg-canvas-elevated">
      <div className="flex animate-marquee whitespace-nowrap">
        {items.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex items-center mx-8 font-display text-2xl md:text-3xl font-semibold text-ink/20"
          >
            {item}
            <span className="ml-8 text-accent">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
