/**
 * 文档分段服务
 * 将文档内容分割成多个段落
 */

import { db } from "@/database/drizzle/db";
import { documentSegment } from "@/database/drizzle/schema/knowledge-base";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { generateEmbeddings } from "./embedding.service";
import type { DocumentSegment } from "@/types/knowledge-base";

export interface SegmentationOptions {
  chunkSize?: number; // 每段的最大字符数
  chunkOverlap?: number; // 段落之间的重叠字符数
  separator?: string; // 分段分隔符
}

/**
 * 自动分段文档
 */
export async function segmentDocument(
  documentId: string,
  content: string,
  options: SegmentationOptions = {},
): Promise<DocumentSegment[]> {
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
    separator = "\n\n",
  } = options;

  // 分段逻辑
  const segments: Array<{ content: string; position: number }> = [];

  // 按分隔符分割
  const parts = content.split(separator);
  let currentChunk = "";
  let position = 0;

  for (const part of parts) {
    // 如果当前块加上新部分超过大小限制
    if (currentChunk.length + part.length > chunkSize && currentChunk.length > 0) {
      // 保存当前块
      segments.push({
        content: currentChunk.trim(),
        position,
      });
      position += currentChunk.length;

      // 开始新块，保留重叠部分
      const overlap = currentChunk.slice(-chunkOverlap);
      currentChunk = overlap + separator + part;
    } else {
      currentChunk += (currentChunk ? separator : "") + part;
    }
  }

  // 添加最后一个块
  if (currentChunk.trim().length > 0) {
    segments.push({
      content: currentChunk.trim(),
      position,
    });
  }

  // 如果分段为空，至少创建一个分段
  if (segments.length === 0) {
    segments.push({
      content: content.trim() || "",
      position: 0,
    });
  }

  // 生成嵌入向量
  const segmentContents = segments.map((s) => s.content);
  const embeddings = await generateEmbeddings(segmentContents);

  // 保存分段到数据库
  const savedSegments: DocumentSegment[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const embedding = embeddings[i];

    const segmentId = nanoid();
    await db.insert(documentSegment).values({
      id: segmentId,
      documentId,
      content: segment.content,
      position: segment.position,
      length: segment.content.length,
      embedding: embedding as any, // pgvector 类型
      createdAt: new Date(),
    });

    savedSegments.push({
      id: segmentId,
      documentId,
      content: segment.content,
      position: segment.position,
      length: segment.content.length,
      embedding,
      createdAt: new Date(),
    });
  }

  return savedSegments;
}

/**
 * 手动创建分段
 */
export async function createSegment(
  documentId: string,
  content: string,
  position?: number,
  metadata?: DocumentSegment["metadata"],
): Promise<DocumentSegment> {
  // 生成嵌入
  const embedding = await generateEmbedding(content);

  const segmentId = nanoid();
  await db.insert(documentSegment).values({
    id: segmentId,
    documentId,
    content,
    position: position || null,
    length: content.length,
    embedding: embedding as any,
    metadata: metadata || null,
    createdAt: new Date(),
  });

  return {
    id: segmentId,
    documentId,
    content,
    position,
    length: content.length,
    embedding,
    metadata,
    createdAt: new Date(),
  };
}

/**
 * 删除文档的所有分段
 */
export async function deleteDocumentSegments(documentId: string): Promise<void> {
  await db.delete(documentSegment).where(eq(documentSegment.documentId, documentId));
}
