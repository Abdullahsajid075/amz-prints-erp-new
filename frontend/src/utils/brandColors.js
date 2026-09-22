/** AMZ brand palette — orange + blue. */
export const BRAND_ORANGE = '#ff6d00';
export const BRAND_BLUE = '#0747a3';

const OLD_ORANGE = /^#f26522$/i;
const OLD_SECONDARY = /^#2e2e2e$/i;

export function migrateThemeColors(theme) {
  const t = theme && typeof theme === 'object' ? { ...theme } : {};
  if (!t.primary || OLD_ORANGE.test(String(t.primary))) t.primary = BRAND_ORANGE;
  if (!t.secondary || OLD_SECONDARY.test(String(t.secondary))) t.secondary = BRAND_BLUE;
  return t;
}
