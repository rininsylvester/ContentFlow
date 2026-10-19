/** Google Fonts family names are letters, digits and spaces. Anything else is rejected. */
const FONT_NAME = /^[A-Za-z0-9][A-Za-z0-9 ]{0,59}$/;

export function safeFontFamily(name: string): string | null {
  const trimmed = name.trim().replace(/\s+/g, " ");
  return FONT_NAME.test(trimmed) ? trimmed : null;
}

/** Stylesheet URL for one family. One link per family so a bad name can't break the others. */
export function googleFontHref(family: string): string | null {
  const safe = safeFontFamily(family);
  if (!safe) return null;
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(safe).replace(/%20/g, "+")}&display=swap`;
}

/** CSS font-family value with a fallback stack. */
export function fontStack(family: string, fallback: "serif" | "sans-serif" = "sans-serif"): string {
  const safe = safeFontFamily(family);
  return safe ? `"${safe}", ${fallback}` : fallback;
}
