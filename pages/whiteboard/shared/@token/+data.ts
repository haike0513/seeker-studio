// https://vike.dev/data

import type { PageContextServer } from "vike/types";
import { db } from "@/database/drizzle/db";
import { whiteboard } from "@/database/drizzle/schema/whiteboard";
import { and, eq } from "drizzle-orm";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  const token = pageContext.routeParams?.token;
  
  if (!token) {
    return { whiteboard: null, error: "缺少分享token" };
  }

  try {
    // 通过分享token获取公开的画板
    const results = await db
      .select()
      .from(whiteboard)
      .where(and(
        eq(whiteboard.shareToken, token),
        eq(whiteboard.isPublic, true),
      ))
      .limit(1);

    if (results.length === 0) {
      return { whiteboard: null, error: "画板不存在或未开启分享" };
    }

    return { whiteboard: results[0], error: null };
  } catch (error) {
    console.error("获取分享画板失败:", error);
    return { whiteboard: null, error: "获取画板失败" };
  }
}

