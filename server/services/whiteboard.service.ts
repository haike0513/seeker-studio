/**
 * 画板服务
 */

import { db } from "@/database/drizzle/db";
import { whiteboard } from "@/database/drizzle/schema/whiteboard";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Whiteboard } from "@/database/drizzle/schema/whiteboard";
import {
  getAllWhiteboardsPaginated,
  getWhiteboardCount,
} from "@/database/drizzle/queries/whiteboard";

/**
 * 获取用户的所有画板
 */
export async function getUserWhiteboards(userId: string): Promise<Whiteboard[]> {
  const whiteboards = await db
    .select()
    .from(whiteboard)
    .where(eq(whiteboard.userId, userId))
    .orderBy(desc(whiteboard.updatedAt));

  return whiteboards;
}

/**
 * 获取用户画板（分页）
 */
export async function getUserWhiteboardsPaginated(
  userId: string,
  page: number = 1,
  pageSize: number = 12,
): Promise<{ items: Whiteboard[]; total: number; page: number; pageSize: number; hasMore: boolean }> {
  const [whiteboards, countResult] = await Promise.all([
    getAllWhiteboardsPaginated(db, userId, page, pageSize),
    getWhiteboardCount(db, userId),
  ]);

  const total = countResult[0]?.count ?? 0;
  const hasMore = page * pageSize < total;

  return {
    items: whiteboards,
    total,
    page,
    pageSize,
    hasMore,
  };
}

/**
 * 根据 ID 获取画板
 */
export async function getWhiteboardById(
  id: string,
  userId: string,
): Promise<Whiteboard | null> {
  const results = await db
    .select()
    .from(whiteboard)
    .where(and(eq(whiteboard.id, id), eq(whiteboard.userId, userId)))
    .limit(1);

  return results[0] || null;
}

/**
 * 创建画板
 */
export async function createWhiteboard(
  userId: string,
  title: string,
  elements: unknown[] = [],
  options?: {
    metadata?: unknown;
    backgroundColor?: string;
    viewState?: unknown;
  },
): Promise<Whiteboard> {
  const id = nanoid();
  
  const [newWhiteboard] = await db
    .insert(whiteboard)
    .values({
      id,
      userId,
      title,
      elements: elements || [],
      ...(options?.metadata !== undefined && { metadata: options.metadata }),
      ...(options?.backgroundColor !== undefined && { backgroundColor: options.backgroundColor }),
      ...(options?.viewState !== undefined && { viewState: options.viewState }),
    })
    .returning();

  return newWhiteboard;
}

/**
 * 更新画板
 */
export async function updateWhiteboard(
  id: string,
  userId: string,
  data: {
    title?: string;
    elements?: unknown[];
    metadata?: unknown;
    backgroundColor?: string;
    viewState?: unknown;
  },
): Promise<Whiteboard | null> {
  const [updated] = await db
    .update(whiteboard)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(whiteboard.id, id), eq(whiteboard.userId, userId)))
    .returning();

  return updated || null;
}

/**
 * 通过分享token获取画板（公开访问）
 */
export async function getWhiteboardByShareToken(
  shareToken: string,
): Promise<Whiteboard | null> {
  const results = await db
    .select()
    .from(whiteboard)
    .where(and(
      eq(whiteboard.shareToken, shareToken),
      eq(whiteboard.isPublic, true),
    ))
    .limit(1);

  return results[0] || null;
}

/**
 * 生成分享token并设置为公开
 */
export async function enableWhiteboardSharing(
  id: string,
  userId: string,
): Promise<{ shareToken: string; shareUrl: string } | null> {
  const shareToken = nanoid(32); // 生成32字符的分享token
  
  const [updated] = await db
    .update(whiteboard)
    .set({
      shareToken,
      isPublic: true,
      updatedAt: new Date(),
    })
    .where(and(eq(whiteboard.id, id), eq(whiteboard.userId, userId)))
    .returning();

  if (!updated) {
    return null;
  }

  // 生成分享URL（实际部署时需要替换为实际域名）
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";
  const shareUrl = `${baseUrl}/whiteboard/shared/${shareToken}`;

  return { shareToken, shareUrl };
}

/**
 * 禁用分享
 */
export async function disableWhiteboardSharing(
  id: string,
  userId: string,
): Promise<boolean> {
  const [updated] = await db
    .update(whiteboard)
    .set({
      shareToken: null,
      isPublic: false,
      updatedAt: new Date(),
    })
    .where(and(eq(whiteboard.id, id), eq(whiteboard.userId, userId)))
    .returning();

  return updated !== null;
}

/**
 * 删除画板
 */
export async function deleteWhiteboard(
  id: string,
  userId: string,
): Promise<void> {
  await db
    .delete(whiteboard)
    .where(and(eq(whiteboard.id, id), eq(whiteboard.userId, userId)));
}

/**
 * 验证画板所有权
 */
export async function verifyWhiteboardOwnership(
  id: string,
  userId: string,
): Promise<boolean> {
  const results = await db
    .select()
    .from(whiteboard)
    .where(and(eq(whiteboard.id, id), eq(whiteboard.userId, userId)))
    .limit(1);

  return results.length > 0;
}

