// https://vike.dev/data

import * as drizzleQueries from "../../../database/drizzle/queries/whiteboard";
import type { PageContextServer } from "vike/types";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  try {
    const id = pageContext.routeParams?.id;
    const userId = pageContext.user?.user?.id;
    if (!id || !userId) {
      return { whiteboard: null };
    }
    const results = await drizzleQueries.getWhiteboardById(
      pageContext.db,
      id,
      userId
    );
    const whiteboard = results[0] || null;
    return { whiteboard };
  } catch (error) {
    console.error("Failed to fetch whiteboard:", error);
    return { whiteboard: null };
  }
}

