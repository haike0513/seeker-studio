import { createSignal, createEffect, onMount } from "solid-js";

export type Theme =
  | "minimalism"
  | "bento-grid"
  | "glassmorphism"
  | "claymorphism"
  | "aurora-dark";

const THEME_STORAGE_KEY = "app-theme";
const DEFAULT_THEME: Theme = "minimalism";

export function useTheme() {
  const [theme, setTheme] = createSignal<Theme>(DEFAULT_THEME);
  const [mounted, setMounted] = createSignal(false);

  onMount(() => {
    // 从 localStorage 读取保存的主题
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (savedTheme && isValidTheme(savedTheme)) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      applyTheme(DEFAULT_THEME);
    }
    setMounted(true);
  });

  createEffect(() => {
    if (mounted()) {
      const currentTheme = theme();
      applyTheme(currentTheme);
      localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    }
  });

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return {
    theme,
    changeTheme,
    mounted,
  };
}

function isValidTheme(theme: string): theme is Theme {
  return [
    "minimalism",
    "bento-grid",
    "glassmorphism",
    "claymorphism",
    "aurora-dark",
  ].includes(theme);
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
}

