/**
 * 聊天服务
 */

import { db } from "@/database/drizzle/db";
import { chat, message, fileAttachment, messageReference } from "@/database/drizzle/schema/chat";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ChatSession, ChatMessage, ChatHistoryResponse, FileAttachment, MessageReference } from "@/types/chat";
import type { AuthContext } from "@/types/auth";
import { getMessageAttachments } from "./file.service";

/**
 * 获取用户的所有聊天会话
 */
export async function getUserChats(userId: string): Promise<ChatSession[]> {
  const chats = await db
    .select()
    .from(chat)
    .where(eq(chat.userId, userId))
    .orderBy(desc(chat.updatedAt));

  return chats.map((c) => ({
    id: c.id,
    userId: c.userId,
    title: c.title,
    opener: c.opener || undefined,
    enableSuggestions: c.enableSuggestions || false,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
}

/**
 * 获取消息的附件
 */
async function getMessageAttachmentsData(messageId: string): Promise<FileAttachment[]> {
  const attachments = await db
    .select()
    .from(fileAttachment)
    .where(eq(fileAttachment.messageId, messageId));

  return attachments.map((a) => ({
    id: a.id,
    messageId: a.messageId,
    fileType: a.fileType as FileAttachment["fileType"],
    mimeType: a.mimeType,
    fileName: a.fileName,
    fileSize: a.fileSize,
    fileUrl: a.fileUrl,
    metadata: a.metadata as Record<string, unknown> | undefined,
    createdAt: a.createdAt,
  }));
}

/**
 * 获取消息的引用
 */
async function getMessageReferencesData(messageId: string): Promise<MessageReference[]> {
  const references = await db
    .select()
    .from(messageReference)
    .where(eq(messageReference.messageId, messageId));

  return references.map((r) => ({
    id: r.id,
    messageId: r.messageId,
    referenceType: r.referenceType as MessageReference["referenceType"],
    targetId: r.targetId,
    preview: r.preview || undefined,
    metadata: r.metadata as Record<string, unknown> | undefined,
    createdAt: r.createdAt,
  }));
}

/**
 * 获取聊天历史
 */
export async function getChatHistory(
  chatId: string,
  userId: string,
): Promise<ChatHistoryResponse | null> {
  // 验证聊天会话属于该用户
  const chatData = await db
    .select()
    .from(chat)
    .where(
      and(
        eq(chat.id, chatId),
        eq(chat.userId, userId),
      ),
    )
    .limit(1);

  if (chatData.length === 0) return null;

  const messages = await db
    .select()
    .from(message)
    .where(eq(message.chatId, chatId))
    .orderBy(message.createdAt);

  // 为每条消息加载附件和引用
  const messagesWithAttachments = await Promise.all(
    messages.map(async (m) => {
      const [attachments, references] = await Promise.all([
        getMessageAttachmentsData(m.id),
        getMessageReferencesData(m.id),
      ]);

      return {
        id: m.id,
        role: m.role as ChatMessage["role"],
        content: m.content,
        attachments: attachments.length > 0 ? attachments : undefined,
        references: references.length > 0 ? references : undefined,
        metadata: m.metadata as ChatMessage["metadata"],
        createdAt: m.createdAt,
      };
    }),
  );

  return {
    chat: {
      id: chatData[0].id,
      userId: chatData[0].userId,
      title: chatData[0].title,
      opener: chatData[0].opener || undefined,
      enableSuggestions: chatData[0].enableSuggestions || false,
      createdAt: chatData[0].createdAt,
      updatedAt: chatData[0].updatedAt,
    },
    messages: messagesWithAttachments,
  };
}

/**
 * 创建新聊天会话
 */
export async function createChatSession(
  userId: string,
  title: string,
  opener?: string,
  enableSuggestions?: boolean,
): Promise<string> {
  const chatId = nanoid();
  
  await db.insert(chat).values({
    id: chatId,
    userId,
    title,
    opener: opener || null,
    enableSuggestions: enableSuggestions ?? false,
  });

  return chatId;
}

/**
 * 更新聊天会话
 */
export async function updateChatSession(chatId: string, userId: string): Promise<void> {
  await db
    .update(chat)
    .set({ updatedAt: new Date() })
    .where(
      and(
        eq(chat.id, chatId),
        eq(chat.userId, userId),
      ),
    );
}

/**
 * 更新聊天会话元数据（标题 / 开场白 / 建议开关）
 */
export async function updateChatSessionMetadata(
  chatId: string,
  userId: string,
  data: {
    title?: string;
    opener?: string | null;
    enableSuggestions?: boolean;
  },
): Promise<void> {
  const updateData: {
    title?: string;
    opener?: string | null;
    enableSuggestions?: boolean;
    updatedAt?: Date;
  } = {};

  if (typeof data.title === "string") {
    updateData.title = data.title;
  }

  if (typeof data.opener !== "undefined") {
    updateData.opener = data.opener;
  }

  if (typeof data.enableSuggestions !== "undefined") {
    updateData.enableSuggestions = data.enableSuggestions;
  }

  // 没有需要更新的字段则直接返回
  if (!updateData.title && typeof updateData.opener === "undefined" && typeof updateData.enableSuggestions === "undefined") {
    return;
  }

  updateData.updatedAt = new Date();

  await db
    .update(chat)
    .set(updateData)
    .where(
      and(
        eq(chat.id, chatId),
        eq(chat.userId, userId),
      ),
    );
}

/**
 * 删除聊天会话（级联删除消息 / 附件 / 引用）
 */
export async function deleteChatSession(chatId: string, userId: string): Promise<void> {
  await db
    .delete(chat)
    .where(
      and(
        eq(chat.id, chatId),
        eq(chat.userId, userId),
      ),
    );
}

/**
 * 保存用户消息
 */
export async function saveUserMessage(
  chatId: string,
  content: string,
  metadata?: ChatMessage["metadata"],
): Promise<string> {
  const messageId = nanoid();
  await db.insert(message).values({
    id: messageId,
    chatId,
    role: "user",
    content,
    metadata: metadata || null,
  });
  return messageId;
}

/**
 * 保存助手消息
 */
export async function saveAssistantMessage(
  chatId: string,
  content: string,
  metadata?: ChatMessage["metadata"],
): Promise<string> {
  const messageId = nanoid();
  await db.insert(message).values({
    id: messageId,
    chatId,
    role: "assistant",
    content,
    metadata: metadata || null,
  });
  return messageId;
}

/**
 * 保存消息附件
 */
export async function saveMessageAttachment(
  messageId: string,
  attachment: Omit<FileAttachment, "id" | "messageId" | "createdAt">,
): Promise<string> {
  const attachmentId = nanoid();
  await db.insert(fileAttachment).values({
    id: attachmentId,
    messageId,
    fileType: attachment.fileType,
    mimeType: attachment.mimeType,
    fileName: attachment.fileName,
    fileSize: attachment.fileSize,
    fileUrl: attachment.fileUrl,
    metadata: attachment.metadata || null,
  });
  return attachmentId;
}

/**
 * 保存消息引用
 */
export async function saveMessageReference(
  messageId: string,
  reference: Omit<MessageReference, "id" | "messageId" | "createdAt">,
): Promise<string> {
  const referenceId = nanoid();
  await db.insert(messageReference).values({
    id: referenceId,
    messageId,
    referenceType: reference.referenceType,
    targetId: reference.targetId,
    preview: reference.preview || null,
    metadata: reference.metadata || null,
  });
  return referenceId;
}

/**
 * 验证聊天会话所有权
 */
export async function verifyChatOwnership(
  chatId: string,
  userId: string,
): Promise<boolean> {
  const existing = await db
    .select()
    .from(chat)
    .where(
      and(
        eq(chat.id, chatId),
        eq(chat.userId, userId),
      ),
    )
    .limit(1);
  
  return existing.length > 0;
}
