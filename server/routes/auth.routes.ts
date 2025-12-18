/**
 * 认证路由
 */

import { Hono } from "hono";
import { getCookie, deleteCookie } from "hono/cookie";
import { db } from "@/database/drizzle/db";
import { eq } from "drizzle-orm";
import * as schema from "@/database/drizzle/schema/auth";
import { getUser } from "../utils/auth";
import { successResponse, errorResponse } from "../utils/response";
import { authHandler } from "../auth";
import type { AuthResponse, UserInfo, SessionInfo } from "@/types/auth";

const app = new Hono();

/**
 * 获取当前会话
 */
app.all("/api/auth/session", async (c) => {
  const authContext = await getUser(c);

  if (!authContext) {
    return successResponse(c, { session: null, user: null });
  }

  const response: AuthResponse = {
    session: {
      id: authContext.session.id,
      expiresAt: authContext.session.expiresAt,
      userId: authContext.session.userId,
    },
    user: {
      id: authContext.user.id,
      name: authContext.user.name,
      email: authContext.user.email,
      image: authContext.user.image,
      emailVerified: authContext.user.emailVerified,
    },
  };

  return successResponse(c, response);
});

/**
 * 登出
 */
app.post("/api/auth/sign-out", async (c) => {
  const cookieToken = getCookie(c, "better-auth.session_token") ||
    getCookie(c, "session_token");

  if (cookieToken) {
    const sessionToken = cookieToken.split(".")[0];
    await db.delete(schema.session).where(
      eq(schema.session.token, sessionToken),
    );
  }

  deleteCookie(c, "better-auth.session_token");
  deleteCookie(c, "session_token");

  return successResponse(c, { success: true });
});

/**
 * Better Auth 路由处理（必须放在最后，作为通配符路由）
 */
app.all("/api/auth/*", async (c) => {
  const response = await authHandler(c.req.raw);
  return response;
});

export default app;
