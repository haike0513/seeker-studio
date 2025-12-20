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
  elements: any[] = [],
): Promise<Whiteboard> {
  const id = nanoid();
  
  const [newWhiteboard] = await db
    .insert(whiteboard)
    .values({
      id,
      userId,
      title,
      elements: elements || [],
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
    elements?: any[];
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

