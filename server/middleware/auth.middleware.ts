/**
 * 认证中间件
 */

import type { Context } from "hono";
import { getUser } from "../utils/auth";
import { unauthorizedResponse } from "../utils/response";
import type { AuthContext } from "@/types/auth";

/**
 * 认证中间件：验证用户身份
 * 如果用户未登录，返回 401
 */
export async function requireAuth(c: Context): Promise<AuthContext | Response> {
  const authContext = await getUser(c);
  
  if (!authContext) {
    return unauthorizedResponse(c, "Authentication required");
  }
  
  return authContext;
}

/**
 * 可选认证中间件：尝试获取用户信息，但不强制要求
 * 如果用户未登录，返回 null
 */
export async function optionalAuth(c: Context): Promise<AuthContext | null> {
  return await getUser(c);
}
