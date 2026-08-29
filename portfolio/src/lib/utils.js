export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function formatYear(year) {
  return String(year);
}
