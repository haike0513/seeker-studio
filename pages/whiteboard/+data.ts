// https://vike.dev/data

import * as drizzleQueries from "../../database/drizzle/queries/whiteboard";
import type { PageContextServer } from "vike/types";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  try {
    const userId = pageContext.user?.user?.id;
    if (!userId) {
      return { items: [], total: 0, page: 1, pageSize: 12, hasMore: false };
    }
    
    // 解析分页参数
    const url = new URL(pageContext.urlOriginal, "http://localhost");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "12", 10);
    
    const [whiteboards, countResult] = await Promise.all([
      drizzleQueries.getAllWhiteboardsPaginated(
        pageContext.db,
        userId,
        Math.max(1, page),
        Math.max(1, Math.min(100, pageSize))
      ),
      drizzleQueries.getWhiteboardCount(pageContext.db, userId),
    ]);
    
    const total = countResult[0]?.count ?? 0;
    
    const pageNum = Math.max(1, page);
    const pageSizeNum = Math.max(1, Math.min(100, pageSize));
    const items = Array.isArray(whiteboards) ? whiteboards : [];
    const hasMore = pageNum * pageSizeNum < total;
    
    return {
      items,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      hasMore,
    };
  } catch (error) {
    console.error("Failed to fetch whiteboards:", error);
    return { items: [], total: 0, page: 1, pageSize: 12, hasMore: false };
  }
}

