"use client";

import { useEffect, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";

    const stored = window.localStorage.getItem("theme") as Theme | null;
    if (stored === "light" || stored === "dark") return stored;

    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    return systemPrefersDark ? "dark" : "light";
  });

  // Sync <html> + localStorage whenever theme changes
  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      window.localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      window.localStorage.setItem("theme", "light");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="text-slate-800"
    >
      {theme === "light" ? (
        <FiMoon className="h-5 w-5 text-slate-700" />
      ) : (
        <FiSun className="h-5 w-5 text-yellow-400" />
      )}
    </button>
  );
}
