/**
 * Per-module color identity — gives each learning path its own accent
 * (like Microsoft Learn's colored tracks). Values are HSL triplets used
 * via the CSS custom property --ah, so a lesson/section can theme itself
 * with `style={{ ['--ah']: moduleAccent(slug) }}`.
 */

/**
 * The design system uses a single calm blue accent (Swiss minimalism), so
 * every module shares the theme's --ah value. These helpers are kept so
 * callers don't need to change; accentStyle intentionally returns no
 * override, letting components inherit the light/dark-aware accent.
 */
export function moduleAccent(_slug: string): string {
  return "221 83% 53%";
}

/** No per-module override — inherit the theme's accent (adapts to dark mode). */
export function accentStyle(_slug: string): React.CSSProperties {
  return {};
}
