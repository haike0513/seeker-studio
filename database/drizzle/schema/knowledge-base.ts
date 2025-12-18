/**
 * 知识库 Schema
 * 定义知识库、文档、分段、元数据的数据库结构
 */

import { pgTable, text, jsonb, timestamp, boolean, integer, vector } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

/**
 * 知识库表
 */
export const knowledgeBase = pgTable("knowledge_base", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  // 嵌入模型配置
  embeddingModel: text("embedding_model").default("text-embedding-3-small"),
  // 索引方法：vector, keyword, hybrid
  indexingMethod: text("indexing_method").default("vector"),
  // 检索策略配置
  retrievalConfig: jsonb("retrieval_config").$type<{
    topK?: number;
    scoreThreshold?: number;
    rerank?: boolean;
  }>(),
  // 是否启用
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * 文档表
 */
export const document = pgTable("document", {
  id: text("id").primaryKey(),
  knowledgeBaseId: text("knowledge_base_id")
    .notNull()
    .references(() => knowledgeBase.id, { onDelete: "cascade" }),
  // 文档名称
  name: text("name").notNull(),
  // 文档类型：file, text, url
  type: text("type").notNull(),
  // 文件 URL（如果是文件类型）
  fileUrl: text("file_url"),
  // 原始内容（如果是文本类型）
  content: text("content"),
  // 文档元数据
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  // 文档大小（字节）
  size: integer("size"),
  // 文档状态：processing, completed, failed
  status: text("status").default("processing"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * 文档分段表
 */
export const documentSegment = pgTable("document_segment", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => document.id, { onDelete: "cascade" }),
  // 分段内容
  content: text("content").notNull(),
  // 分段在文档中的位置（字符偏移）
  position: integer("position"),
  // 分段长度
  length: integer("length"),
  // 向量嵌入（如果使用向量索引）
  // 注意：需要安装 pgvector 扩展
  embedding: vector("embedding", { dimensions: 1536 }), // OpenAI text-embedding-3-small 的维度
  // 分段元数据
  metadata: jsonb("metadata").$type<{
    pageNumber?: number;
    sectionTitle?: string;
    keywords?: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 关系定义
export const knowledgeBaseRelations = relations(knowledgeBase, ({ one, many }) => ({
  user: one(user, {
    fields: [knowledgeBase.userId],
    references: [user.id],
  }),
  documents: many(document),
}));

export const documentRelations = relations(document, ({ one, many }) => ({
  knowledgeBase: one(knowledgeBase, {
    fields: [document.knowledgeBaseId],
    references: [knowledgeBase.id],
  }),
  segments: many(documentSegment),
}));

export const documentSegmentRelations = relations(documentSegment, ({ one }) => ({
  document: one(document, {
    fields: [documentSegment.documentId],
    references: [document.id],
  }),
}));
