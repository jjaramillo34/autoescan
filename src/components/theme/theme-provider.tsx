"use client";

import * as React from "react";
import { useServerInsertedHTML } from "next/navigation";

type Theme = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark" | undefined;
  themes: Theme[];
  systemTheme: "light" | "dark" | undefined;
};

const STORAGE_KEY = "theme";
const MEDIA = "(prefers-color-scheme: dark)";

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined,
);

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia(MEDIA).matches ? "dark" : "light";
}

/** Inline script injected outside the React tree (no React 19 warning). */
const THEME_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(STORAGE_KEY)};var d=document.documentElement;var t=localStorage.getItem(k)||"system";var r=t==="system"?(window.matchMedia(${JSON.stringify(MEDIA)}).matches?"dark":"light"):t;d.classList.remove("light","dark");d.classList.add(r);d.style.colorScheme=r;}catch(e){}})();`;

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "system" as Theme,
      setTheme: () => {},
      resolvedTheme: undefined as "light" | "dark" | undefined,
      themes: ["light", "dark", "system"] as Theme[],
      systemTheme: undefined as "light" | "dark" | undefined,
    };
  }
  return ctx;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: "class";
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  useServerInsertedHTML(() => (
    <script
      dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
    />
  ));

  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = React.useState<"light" | "dark">("light");
  const [mounted, setMounted] = React.useState(false);

  const resolvedTheme: "light" | "dark" =
    theme === "system" ? systemTheme : theme;

  const applyTheme = React.useCallback(
    (next: "light" | "dark") => {
      const root = document.documentElement;
      let disable: (() => void) | undefined;
      if (disableTransitionOnChange) {
        const style = document.createElement("style");
        style.appendChild(
          document.createTextNode(
            "*,*::before,*::after{-webkit-transition:none!important;transition:none!important}",
          ),
        );
        document.head.appendChild(style);
        disable = () => {
          window.getComputedStyle(document.body);
          setTimeout(() => document.head.removeChild(style), 1);
        };
      }
      root.classList.remove("light", "dark");
      root.classList.add(next);
      root.style.colorScheme = next;
      disable?.();
    },
    [disableTransitionOnChange],
  );

  React.useEffect(() => {
    setMounted(true);
    const stored = (() => {
      try {
        return (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? defaultTheme;
      } catch {
        return defaultTheme;
      }
    })();
    setThemeState(stored);
    setSystemTheme(getSystemTheme());
  }, [defaultTheme]);

  React.useEffect(() => {
    if (!mounted) return;
    applyTheme(resolvedTheme);
  }, [mounted, resolvedTheme, applyTheme]);

  React.useEffect(() => {
    if (!enableSystem) return;
    const media = window.matchMedia(MEDIA);
    const onChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [enableSystem]);

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      resolvedTheme: mounted ? resolvedTheme : undefined,
      themes: enableSystem
        ? ["light", "dark", "system"]
        : ["light", "dark"],
      systemTheme: enableSystem ? systemTheme : undefined,
    }),
    [theme, setTheme, resolvedTheme, mounted, enableSystem, systemTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
