import type { db } from "../db";
import { whiteboard } from "../schema/whiteboard";
import { eq, desc, and, count } from "drizzle-orm";

export function getAllWhiteboards(db: typeof db, userId: string) {
  return db
    .select()
    .from(whiteboard)
    .where(eq(whiteboard.userId, userId))
    .orderBy(desc(whiteboard.updatedAt));
}

export function getAllWhiteboardsPaginated(
  db: typeof db,
  userId: string,
  page: number = 1,
  pageSize: number = 12
) {
  const offset = (page - 1) * pageSize;
  return db
    .select()
    .from(whiteboard)
    .where(eq(whiteboard.userId, userId))
    .orderBy(desc(whiteboard.updatedAt))
    .limit(pageSize)
    .offset(offset);
}

export function getWhiteboardCount(db: typeof db, userId: string) {
  return db
    .select({ count: count() })
    .from(whiteboard)
    .where(eq(whiteboard.userId, userId));
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
    metadata?: any;
    backgroundColor?: string;
    viewState?: any;
  }
) {
  return db.insert(whiteboard).values({
    id: data.id,
    userId: data.userId,
    title: data.title,
    elements: data.elements || [],
    metadata: data.metadata,
    backgroundColor: data.backgroundColor,
    viewState: data.viewState,
  });
}

export function updateWhiteboard(
  db: typeof db,
  id: string,
  userId: string,
  data: {
    title?: string;
    elements?: any[];
    metadata?: any;
    backgroundColor?: string;
    viewState?: any;
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

