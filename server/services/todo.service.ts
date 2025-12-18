/**
 * Todo 服务
 */

import type { db } from "@/database/drizzle/db";
import { todoTable } from "@/database/drizzle/schema/todos";
import type { TodoItem } from "@/types/todo";

/**
 * 创建 Todo
 */
export async function createTodo(
  database: typeof db,
  text: string,
): Promise<void> {
  await database.insert(todoTable).values({ text });
}

/**
 * 获取所有 Todo
 */
export async function getAllTodos(database: typeof db): Promise<TodoItem[]> {
  const todos = await database.select().from(todoTable);
  
  return todos.map((todo) => ({
    id: todo.id,
    text: todo.text,
    completed: todo.completed,
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt,
  }));
}
