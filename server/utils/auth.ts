/**
 * 认证工具函数
 */

import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { db } from "@/database/drizzle/db";
import { and, eq, sql } from "drizzle-orm";
import * as schema from "@/database/drizzle/schema/auth";
import type { AuthContext } from "@/types/auth";

/**
 * 从请求中获取用户信息
 */
export async function getUser(c: Context): Promise<AuthContext | null> {
  const cookieToken = getCookie(c, "better-auth.session_token") ||
    getCookie(c, "session_token");

  if (!cookieToken) return null;

  const sessionToken = cookieToken.split(".")[0];

  const sessionResult = await db
    .select({
      session: schema.session,
      user: schema.user,
    })
    .from(schema.session)
    .leftJoin(schema.user, eq(schema.session.userId, schema.user.id))
    .where(
      and(
        eq(schema.session.token, sessionToken),
        sql`${schema.session.expiresAt} >= NOW()`,
      ),
    )
    .limit(1);

  if (sessionResult.length === 0) return null;

  const result = sessionResult[0];
  if (!result.user) return null;

  return {
    user: result.user,
    session: result.session,
  };
}
