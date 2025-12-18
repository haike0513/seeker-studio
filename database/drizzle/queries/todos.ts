import type { db } from "../db";
import { todoTable } from "../schema/todos";

export function insertTodo(db: typeof db, text: string) {
  return db.insert(todoTable).values({ text });
}

export function getAllTodos(db: typeof db) {
  return db.select().from(todoTable);
}
