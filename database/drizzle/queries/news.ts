import { db } from "../db";
import { newsTable } from "../schema/news";
import { desc, eq } from "drizzle-orm";

type Database = typeof db;

/**
 * 获取所有新闻（按发布时间倒序）
 */
export function getAllNews(database: Database) {
  return database
    .select()
    .from(newsTable)
    .orderBy(desc(newsTable.publishedAt));
}

/**
 * 获取最新新闻（限制数量）
 */
export function getLatestNews(database: Database, limit: number = 10) {
  return database
    .select()
    .from(newsTable)
    .orderBy(desc(newsTable.publishedAt))
    .limit(limit);
}

/**
 * 根据 ID 获取单条新闻
 */
export function getNewsById(database: Database, id: number) {
  return database
    .select()
    .from(newsTable)
    .where(eq(newsTable.id, id))
    .limit(1);
}

