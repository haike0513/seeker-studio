import { createMemo } from "solid-js";

// 简单的 i18n 实现
const translations: Record<string, Record<string, string>> = {
  zh: {
    "app.title": "Seeker Studio",
    "app.sidebar.inference": "推理",
    "app.sidebar.workflow": "工作流",
    "app.sidebar.models": "模型",
    "app.sidebar.history": "历史",
    "app.sidebar.settings": "设置",
    "app.sidebar.collapse": "收起",
  },
  en: {
    "app.title": "Seeker Studio",
    "app.sidebar.inference": "Inference",
    "app.sidebar.workflow": "Workflow",
    "app.sidebar.models": "Models",
    "app.sidebar.history": "History",
    "app.sidebar.settings": "Settings",
    "app.sidebar.collapse": "Collapse",
  },
};

const DEFAULT_LOCALE = "zh";

export function useI18n() {
  const locale = createMemo(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("app-locale");
      if (saved && translations[saved]) {
        return saved;
      }
    }
    return DEFAULT_LOCALE;
  });

  const t = (key: string): string => {
    const currentLocale = locale();
    return translations[currentLocale]?.[key] || translations[DEFAULT_LOCALE]?.[key] || key;
  };

  return { t, locale };
}

