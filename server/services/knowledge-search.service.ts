/**
 * 知识库检索服务
 * 基于向量相似度进行语义检索
 */

import { db } from "@/database/drizzle/db";
import {
  documentSegment,
  document,
  knowledgeBase,
} from "@/database/drizzle/schema/knowledge-base";
import { and, eq, sql } from "drizzle-orm";
import { generateEmbedding } from "./embedding.service";
import type { SearchRequest, SearchResult } from "@/types/knowledge-base";

/**
 * 语义检索
 */
export async function searchKnowledgeBase(
  knowledgeBaseId: string,
  request: SearchRequest,
): Promise<SearchResult[]> {
  const { query, topK = 5, scoreThreshold = 0.7, filters } = request;

  // 生成查询向量
  const queryEmbedding = await generateEmbedding(query);

  // 构建 SQL 查询（使用 pgvector 的余弦相似度）
  // 注意：需要确保 pgvector 扩展已安装
  // 如果 pgvector 不可用，回退到关键词检索
  let results;
  try {
    results = await db
      .select({
        segment: documentSegment,
        document: document,
        score: sql<number>`1 - (${sql.raw(`'[${queryEmbedding.join(",")}]'`)}::vector <=> ${documentSegment.embedding})`,
      })
      .from(documentSegment)
      .innerJoin(document, eq(documentSegment.documentId, document.id))
      .innerJoin(knowledgeBase, eq(document.knowledgeBaseId, knowledgeBase.id))
      .where(
        and(
          eq(knowledgeBase.id, knowledgeBaseId),
          eq(knowledgeBase.enabled, true),
          sql`${documentSegment.embedding} IS NOT NULL`,
        ),
      )
      .orderBy(sql`${documentSegment.embedding} <=> ${sql.raw(`'[${queryEmbedding.join(",")}]'`)}::vector`)
      .limit(topK);
  } catch (error) {
    // 如果向量检索失败（可能是 pgvector 未安装），回退到关键词检索
    console.warn("Vector search failed, falling back to keyword search:", error);
    return keywordSearch(knowledgeBaseId, request);
  }

  // 过滤结果
  return results
    .filter((r) => r.score >= scoreThreshold)
    .map((r) => ({
      segment: {
        id: r.segment.id,
        documentId: r.segment.documentId,
        content: r.segment.content,
        position: r.segment.position || undefined,
        length: r.segment.length || undefined,
        embedding: r.segment.embedding ? Array.from(r.segment.embedding as any) : undefined,
        metadata: (r.segment.metadata as any) || undefined,
        createdAt: r.segment.createdAt,
      },
      document: {
        id: r.document.id,
        knowledgeBaseId: r.document.knowledgeBaseId,
        name: r.document.name,
        type: r.document.type as any,
        fileUrl: r.document.fileUrl || undefined,
        content: r.document.content || undefined,
        metadata: (r.document.metadata as any) || undefined,
        size: r.document.size || undefined,
        status: r.document.status as any,
        createdAt: r.document.createdAt,
        updatedAt: r.document.updatedAt,
      },
      score: Number(r.score),
      metadata: (r.segment.metadata as any) || undefined,
    }));
}

/**
 * 关键词检索（备用方案，当向量检索不可用时）
 */
export async function keywordSearch(
  knowledgeBaseId: string,
  request: SearchRequest,
): Promise<SearchResult[]> {
  const { query, topK = 5 } = request;

  // 简单的关键词匹配
  const results = await db
    .select({
      segment: documentSegment,
      document: document,
    })
    .from(documentSegment)
    .innerJoin(document, eq(documentSegment.documentId, document.id))
    .innerJoin(knowledgeBase, eq(document.knowledgeBaseId, knowledgeBase.id))
    .where(
      and(
        eq(knowledgeBase.id, knowledgeBaseId),
        eq(knowledgeBase.enabled, true),
        sql`${documentSegment.content} ILIKE ${`%${query}%`}`,
      ),
    )
    .limit(topK);

  return results.map((r) => ({
    segment: {
      id: r.segment.id,
      documentId: r.segment.documentId,
      content: r.segment.content,
      position: r.segment.position || undefined,
      length: r.segment.length || undefined,
      embedding: r.segment.embedding ? Array.from(r.segment.embedding as any) : undefined,
      metadata: (r.segment.metadata as any) || undefined,
      createdAt: r.segment.createdAt,
    },
    document: {
      id: r.document.id,
      knowledgeBaseId: r.document.knowledgeBaseId,
      name: r.document.name,
      type: r.document.type as any,
      fileUrl: r.document.fileUrl || undefined,
      content: r.document.content || undefined,
      metadata: (r.document.metadata as any) || undefined,
      size: r.document.size || undefined,
      status: r.document.status as any,
      createdAt: r.document.createdAt,
      updatedAt: r.document.updatedAt,
    },
    score: 1.0, // 关键词匹配的分数
    metadata: (r.segment.metadata as any) || undefined,
  }));
}
