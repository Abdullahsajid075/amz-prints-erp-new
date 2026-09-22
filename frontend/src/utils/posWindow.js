export function openPosCounterWindow() {
  if (typeof window === 'undefined') return null;
  const url = `${window.location.origin}/pos/counter`;
  const features = 'popup=yes,noopener,noreferrer,width=1480,height=920,left=40,top=20';
  const w = window.open(url, 'amz-pos-counter', features);
  if (!w) return null;
  try { w.focus(); } catch { /* ignore */ }
  return w;
}
