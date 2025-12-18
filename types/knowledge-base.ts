/**
 * 知识库相关类型定义
 */

/**
 * 知识库
 */
export interface KnowledgeBase {
  id: string;
  userId: string;
  name: string;
  description?: string;
  embeddingModel: string;
  indexingMethod: "vector" | "keyword" | "hybrid";
  retrievalConfig?: {
    topK?: number;
    scoreThreshold?: number;
    rerank?: boolean;
  };
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 文档类型
 */
export type DocumentType = "file" | "text" | "url";

/**
 * 文档状态
 */
export type DocumentStatus = "processing" | "completed" | "failed";

/**
 * 文档
 */
export interface Document {
  id: string;
  knowledgeBaseId: string;
  name: string;
  type: DocumentType;
  fileUrl?: string;
  content?: string;
  metadata?: Record<string, unknown>;
  size?: number;
  status: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 文档分段
 */
export interface DocumentSegment {
  id: string;
  documentId: string;
  content: string;
  position?: number;
  length?: number;
  embedding?: number[]; // 向量嵌入
  metadata?: {
    pageNumber?: number;
    sectionTitle?: string;
    keywords?: string[];
  };
  createdAt: Date;
}

/**
 * 创建知识库请求
 */
export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string;
  embeddingModel?: string;
  indexingMethod?: "vector" | "keyword" | "hybrid";
  retrievalConfig?: KnowledgeBase["retrievalConfig"];
}

/**
 * 更新知识库请求
 */
export interface UpdateKnowledgeBaseRequest {
  name?: string;
  description?: string;
  embeddingModel?: string;
  indexingMethod?: "vector" | "keyword" | "hybrid";
  retrievalConfig?: KnowledgeBase["retrievalConfig"];
  enabled?: boolean;
}

/**
 * 创建文档请求
 */
export interface CreateDocumentRequest {
  name: string;
  type: DocumentType;
  fileUrl?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 检索请求
 */
export interface SearchRequest {
  query: string;
  topK?: number;
  scoreThreshold?: number;
  filters?: Record<string, unknown>;
}

/**
 * 检索结果
 */
export interface SearchResult {
  segment: DocumentSegment;
  document: Document;
  score: number;
  metadata?: Record<string, unknown>;
}
