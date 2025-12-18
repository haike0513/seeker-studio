// https://vike.dev/auth
// 在服务器端设置 pageContext.user

import { auth } from "@/server/auth";
import type { PageContextServer } from "vike/types";

// 这个 hook 在每个新的 HTTP 请求时被调用
export async function onCreatePageContext(
  pageContext: PageContextServer,
) {
  // vike-photon 在 pageContext.runtime.req 暴露请求对象
  const req = pageContext.runtime.hono.req.raw;
  // console.log("onCreatePageContext", pageContext.runtime.hono.req.raw);
  if (!req) {
    pageContext.user = null;
    return;
  }

  try {
    const sessionInfo = await auth.api.getSession({
      headers: req.headers,
    });
    if (sessionInfo) {
      // Pass the full session info to the client for hydration
      pageContext.user = {
        session: sessionInfo.session,
        user: sessionInfo.user,
      };
    } else {
      pageContext.user = { session: null, user: null };
    }
  } catch (error) {
    // 如果获取会话时出错，设置为 null
    console.error("Failed to get session:", error);
    pageContext.user = null;
  }
}
