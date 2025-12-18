/**
 * 文件服务
 * 处理文件上传、存储和管理
 */

import { db } from "@/database/drizzle/db";
import { fileAttachment } from "@/database/drizzle/schema/chat";
import { nanoid } from "nanoid";
import type { FileAttachment, FileType } from "@/types/chat";
import { eq } from "drizzle-orm";

/**
 * 文件上传配置
 */
export const FILE_UPLOAD_CONFIG = {
  // 最大文件大小（字节）：100MB
  maxFileSize: 100 * 1024 * 1024,
  // 允许的文件类型
  allowedMimeTypes: {
    document: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
      "text/csv",
    ],
    image: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ],
    audio: [
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "audio/webm",
    ],
    video: [
      "video/mp4",
      "video/webm",
      "video/ogg",
    ],
  },
} as const;

/**
 * 根据 MIME 类型判断文件类型
 */
export function getFileTypeFromMimeType(mimeType: string): FileType | null {
  for (const [type, mimeTypes] of Object.entries(FILE_UPLOAD_CONFIG.allowedMimeTypes)) {
    if (mimeTypes.includes(mimeType)) {
      return type as FileType;
    }
  }
  return null;
}

/**
 * 验证文件类型和大小
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // 检查文件大小
  if (file.size > FILE_UPLOAD_CONFIG.maxFileSize) {
    return {
      valid: false,
      error: `文件大小超过限制（最大 ${FILE_UPLOAD_CONFIG.maxFileSize / 1024 / 1024}MB）`,
    };
  }

  // 检查文件类型
  const fileType = getFileTypeFromMimeType(file.type);
  if (!fileType) {
    return {
      valid: false,
      error: `不支持的文件类型：${file.type}`,
    };
  }

  return { valid: true };
}

/**
 * 保存文件附件记录到数据库
 */
export async function saveFileAttachment(
  messageId: string,
  fileData: {
    fileType: FileType;
    mimeType: string;
    fileName: string;
    fileSize: number;
    fileUrl: string;
    metadata?: Record<string, unknown>;
  },
): Promise<FileAttachment> {
  const attachmentId = nanoid();

  const [attachment] = await db
    .insert(fileAttachment)
    .values({
      id: attachmentId,
      messageId,
      fileType: fileData.fileType,
      mimeType: fileData.mimeType,
      fileName: fileData.fileName,
      fileSize: fileData.fileSize,
      fileUrl: fileData.fileUrl,
      metadata: fileData.metadata || null,
    })
    .returning();

  return {
    id: attachment.id,
    messageId: attachment.messageId,
    fileType: attachment.fileType as FileType,
    mimeType: attachment.mimeType,
    fileName: attachment.fileName,
    fileSize: attachment.fileSize,
    fileUrl: attachment.fileUrl,
    metadata: attachment.metadata as Record<string, unknown> | undefined,
    createdAt: attachment.createdAt,
  };
}

/**
 * 获取消息的所有附件
 */
export async function getMessageAttachments(messageId: string): Promise<FileAttachment[]> {
  const attachments = await db
    .select()
    .from(fileAttachment)
    .where(eq(fileAttachment.messageId, messageId));

  return attachments.map((a) => ({
    id: a.id,
    messageId: a.messageId,
    fileType: a.fileType as FileType,
    mimeType: a.mimeType,
    fileName: a.fileName,
    fileSize: a.fileSize,
    fileUrl: a.fileUrl,
    metadata: a.metadata as Record<string, unknown> | undefined,
    createdAt: a.createdAt,
  }));
}

/**
 * 删除文件附件
 */
export async function deleteFileAttachment(attachmentId: string): Promise<boolean> {
  const result = await db
    .delete(fileAttachment)
    .where(eq(fileAttachment.id, attachmentId));

  return result.rowCount ? result.rowCount > 0 : false;
}
