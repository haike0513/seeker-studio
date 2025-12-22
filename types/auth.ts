/**
 * 认证相关类型定义
 */

import type { InferSelectModel } from "drizzle-orm";
import { user, session } from "@/database/drizzle/schema/auth";

export type User = InferSelectModel<typeof user>;
export type Session = InferSelectModel<typeof session>;

/**
 * 用户信息（用于 API 响应）
 */
export interface UserInfo {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  emailVerified: boolean | null;
}

/**
 * 会话信息（用于 API 响应）
 */
export interface SessionInfo {
  id: string;
  expiresAt: Date;
  userId: string;
}

/**
 * 认证上下文（包含用户和会话）
 */
export interface AuthContext {
  user: User;
  session: Session;
}

/**
 * 登录请求
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * 注册请求
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

/**
 * 认证响应
 */
export interface AuthResponse {
  session: SessionInfo;
  user: UserInfo;
}
