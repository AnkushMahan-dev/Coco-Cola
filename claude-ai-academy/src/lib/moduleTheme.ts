/**
 * Per-module color identity — gives each learning path its own accent
 * (like Microsoft Learn's colored tracks). Values are HSL triplets used
 * via the CSS custom property --ah, so a lesson/section can theme itself
 * with `style={{ ['--ah']: moduleAccent(slug) }}`.
 */

const accents: Record<string, string> = {
  "getting-started": "262 83% 58%", // violet
  "prompt-engineering": "217 91% 56%", // blue
  "advanced-capabilities": "291 70% 55%", // fuchsia
  integrations: "189 94% 40%", // cyan
  "sap-toolchain": "158 72% 38%", // emerald
  "best-practices": "34 95% 48%", // amber
  "real-sap-projects": "346 84% 57%", // rose
  "quality-productivity": "173 80% 38%", // teal
};

const DEFAULT = "262 83% 58%";

export function moduleAccent(slug: string): string {
  return accents[slug] ?? DEFAULT;
}

/** Convenience style object to drop the accent onto any container. */
export function accentStyle(slug: string): React.CSSProperties {
  return { ["--ah" as string]: moduleAccent(slug) } as React.CSSProperties;
}
