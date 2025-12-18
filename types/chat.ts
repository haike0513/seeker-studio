/**
 * 聊天相关类型定义
 */

/**
 * 聊天消息角色
 */
export type MessageRole = "user" | "assistant" | "system";

/**
 * 文件类型
 */
export type FileType = "document" | "image" | "audio" | "video";

/**
 * 文件附件
 */
export interface FileAttachment {
  id: string;
  messageId: string;
  fileType: FileType;
  mimeType: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * 引用类型
 */
export type ReferenceType = "message" | "document" | "knowledge_base_segment";

/**
 * 消息引用
 */
export interface MessageReference {
  id: string;
  messageId: string;
  referenceType: ReferenceType;
  targetId: string;
  preview?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * 消息元数据
 */
export interface MessageMetadata {
  // Token 数量
  tokens?: number;
  // 使用的模型
  model?: string;
  // 生成耗时（毫秒）
  duration?: number;
  // 其他自定义元数据
  [key: string]: unknown;
}

/**
 * 聊天消息
 */
export interface ChatMessage {
  id?: string;
  role: MessageRole;
  content: string;
  // 文件附件
  attachments?: FileAttachment[];
  // 引用
  references?: MessageReference[];
  // 元数据
  metadata?: MessageMetadata;
  createdAt?: Date;
}

/**
 * 聊天会话
 */
export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  // 对话开场白
  opener?: string;
  // 是否启用后续建议
  enableSuggestions?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 创建聊天请求
 */
export interface CreateChatRequest {
  messages: ChatMessage[];
  chatId?: string;
  // 文件附件（用于新消息）
  attachments?: Omit<FileAttachment, "id" | "messageId" | "createdAt">[];
}

/**
 * 聊天历史响应
 */
export interface ChatHistoryResponse {
  chat: ChatSession;
  messages: ChatMessage[];
}

/**
 * 后续建议
 */
export interface FollowUpSuggestion {
  text: string;
  // 建议的优先级或相关性分数
  score?: number;
}
