import { useCallback, useEffect, useRef, useState } from 'react';

const MARGIN = 8;

function readState(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clampPos(pos, el) {
  const w = el?.offsetWidth || 360;
  const h = el?.offsetHeight || 200;
  const maxX = Math.max(MARGIN, window.innerWidth - w - MARGIN);
  const maxY = Math.max(MARGIN, window.innerHeight - Math.min(h, 120) - MARGIN);
  return {
    x: Math.min(Math.max(MARGIN, pos.x), maxX),
    y: Math.min(Math.max(MARGIN, pos.y), maxY),
  };
}

/**
 * Lets a panel switch between docked and floating, where floating panels can
 * be dragged by their handle. Position and mode are remembered per storage key.
 */
export default function useFloatingPanel(storageKey, defaultWidth = 380) {
  const saved = typeof window !== 'undefined' ? readState(storageKey) : null;
  const [floating, setFloating] = useState(!!saved?.floating);
  const [pos, setPos] = useState(() => saved?.pos || {
    x: typeof window !== 'undefined' ? window.innerWidth - defaultWidth - 24 : 24,
    y: 96,
  });
  const panelRef = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ floating, pos }));
    } catch {
      /* storage full or blocked */
    }
  }, [storageKey, floating, pos]);

  useEffect(() => {
    if (!floating) return undefined;
    const onResize = () => setPos((p) => clampPos(p, panelRef.current));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [floating]);

  const onPointerMove = useCallback((e) => {
    if (!drag.current) return;
    setPos(clampPos({ x: e.clientX - drag.current.dx, y: e.clientY - drag.current.dy }, panelRef.current));
  }, []);

  const onPointerUp = useCallback(() => {
    drag.current = null;
    document.body.style.userSelect = '';
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  }, [onPointerMove]);

  useEffect(() => onPointerUp, [onPointerUp]);

  const handleProps = {
    onPointerDown: (e) => {
      if (!floating || e.button > 0 || e.target.closest('button, input, select, textarea, a')) return;
      const rect = panelRef.current?.getBoundingClientRect();
      if (!rect) return;
      drag.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
      document.body.style.userSelect = 'none';
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      e.preventDefault();
    },
    style: floating ? { cursor: 'move', touchAction: 'none' } : undefined,
  };

  const panelStyle = floating
    ? {
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: `min(${defaultWidth}px, calc(100vw - ${MARGIN * 2}px))`,
        maxHeight: `calc(100vh - ${MARGIN * 2}px)`,
        overflowY: 'auto',
        zIndex: 60,
        boxShadow: '0 20px 50px rgba(17, 17, 17, 0.25)',
      }
    : undefined;

  const toggle = useCallback(() => setFloating((f) => !f), []);

  return { floating, toggle, panelRef, panelStyle, handleProps };
}
