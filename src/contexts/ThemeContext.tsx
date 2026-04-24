import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import themes from "../themes.json";

export type Theme = keyof typeof themes.themes;

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  availableThemes: typeof themes.themes;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Helper function to convert hex to HSL
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return `${h} ${s}% ${l}%`;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem("theme");
      return (saved as Theme) || "crimson";
    } catch {
      return "crimson";
    }
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      const selectedTheme = themes.themes[theme];

      if (selectedTheme) {
        // Convert primary color to HSL for Tailwind
        const primaryHSL = hexToHSL(selectedTheme.colors.primary);
        const accentHSL = hexToHSL(selectedTheme.colors.accent);

        // Apply Tailwind CSS variables
        root.style.setProperty('--primary', primaryHSL);
        root.style.setProperty('--accent', accentHSL);
        root.style.setProperty('--ring', primaryHSL);

        // Apply custom color variables for direct use
        Object.entries(selectedTheme.colors).forEach(([key, value]) => {
          root.style.setProperty(`--color-${key}`, value);
        });
      }

      localStorage.setItem("theme", theme);
    } catch (error) {
      console.error("Error applying theme:", error);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes: themes.themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
