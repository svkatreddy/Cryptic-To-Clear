"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { getStoredTheme, applyTheme, Theme } from "@/lib/theme";

export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // One-time hydration from localStorage, which only exists client-side.
    setTheme(getStoredTheme());

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: Theme }>;
      if (customEvent.detail?.theme) {
        setTheme(customEvent.detail.theme);
      } else {
        setTheme(getStoredTheme());
      }
    };
    window.addEventListener("themechange", handleThemeChange);
    return () => window.removeEventListener("themechange", handleThemeChange);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title="Toggle dark / light mode"
      className={
        className ??
        "h-9 w-9 flex items-center justify-center rounded-lg glass hover:border-[var(--border-strong)] transition-colors text-[var(--ink-dim)]"
      }
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
