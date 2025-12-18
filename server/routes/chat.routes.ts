/**
 * 聊天路由
 */

import { Hono } from "hono";
import { streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.middleware";
import { successResponse, errorResponse, notFoundResponse } from "../utils/response";
import { validateRequestBody } from "../utils/validation";
import {
  getUserChats,
  getChatHistory,
  createChatSession,
  updateChatSession,
  saveUserMessage,
  saveAssistantMessage,
  verifyChatOwnership,
  saveMessageAttachment,
  updateChatSessionMetadata,
  deleteChatSession,
} from "../services/chat.service";
import { generateSuggestions } from "../services/suggestion.service";
import { moderateContent, getFlaggedCategories } from "../services/moderation.service";
import type { CreateChatRequest } from "@/types/chat";

// OpenAI compatible provider (for LMStudio, etc.)
const lmstudioProvider = createOpenAICompatible({
  name: "lmstudio",
  baseURL: process.env.OPENAI_COMPATIBLE_BASE_URL || "http://localhost:1234/v1",
  apiKey: process.env.OPENAI_COMPATIBLE_API_KEY || "lm-studio",
});

const app = new Hono();

/**
 * 获取用户的所有聊天会话
 */
app.get("/api/chats", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const chats = await getUserChats(authResult.user.id);
  return successResponse(c, chats);
});

/**
 * 创建新聊天会话
 */
app.post("/api/chats", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const validation = await validateRequestBody(
    c.req.raw,
    z.object({
      title: z.string().optional(),
      opener: z.string().optional(),
      enableSuggestions: z.boolean().optional(),
    }),
  );

  if (!validation.success) {
    return errorResponse(c, validation.error, 400);
  }

  const { title, opener, enableSuggestions } = validation.data;

  const chatId = await createChatSession(
    authResult.user.id,
    title || "新对话",
    opener,
    enableSuggestions,
  );

  const chat = await getChatHistory(chatId, authResult.user.id);
  return successResponse(c, chat?.chat);
});

/**
 * 更新聊天会话（标题 / 开场白 / 建议开关）
 */
app.patch("/api/chats/:id", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const chatId = c.req.param("id");

  const validation = await validateRequestBody(
    c.req.raw,
    z.object({
      title: z.string().min(1).max(200).optional(),
      opener: z.string().nullable().optional(),
      enableSuggestions: z.boolean().optional(),
    }),
  );

  if (!validation.success) {
    return errorResponse(c, validation.error, 400);
  }

  // 验证会话所有权
  const isOwner = await verifyChatOwnership(chatId, authResult.user.id);
  if (!isOwner) {
    return notFoundResponse(c, "Chat not found");
  }

  const { title, opener, enableSuggestions } = validation.data;

  await updateChatSessionMetadata(chatId, authResult.user.id, {
    title,
    opener: typeof opener === "undefined" ? undefined : opener,
    enableSuggestions,
  });

  const updated = await getChatHistory(chatId, authResult.user.id);
  return successResponse(c, updated?.chat ?? null);
});

/**
 * 删除聊天会话
 */
app.delete("/api/chats/:id", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const chatId = c.req.param("id");

  // 验证会话所有权
  const isOwner = await verifyChatOwnership(chatId, authResult.user.id);
  if (!isOwner) {
    return notFoundResponse(c, "Chat not found");
  }

  await deleteChatSession(chatId, authResult.user.id);

  return successResponse(c, { id: chatId }, 200);
});

/**
 * 获取聊天历史
 */
app.get("/api/chat/:id", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const chatId = c.req.param("id");
  const history = await getChatHistory(chatId, authResult.user.id);

  if (!history) {
    return notFoundResponse(c, "Chat not found");
  }

  return successResponse(c, history);
});

/**
 * 创建聊天或发送消息
 */
app.post("/api/chat", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  // 验证请求体
  const validation = await validateRequestBody(
    c.req.raw,
    z.object({
      messages: z.array(
        z.object({
          role: z.enum(["user", "assistant", "system"]),
          content: z.union([z.string(), z.any()]),
        }),
      ).min(1),
      chatId: z.string().optional(),
      attachments: z.array(
        z.object({
          fileType: z.string(),
          mimeType: z.string(),
          fileName: z.string(),
          fileSize: z.number(),
          fileUrl: z.string(),
          metadata: z.any().optional(),
        }),
      ).optional(),
    }),
  );

  if (!validation.success) {
    return errorResponse(c, validation.error, 400);
  }

  const { messages, chatId: reqChatId, attachments } = validation.data as CreateChatRequest & {
    attachments?: Array<{
      fileType: string;
      mimeType: string;
      fileName: string;
      fileSize: number;
      fileUrl: string;
      metadata?: Record<string, unknown>;
    }>;
  };

  // 确定聊天 ID 或创建新聊天
  let chatId = reqChatId;

  if (!chatId) {
    // 创建新聊天
    const firstContent =
      typeof messages[messages.length - 1].content === "string"
        ? messages[messages.length - 1].content
        : "New Chat";

    const title = firstContent.slice(0, 50) || "New Chat";
    chatId = await createChatSession(authResult.user.id, title);
  } else {
    // 验证聊天会话所有权
    const isOwner = await verifyChatOwnership(chatId, authResult.user.id);
    if (!isOwner) {
      return notFoundResponse(c, "Chat not found");
    }

    // 更新更新时间
    await updateChatSession(chatId, authResult.user.id);
  }

  // 保存最后一条用户消息
  const lastMsg = messages[messages.length - 1];
  let messageId: string | undefined;
  if (lastMsg.role === "user") {
    const content = typeof lastMsg.content === "string"
      ? lastMsg.content
      : JSON.stringify(lastMsg.content);
    
    // 内容审核
    const moderationResult = await moderateContent(content);
    if (moderationResult.flagged) {
      const flaggedCategories = getFlaggedCategories(moderationResult);
      return errorResponse(
        c,
        `消息包含不当内容：${flaggedCategories.join("、")}。请修改后重试。`,
        400,
      );
    }
    
    messageId = await saveUserMessage(chatId, content);

    // 保存文件附件
    if (attachments && attachments.length > 0 && messageId) {
      for (const attachment of attachments) {
        await saveMessageAttachment(messageId, {
          fileType: attachment.fileType as "document" | "image" | "audio" | "video",
          mimeType: attachment.mimeType,
          fileName: attachment.fileName,
          fileSize: attachment.fileSize,
          fileUrl: attachment.fileUrl,
          metadata: attachment.metadata,
        });
      }
    }
  }

  // 转换消息格式为 ai-sdk 格式
  const aiMessages = messages.map((msg) => ({
    role: msg.role as "user" | "assistant" | "system",
    content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
  }));

  // 使用 LMStudio provider
  const model = process.env.MODEL_NAME || "qwen/qwen3-vl-8b";

  // 使用 ai-sdk v6 的 streamText
  const result = streamText({
    model: lmstudioProvider(model),
    messages: aiMessages,
  });

  // 保存助手消息（异步执行，不阻塞响应）
  result.text.then(async (assistantContent) => {
    try {
      if (assistantContent) {
        await saveAssistantMessage(chatId, assistantContent);
      }
    } catch (error) {
      console.error("保存助手消息失败:", error);
    }
  });

  // 使用 toUIMessageStreamResponse 创建流式响应
  return result.toUIMessageStreamResponse({
    headers: {
      "X-Chat-Id": chatId,
    },
  });
});

/**
 * 获取后续建议
 * GET /api/chat/:id/suggestions
 */
app.get("/api/chat/:id/suggestions", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const chatId = c.req.param("id");
  const history = await getChatHistory(chatId, authResult.user.id);

  if (!history) {
    return notFoundResponse(c, "Chat not found");
  }

  // 检查是否启用建议
  if (!history.chat.enableSuggestions) {
    return successResponse(c, []);
  }

  // 构建对话历史
  const conversationHistory = history.messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  // 生成建议
  const suggestions = await generateSuggestions(conversationHistory, 3);

  return successResponse(c, suggestions);
});

export default app;
