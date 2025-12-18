/**
 * 知识库路由
 */

import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.middleware";
import { successResponse, errorResponse, notFoundResponse } from "../utils/response";
import { validateRequestBody } from "../utils/validation";
import {
  getUserKnowledgeBases,
  getKnowledgeBase,
  createKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase,
  createDocument,
  getDocument,
  deleteDocument,
  verifyKnowledgeBaseOwnership,
} from "../services/knowledge-base.service";
import { segmentDocument } from "../services/document-segmentation.service";
import { searchKnowledgeBase, keywordSearch } from "../services/knowledge-search.service";
import type {
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
  CreateDocumentRequest,
  SearchRequest,
} from "@/types/knowledge-base";

const app = new Hono();

/**
 * 获取用户的所有知识库
 */
app.get("/api/knowledge-bases", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const bases = await getUserKnowledgeBases(authResult.user.id);
  return successResponse(c, bases);
});

/**
 * 获取知识库详情
 */
app.get("/api/knowledge-bases/:id", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const knowledgeBaseId = c.req.param("id");
  const kb = await getKnowledgeBase(knowledgeBaseId, authResult.user.id);

  if (!kb) {
    return notFoundResponse(c, "Knowledge base not found");
  }

  return successResponse(c, kb);
});

/**
 * 创建知识库
 */
app.post("/api/knowledge-bases", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const validation = await validateRequestBody(
    c.req.raw,
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      embeddingModel: z.string().optional(),
      indexingMethod: z.enum(["vector", "keyword", "hybrid"]).optional(),
      retrievalConfig: z.any().optional(),
    }),
  );

  if (!validation.success) {
    return errorResponse(c, validation.error, 400);
  }

  const kbId = await createKnowledgeBase(authResult.user.id, validation.data as CreateKnowledgeBaseRequest);
  const kb = await getKnowledgeBase(kbId, authResult.user.id);

  return successResponse(c, kb);
});

/**
 * 更新知识库
 */
app.put("/api/knowledge-bases/:id", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const knowledgeBaseId = c.req.param("id");

  // 验证所有权
  const isOwner = await verifyKnowledgeBaseOwnership(knowledgeBaseId, authResult.user.id);
  if (!isOwner) {
    return notFoundResponse(c, "Knowledge base not found");
  }

  const validation = await validateRequestBody(
    c.req.raw,
    z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      embeddingModel: z.string().optional(),
      indexingMethod: z.enum(["vector", "keyword", "hybrid"]).optional(),
      retrievalConfig: z.any().optional(),
      enabled: z.boolean().optional(),
    }),
  );

  if (!validation.success) {
    return errorResponse(c, validation.error, 400);
  }

  const updated = await updateKnowledgeBase(
    knowledgeBaseId,
    authResult.user.id,
    validation.data as UpdateKnowledgeBaseRequest,
  );

  if (!updated) {
    return errorResponse(c, "Failed to update knowledge base", 500);
  }

  const kb = await getKnowledgeBase(knowledgeBaseId, authResult.user.id);
  return successResponse(c, kb);
});

/**
 * 删除知识库
 */
app.delete("/api/knowledge-bases/:id", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const knowledgeBaseId = c.req.param("id");

  const deleted = await deleteKnowledgeBase(knowledgeBaseId, authResult.user.id);

  if (!deleted) {
    return notFoundResponse(c, "Knowledge base not found");
  }

  return successResponse(c, { success: true });
});

/**
 * 创建文档
 */
app.post("/api/knowledge-bases/:id/documents", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const knowledgeBaseId = c.req.param("id");

  // 验证所有权
  const isOwner = await verifyKnowledgeBaseOwnership(knowledgeBaseId, authResult.user.id);
  if (!isOwner) {
    return notFoundResponse(c, "Knowledge base not found");
  }

  const validation = await validateRequestBody(
    c.req.raw,
    z.object({
      name: z.string().min(1),
      type: z.enum(["file", "text", "url"]),
      fileUrl: z.string().optional(),
      content: z.string().optional(),
      metadata: z.any().optional(),
    }),
  );

  if (!validation.success) {
    return errorResponse(c, validation.error, 400);
  }

  const doc = await createDocument(
    knowledgeBaseId,
    validation.data as CreateDocumentRequest,
    authResult.user.id,
  );

  return successResponse(c, doc);
});

/**
 * 获取文档详情
 */
app.get("/api/documents/:id", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const documentId = c.req.param("id");
  const doc = await getDocument(documentId, authResult.user.id);

  if (!doc) {
    return notFoundResponse(c, "Document not found");
  }

  return successResponse(c, doc);
});

/**
 * 删除文档
 */
app.delete("/api/documents/:id", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const documentId = c.req.param("id");

  const deleted = await deleteDocument(documentId, authResult.user.id);

  if (!deleted) {
    return notFoundResponse(c, "Document not found");
  }

  return successResponse(c, { success: true });
});

/**
 * 分段文档
 */
app.post("/api/documents/:id/segment", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const documentId = c.req.param("id");
  const doc = await getDocument(documentId, authResult.user.id);

  if (!doc) {
    return notFoundResponse(c, "Document not found");
  }

  if (!doc.content) {
    return errorResponse(c, "文档没有内容", 400);
  }

  const validation = await validateRequestBody(
    c.req.raw,
    z.object({
      chunkSize: z.number().optional(),
      chunkOverlap: z.number().optional(),
      separator: z.string().optional(),
    }),
  );

  if (!validation.success) {
    return errorResponse(c, validation.error, 400);
  }

  try {
    // 删除旧分段
    const { deleteDocumentSegments } = await import("../services/document-segmentation.service");
    await deleteDocumentSegments(documentId);

    // 创建新分段
    const segments = await segmentDocument(
      documentId,
      doc.content,
      validation.data as any,
    );

    return successResponse(c, { segments });
  } catch (error) {
    return errorResponse(
      c,
      error instanceof Error ? error.message : "分段失败",
      500,
    );
  }
});

/**
 * 检索知识库
 */
app.post("/api/knowledge-bases/:id/search", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const knowledgeBaseId = c.req.param("id");

  // 验证所有权
  const isOwner = await verifyKnowledgeBaseOwnership(knowledgeBaseId, authResult.user.id);
  if (!isOwner) {
    return notFoundResponse(c, "Knowledge base not found");
  }

  const validation = await validateRequestBody(
    c.req.raw,
    z.object({
      query: z.string().min(1),
      topK: z.number().optional(),
      scoreThreshold: z.number().optional(),
      filters: z.any().optional(),
    }),
  );

  if (!validation.success) {
    return errorResponse(c, validation.error, 400);
  }

  try {
    // 获取知识库配置
    const kb = await getKnowledgeBase(knowledgeBaseId, authResult.user.id);
    if (!kb) {
      return notFoundResponse(c, "Knowledge base not found");
    }

    // 根据索引方法选择检索方式
    let results;
    if (kb.indexingMethod === "vector" || kb.indexingMethod === "hybrid") {
      try {
        results = await searchKnowledgeBase(knowledgeBaseId, validation.data as SearchRequest);
      } catch (error) {
        // 如果向量检索失败，回退到关键词检索
        console.warn("Vector search failed, falling back to keyword search:", error);
        results = await keywordSearch(knowledgeBaseId, validation.data as SearchRequest);
      }
    } else {
      results = await keywordSearch(knowledgeBaseId, validation.data as SearchRequest);
    }

    return successResponse(c, { results });
  } catch (error) {
    return errorResponse(
      c,
      error instanceof Error ? error.message : "检索失败",
      500,
    );
  }
});

export default app;
