// https://vike.dev/data

import * as drizzleQueries from "../../database/drizzle/queries/todos";
import type { PageContextServer } from "vike/types";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(_pageContext: PageContextServer) {
  try {
    const todoItemsInitial = await drizzleQueries.getAllTodos(_pageContext.db);
    // 确保返回的是数组
    return { todoItemsInitial: Array.isArray(todoItemsInitial) ? todoItemsInitial : [] };
  } catch (error) {
    console.error("Failed to fetch todos:", error);
    return { todoItemsInitial: [] };
  }
}
