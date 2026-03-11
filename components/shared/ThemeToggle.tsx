"use client";

import { useEffect, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  // Start with a default theme to prevent hydration mismatch
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Initialize theme after component mounts (client-side only)
  useEffect(() => {
    setMounted(true);
    
    // Get theme from localStorage or system preference
    const stored = window.localStorage.getItem("theme") as Theme | null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      const root = document.documentElement;
      if (stored === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    } else {
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      const initialTheme = systemPrefersDark ? "dark" : "light";
      setTheme(initialTheme);
      const root = document.documentElement;
      if (initialTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, []);

  // Sync <html> + localStorage whenever theme changes
  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;

    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      window.localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      window.localStorage.setItem("theme", "light");
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Prevent hydration mismatch by rendering consistent content until mounted
  if (!mounted) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="text-slate-800"
      >
        <FiMoon className="h-5 w-5 text-slate-700" />
      </button>
    );
  }

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
