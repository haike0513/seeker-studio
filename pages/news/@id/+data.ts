// https://vike.dev/data

import type { PageContextServer } from "vike/types";
import * as drizzleQueries from "../../../database/drizzle/queries/news";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  const newsId = parseInt(pageContext.routeParams.id, 10);

  if (isNaN(newsId)) {
    throw new Error("无效的新闻 ID");
  }

  const newsResult = await drizzleQueries.getNewsById(pageContext.db, newsId);

  if (newsResult.length === 0) {
    throw new Error("新闻不存在");
  }

  const news = newsResult[0];

  return { news };
}

