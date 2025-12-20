// https://vike.dev/data

import * as drizzleQueries from "../../database/drizzle/queries/whiteboard";
import type { PageContextServer } from "vike/types";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  try {
    const userId = pageContext.user?.user?.id;
    if (!userId) {
      return { whiteboards: [] };
    }
    const whiteboards = await drizzleQueries.getAllWhiteboards(
      pageContext.db,
      userId
    );
    // 确保返回的是数组
    return { whiteboards: Array.isArray(whiteboards) ? whiteboards : [] };
  } catch (error) {
    console.error("Failed to fetch whiteboards:", error);
    return { whiteboards: [] };
  }
}

