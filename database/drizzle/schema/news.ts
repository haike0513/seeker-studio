import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

// 新闻表结构
export const newsTable = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  url: text("url"),
  source: text("source"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 类型推断
export type NewsItem = typeof newsTable.$inferSelect;
export type NewsInsert = typeof newsTable.$inferInsert;

