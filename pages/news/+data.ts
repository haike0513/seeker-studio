// https://vike.dev/data

import * as drizzleQueries from "../../database/drizzle/queries/news";
import type { PageContextServer } from "vike/types";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(_pageContext: PageContextServer) {
  try {
    const newsItems = await drizzleQueries.getAllNews(_pageContext.db);
    // 确保返回的是数组
    return { newsItems: Array.isArray(newsItems) ? newsItems : [] };
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return { newsItems: [] };
  }
}

