import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import themes from "../themes.json";

export type Theme = keyof typeof themes.themes;

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  availableThemes: typeof themes.themes;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** Convert a 6-digit hex colour to "H S% L%" for CSS custom properties. */
function hexToHSL(hex: string): string {
  hex = hex.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Darken a hex colour by `amount` (0–1). */
function darken(hex: string, amount: number): string {
  hex = hex.replace("#", "");
  let r = parseInt(hex.slice(0, 2), 16);
  let g = parseInt(hex.slice(2, 4), 16);
  let b = parseInt(hex.slice(4, 6), 16);
  r = Math.max(0, Math.round(r * (1 - amount)));
  g = Math.max(0, Math.round(g * (1 - amount)));
  b = Math.max(0, Math.round(b * (1 - amount)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function applyTheme(themeName: Theme) {
  const root = document.documentElement;
  const t = themes.themes[themeName];
  if (!t) return;

  const p = t.colors.primary;          // e.g. "#0ea5e9"
  const pHSL = hexToHSL(p);            // e.g. "199 89% 48%"
  const pDark = darken(p, 0.35);       // darker shade for gradients
  const pDarkHSL = hexToHSL(pDark);

  // ── Tailwind / shadcn tokens ──────────────────────────────────────────────
  root.style.setProperty("--primary",  pHSL);
  root.style.setProperty("--accent",   pHSL);
  root.style.setProperty("--ring",     pHSL);
  root.style.setProperty("--sidebar-primary", pHSL);
  root.style.setProperty("--sidebar-ring",    pHSL);

  // primary-glow (lighter) and primary-deep (darker) derived from primary
  const parts = pHSL.split(" "); // ["199", "89%", "48%"]
  const hPart = parts[0];
  const sPart = parts[1];
  const lNum  = parseInt(parts[2], 10);
  root.style.setProperty("--primary-glow", `${hPart} ${sPart} ${Math.min(95, lNum + 12)}%`);
  root.style.setProperty("--primary-deep", `${hPart} ${sPart} ${Math.max(5,  lNum - 15)}%`);

  // ── Legacy --color-* tokens ───────────────────────────────────────────────
  Object.entries(t.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value as string);
  });

  // ── Gradients ─────────────────────────────────────────────────────────────
  root.style.setProperty(
    "--gradient-hero",
    `radial-gradient(ellipse at top, hsl(${pHSL} / 0.25), transparent 60%), ` +
    `linear-gradient(180deg, hsl(240 14% 5%) 0%, hsl(240 12% 3%) 100%)`
  );
  root.style.setProperty(
    "--gradient-crimson",   // kept as "crimson" name for backward compat
    `linear-gradient(135deg, hsl(${pHSL}) 0%, hsl(${pDarkHSL}) 100%)`
  );
  root.style.setProperty(
    "--gradient-blood",
    `linear-gradient(135deg, hsl(${pHSL}), hsl(${pDarkHSL}))`
  );

  // ── Shadows / glows ───────────────────────────────────────────────────────
  root.style.setProperty("--shadow-crimson",        `0 0 40px hsl(${pHSL} / 0.4)`);
  root.style.setProperty("--shadow-crimson-strong", `0 0 60px hsl(${pHSL} / 0.6)`);
  root.style.setProperty("--color-glow",            `hsl(${pHSL} / 0.5)`);

  // ── Glass hover border ────────────────────────────────────────────────────
  // Injected as a CSS variable so .glass-hover:hover can use it
  root.style.setProperty("--glass-hover-border", `hsl(${pHSL} / 0.45)`);
  root.style.setProperty("--glass-hover-glow",   `hsl(${pHSL} / 0.25)`);

  // ── Body background radial gradients ─────────────────────────────────────
  // We encode the HSL string so the CSS body rule can use it
  root.style.setProperty("--bg-radial-primary", pHSL);

  // ── data-theme attribute for CSS selectors ────────────────────────────────
  root.setAttribute("data-theme", themeName);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try { return (localStorage.getItem("theme") as Theme) || "crimson"; }
    catch { return "crimson"; }
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, availableThemes: themes.themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
