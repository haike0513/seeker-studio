// https://vike.dev/auth
// 这个 guard() hook 应用于所有页面（文件位于 /pages/+guard.ts）
// 
// 注意：这个文件会保护所有页面，如果需要只保护特定页面，
// 可以将此文件移动到特定页面目录下，例如 /pages/admin/+guard.ts
// 或者删除此文件，在需要保护的页面目录下创建 +guard.ts
//
// 如果不需要全局保护，可以删除或注释掉此文件

import type { PageContextServer } from "vike/types";
import { render, redirect } from "vike/abort";

export const guard = (pageContext: PageContextServer) => {
  // 允许访问登录和注册页面
  if (
    pageContext.urlPathname.startsWith("/auth/login") ||
    pageContext.urlPathname.startsWith("/auth/register")
  ) {
    return;
  }

  // 允许访问公开的分享页面（无需登录）
  if (pageContext.urlPathname.startsWith("/whiteboard/shared/")) {
    return;
  }

  // 如果用户未登录，渲染登录页面
  // 使用 render() 而不是 redirect() 可以保持 URL 不变
  // 这样在登录流程中 URL 会保持为原始路径
  if (!pageContext.user) {
    // 保存原始 URL 以便登录后重定向回来
    const returnTo = pageContext.urlOriginal;
    throw render(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
    /* 更传统的方式，重定向用户：
    throw redirect('/auth/login')
    */
  }
};

