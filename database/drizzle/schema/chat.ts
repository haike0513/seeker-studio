import { relations } from "drizzle-orm";
import { index, pgEnum, pgTable, text, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const roleEnum = pgEnum("role", ["user", "assistant", "system"]);

export const chat = pgTable(
    "chat",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        // 对话开场白（AI 主动发送的欢迎消息）
        opener: text("opener"),
        // 是否启用后续建议
        enableSuggestions: boolean("enable_suggestions").default(false).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index("chat_userId_idx").on(table.userId)],
);

export const message = pgTable(
    "message",
    {
        id: text("id").primaryKey(),
        chatId: text("chat_id")
            .notNull()
            .references(() => chat.id, { onDelete: "cascade" }),
        role: text("role").notNull(), // using text to allow flexibility, though enum is cleaner
        content: text("content").notNull(),
        // 消息元数据（JSONB，存储额外信息如 token 数、模型版本等）
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [index("message_chatId_idx").on(table.chatId)],
);

// 文件附件表
export const fileAttachment = pgTable(
    "file_attachment",
    {
        id: text("id").primaryKey(),
        messageId: text("message_id")
            .notNull()
            .references(() => message.id, { onDelete: "cascade" }),
        // 文件类型：document, image, audio, video
        fileType: text("file_type").notNull(),
        // 文件 MIME 类型
        mimeType: text("mime_type").notNull(),
        // 文件名
        fileName: text("file_name").notNull(),
        // 文件大小（字节）
        fileSize: integer("file_size").notNull(),
        // 文件存储路径或 URL
        fileUrl: text("file_url").notNull(),
        // 文件元数据（JSONB，存储图片尺寸、视频时长等）
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [index("fileAttachment_messageId_idx").on(table.messageId)],
);

// 消息引用表（引用其他消息、文档或知识库片段）
export const messageReference = pgTable(
    "message_reference",
    {
        id: text("id").primaryKey(),
        messageId: text("message_id")
            .notNull()
            .references(() => message.id, { onDelete: "cascade" }),
        // 引用类型：message, document, knowledge_base_segment
        referenceType: text("reference_type").notNull(),
        // 引用目标 ID（消息 ID、文档 ID 或分段 ID）
        targetId: text("target_id").notNull(),
        // 引用内容预览（用于显示）
        preview: text("preview"),
        // 引用元数据（JSONB）
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("messageReference_messageId_idx").on(table.messageId),
        index("messageReference_targetId_idx").on(table.targetId),
    ],
);

export const chatRelations = relations(chat, ({ one, many }) => ({
    user: one(user, {
        fields: [chat.userId],
        references: [user.id],
    }),
    messages: many(message),
}));

export const messageRelations = relations(message, ({ one, many }) => ({
    chat: one(chat, {
        fields: [message.chatId],
        references: [chat.id],
    }),
    attachments: many(fileAttachment),
    references: many(messageReference),
}));

export const fileAttachmentRelations = relations(fileAttachment, ({ one }) => ({
    message: one(message, {
        fields: [fileAttachment.messageId],
        references: [message.id],
    }),
}));

export const messageReferenceRelations = relations(messageReference, ({ one }) => ({
    message: one(message, {
        fields: [messageReference.messageId],
        references: [message.id],
    }),
}));
