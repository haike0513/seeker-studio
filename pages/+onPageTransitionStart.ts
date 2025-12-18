// https://vike.dev/onPageTransitionStart

import type { PageContextClient } from "vike/types";

export async function onPageTransitionStart(pageContext: Partial<PageContextClient>) {
  console.log("Page transition start", pageContext.user);
  console.log("pageContext.isBackwardNavigation", pageContext.isBackwardNavigation);
  // 添加页面过渡类名，用于 CSS 过渡或其他逻辑
  document.body.classList.add("page-transition");
  // 注意：实际的动画由 Layout 中的 Motion 组件处理
}
