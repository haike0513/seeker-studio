import type { db } from "../db";
import { whiteboard } from "../schema/whiteboard";
import { eq, desc, and } from "drizzle-orm";

export function getAllWhiteboards(db: typeof db, userId: string) {
  return db
    .select()
    .from(whiteboard)
    .where(eq(whiteboard.userId, userId))
    .orderBy(desc(whiteboard.updatedAt));
}

export function getWhiteboardById(db: typeof db, id: string, userId: string) {
  return db
    .select()
    .from(whiteboard)
    .where(and(eq(whiteboard.id, id), eq(whiteboard.userId, userId)))
    .limit(1);
}

export function insertWhiteboard(
  db: typeof db,
  data: {
    id: string;
    userId: string;
    title: string;
    elements?: any[];
  }
) {
  return db.insert(whiteboard).values({
    id: data.id,
    userId: data.userId,
    title: data.title,
    elements: data.elements || [],
  });
}

export function updateWhiteboard(
  db: typeof db,
  id: string,
  userId: string,
  data: {
    title?: string;
    elements?: any[];
  }
) {
  return db
    .update(whiteboard)
    .set(data)
    .where(and(eq(whiteboard.id, id), eq(whiteboard.userId, userId)));
}

export function deleteWhiteboard(db: typeof db, id: string, userId: string) {
  return db
    .delete(whiteboard)
    .where(and(eq(whiteboard.id, id), eq(whiteboard.userId, userId)));
}

