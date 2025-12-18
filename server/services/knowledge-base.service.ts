/**
 * 知识库服务
 */

import { db } from "@/database/drizzle/db";
import {
  knowledgeBase,
  document,
  documentSegment,
} from "@/database/drizzle/schema/knowledge-base";
import { and, eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import type {
  KnowledgeBase,
  Document,
  DocumentSegment,
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
  CreateDocumentRequest,
} from "@/types/knowledge-base";

/**
 * 获取用户的所有知识库
 */
export async function getUserKnowledgeBases(userId: string): Promise<KnowledgeBase[]> {
  const bases = await db
    .select()
    .from(knowledgeBase)
    .where(eq(knowledgeBase.userId, userId))
    .orderBy(desc(knowledgeBase.updatedAt));

  return bases.map((kb) => ({
    id: kb.id,
    userId: kb.userId,
    name: kb.name,
    description: kb.description || undefined,
    embeddingModel: kb.embeddingModel || "text-embedding-3-small",
    indexingMethod: (kb.indexingMethod as KnowledgeBase["indexingMethod"]) || "vector",
    retrievalConfig: (kb.retrievalConfig as KnowledgeBase["retrievalConfig"]) || undefined,
    enabled: kb.enabled || false,
    createdAt: kb.createdAt,
    updatedAt: kb.updatedAt,
  }));
}

/**
 * 获取知识库详情
 */
export async function getKnowledgeBase(
  knowledgeBaseId: string,
  userId: string,
): Promise<(KnowledgeBase & { documents: Document[] }) | null> {
  const kbData = await db
    .select()
    .from(knowledgeBase)
    .where(and(eq(knowledgeBase.id, knowledgeBaseId), eq(knowledgeBase.userId, userId)))
    .limit(1);

  if (kbData.length === 0) return null;

  const kb = kbData[0];

  // 获取文档
  const docs = await db
    .select()
    .from(document)
    .where(eq(document.knowledgeBaseId, knowledgeBaseId))
    .orderBy(desc(document.updatedAt));

  return {
    id: kb.id,
    userId: kb.userId,
    name: kb.name,
    description: kb.description || undefined,
    embeddingModel: kb.embeddingModel || "text-embedding-3-small",
    indexingMethod: (kb.indexingMethod as KnowledgeBase["indexingMethod"]) || "vector",
    retrievalConfig: (kb.retrievalConfig as KnowledgeBase["retrievalConfig"]) || undefined,
    enabled: kb.enabled || false,
    createdAt: kb.createdAt,
    updatedAt: kb.updatedAt,
    documents: docs.map((d) => ({
      id: d.id,
      knowledgeBaseId: d.knowledgeBaseId,
      name: d.name,
      type: d.type as Document["type"],
      fileUrl: d.fileUrl || undefined,
      content: d.content || undefined,
      metadata: (d.metadata as Document["metadata"]) || undefined,
      size: d.size || undefined,
      status: (d.status as Document["status"]) || "processing",
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    })),
  };
}

/**
 * 创建知识库
 */
export async function createKnowledgeBase(
  userId: string,
  data: CreateKnowledgeBaseRequest,
): Promise<string> {
  const kbId = nanoid();

  await db.insert(knowledgeBase).values({
    id: kbId,
    userId,
    name: data.name,
    description: data.description || null,
    embeddingModel: data.embeddingModel || "text-embedding-3-small",
    indexingMethod: data.indexingMethod || "vector",
    retrievalConfig: data.retrievalConfig || null,
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return kbId;
}

/**
 * 更新知识库
 */
export async function updateKnowledgeBase(
  knowledgeBaseId: string,
  userId: string,
  data: UpdateKnowledgeBaseRequest,
): Promise<boolean> {
  const kbData = await db
    .select()
    .from(knowledgeBase)
    .where(and(eq(knowledgeBase.id, knowledgeBaseId), eq(knowledgeBase.userId, userId)))
    .limit(1);

  if (kbData.length === 0) return false;

  const updateData: {
    name?: string;
    description?: string | null;
    embeddingModel?: string;
    indexingMethod?: string;
    retrievalConfig?: unknown;
    enabled?: boolean;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.embeddingModel !== undefined) updateData.embeddingModel = data.embeddingModel;
  if (data.indexingMethod !== undefined) updateData.indexingMethod = data.indexingMethod;
  if (data.retrievalConfig !== undefined) updateData.retrievalConfig = data.retrievalConfig || null;
  if (data.enabled !== undefined) updateData.enabled = data.enabled;

  await db
    .update(knowledgeBase)
    .set(updateData)
    .where(eq(knowledgeBase.id, knowledgeBaseId));

  return true;
}

/**
 * 删除知识库
 */
export async function deleteKnowledgeBase(
  knowledgeBaseId: string,
  userId: string,
): Promise<boolean> {
  const kbData = await db
    .select()
    .from(knowledgeBase)
    .where(and(eq(knowledgeBase.id, knowledgeBaseId), eq(knowledgeBase.userId, userId)))
    .limit(1);

  if (kbData.length === 0) return false;

  await db.delete(knowledgeBase).where(eq(knowledgeBase.id, knowledgeBaseId));

  return true;
}

/**
 * 创建文档
 */
export async function createDocument(
  knowledgeBaseId: string,
  data: CreateDocumentRequest,
  userId: string,
): Promise<Document & { segments: DocumentSegment[] }> {
  const docId = nanoid();

  await db.insert(document).values({
    id: docId,
    knowledgeBaseId,
    name: data.name,
    type: data.type,
    fileUrl: data.fileUrl || null,
    content: data.content || null,
    metadata: data.metadata || null,
    size: data.content ? data.content.length : null,
    status: "processing",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 如果是文本类型，自动分段
  if (data.type === "text" && data.content) {
    const { segmentDocument } = await import("./document-segmentation.service");
    await segmentDocument(docId, data.content);
    
    // 更新文档状态为已完成
    await db
      .update(document)
      .set({ status: "completed" })
      .where(eq(document.id, docId));
  }

  const doc = await getDocument(docId, userId);
  if (!doc) {
    throw new Error("Failed to create document");
  }
  return doc;
}

/**
 * 获取文档详情（包括分段）
 */
export async function getDocument(
  documentId: string,
  userId: string,
): Promise<(Document & { segments: DocumentSegment[] }) | null> {
  // 验证文档所有权（通过知识库）
  const docData = await db
    .select({
      document: document,
      knowledgeBase: knowledgeBase,
    })
    .from(document)
    .innerJoin(knowledgeBase, eq(document.knowledgeBaseId, knowledgeBase.id))
    .where(and(eq(document.id, documentId), eq(knowledgeBase.userId, userId)))
    .limit(1);

  if (docData.length === 0) return null;

  const d = docData[0].document;

  // 获取分段
  const segments = await db
    .select()
    .from(documentSegment)
    .where(eq(documentSegment.documentId, documentId))
    .orderBy(documentSegment.position);

  return {
    id: d.id,
    knowledgeBaseId: d.knowledgeBaseId,
    name: d.name,
    type: d.type as Document["type"],
    fileUrl: d.fileUrl || undefined,
    content: d.content || undefined,
    metadata: (d.metadata as Document["metadata"]) || undefined,
    size: d.size || undefined,
    status: (d.status as Document["status"]) || "processing",
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    segments: segments.map((s) => ({
      id: s.id,
      documentId: s.documentId,
      content: s.content,
      position: s.position || undefined,
      length: s.length || undefined,
      embedding: s.embedding ? Array.from(s.embedding) : undefined,
      metadata: (s.metadata as DocumentSegment["metadata"]) || undefined,
      createdAt: s.createdAt,
    })),
  };
}

/**
 * 删除文档
 */
export async function deleteDocument(documentId: string, userId: string): Promise<boolean> {
  // 验证文档所有权
  const docData = await db
    .select({
      document: document,
      knowledgeBase: knowledgeBase,
    })
    .from(document)
    .innerJoin(knowledgeBase, eq(document.knowledgeBaseId, knowledgeBase.id))
    .where(and(eq(document.id, documentId), eq(knowledgeBase.userId, userId)))
    .limit(1);

  if (docData.length === 0) return false;

  await db.delete(document).where(eq(document.id, documentId));

  return true;
}

/**
 * 验证知识库所有权
 */
export async function verifyKnowledgeBaseOwnership(
  knowledgeBaseId: string,
  userId: string,
): Promise<boolean> {
  const kbData = await db
    .select()
    .from(knowledgeBase)
    .where(and(eq(knowledgeBase.id, knowledgeBaseId), eq(knowledgeBase.userId, userId)))
    .limit(1);

  return kbData.length > 0;
}
