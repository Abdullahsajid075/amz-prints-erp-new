export const designTokens = {
  colors: {
    canvas: { name: 'Canvas', value: '#0A0A0B', usage: 'Primary background' },
    elevated: { name: 'Elevated', value: '#111113', usage: 'Cards & surfaces' },
    ink: { name: 'Ink', value: '#FAFAFA', usage: 'Primary text' },
    muted: { name: 'Muted', value: '#A1A1AA', usage: 'Secondary text' },
    accent: { name: 'Accent', value: '#FF4D00', usage: 'CTAs & highlights' },
    violet: { name: 'Violet', value: '#8B5CF6', usage: 'Gradients & accents' },
    lime: { name: 'Lime', value: '#BEF264', usage: 'Success & badges' },
  },
  typography: {
    display: { name: 'Syne', role: 'Headlines & hero text', weights: '400–800' },
    body: { name: 'DM Sans', role: 'Body copy & UI', weights: '300–700' },
    mono: { name: 'JetBrains Mono', role: 'Labels & code', weights: '400–500' },
  },
  spacing: [4, 8, 12, 16, 24, 32, 48, 64, 96],
  radius: {
    sm: '6px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },
};

export const projects = [
  {
    id: '01',
    title: 'Nova Brand Identity',
    category: 'Branding',
    year: 2025,
    description: 'Complete visual identity system for a tech startup — logo, color palette, typography, and brand guidelines.',
    tags: ['Logo', 'Guidelines', 'Stationery'],
    color: 'from-orange-500 to-red-600',
    accent: '#FF4D00',
  },
  {
    id: '02',
    title: 'Pulse Mobile App',
    category: 'UI/UX',
    year: 2025,
    description: 'Fitness tracking app with intuitive navigation, dark mode, and micro-interactions that delight users.',
    tags: ['Mobile', 'Prototyping', 'Design System'],
    color: 'from-violet-500 to-purple-700',
    accent: '#8B5CF6',
  },
  {
    id: '03',
    title: 'Artisan Coffee Co.',
    category: 'Packaging',
    year: 2024,
    description: 'Premium coffee packaging line with hand-drawn illustrations and sustainable material choices.',
    tags: ['Print', 'Illustration', 'Packaging'],
    color: 'from-amber-600 to-orange-800',
    accent: '#D97706',
  },
  {
    id: '04',
    title: 'Echo Music Festival',
    category: 'Campaign',
    year: 2024,
    description: 'Bold festival campaign spanning posters, social media, merchandise, and stage visuals.',
    tags: ['Poster', 'Social', 'Merch'],
    color: 'from-pink-500 to-rose-600',
    accent: '#EC4899',
  },
  {
    id: '05',
    title: 'Meridian Dashboard',
    category: 'UI/UX',
    year: 2024,
    description: 'Analytics dashboard redesign focused on clarity, data visualization, and responsive layouts.',
    tags: ['Web App', 'Data Viz', 'Components'],
    color: 'from-cyan-500 to-blue-600',
    accent: '#06B6D4',
  },
  {
    id: '06',
    title: 'Forma Architecture',
    category: 'Branding',
    year: 2023,
    description: 'Minimalist identity for an architecture firm — geometric logo mark and editorial website design.',
    tags: ['Logo', 'Web Design', 'Print'],
    color: 'from-stone-400 to-stone-600',
    accent: '#78716C',
  },
];

export const services = [
  {
    icon: 'Palette',
    title: 'Brand Identity',
    description: 'Logos, visual systems, brand guidelines, and everything that makes your brand unforgettable.',
  },
  {
    icon: 'Layout',
    title: 'UI/UX Design',
    description: 'Intuitive interfaces for web and mobile — wireframes, prototypes, and pixel-perfect designs.',
  },
  {
    icon: 'Layers',
    title: 'Design Systems',
    description: 'Scalable component libraries and token-based systems that keep teams aligned and shipping fast.',
  },
  {
    icon: 'Sparkles',
    title: 'Creative Direction',
    description: 'Campaign concepts, art direction, and visual storytelling that captivates your audience.',
  },
];

export const stats = [
  { value: '50+', label: 'Projects Delivered' },
  { value: '30+', label: 'Happy Clients' },
  { value: '5', label: 'Years Experience' },
  { value: '12', label: 'Awards Won' },
];

export const navLinks = [
  { label: 'Work', href: '#work' },
  { label: 'About', href: '#about' },
  { label: 'System', href: '#design-system' },
  { label: 'Contact', href: '#contact' },
];

export const marqueeItems = [
  'Brand Identity',
  'UI/UX Design',
  'Design Systems',
  'Packaging',
  'Art Direction',
  'Motion Design',
  'Typography',
  'Visual Identity',
];
