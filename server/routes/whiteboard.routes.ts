/**
 * 画板 AI 聊天路由
 * 专门用于画板编辑的 AI 助手，集成工具调用功能
 */

import { Hono } from "hono";
import { streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.middleware";
import { errorResponse, notFoundResponse } from "../utils/response";
import { validateRequestBody } from "../utils/validation";
import {
  createChatSession,
  updateChatSession,
  saveUserMessage,
  saveAssistantMessage,
  verifyChatOwnership,
  saveMessageAttachment,
} from "../services/chat.service";
import { moderateContent, getFlaggedCategories } from "../services/moderation.service";
import type { CreateChatRequest } from "@/types/chat";

// OpenAI compatible provider
const lmstudioProvider = createOpenAICompatible({
  name: "lmstudio",
  baseURL: process.env.OPENAI_COMPATIBLE_BASE_URL || "http://localhost:1234/v1",
  apiKey: process.env.OPENAI_COMPATIBLE_API_KEY || "lm-studio",
});

const app = new Hono();

/**
 * 画板 AI 聊天接口
 * 集成工具调用，帮助用户完成画板编辑工作
 */
app.post("/api/whiteboard/chat", async (c) => {
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
    const title = "画板助手";
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

  // 构建系统提示词 - 专门的画板助手Agent
  const systemPrompt = `你是一个专业的画板助手Agent，可以帮助用户通过自然语言创建和操作画板元素。

你的职责：
1. 理解用户的需求，帮助他们创建画板元素（矩形、圆形、线条、文本等）
2. 根据用户的描述，智能推断元素的位置、大小、颜色等属性
3. 用自然语言向用户解释你将要执行的操作
4. 返回JSON格式的指令供前端执行

画板坐标系：
- 左上角为原点 (0, 0)
- X 轴向右，Y 轴向下
- 默认画布大小约为 1000x1000

可用的操作类型：
1. 创建元素 (create)：
   - type: "rectangle" | "circle" | "line" | "text" | "pen"
   - x, y: 坐标位置
   - width, height: 尺寸（圆形时width和height相等，表示直径）
   - text: 文本内容（仅用于text类型）
   - color: 颜色，十六进制格式（如 #ff0000）
   - strokeWidth: 笔触宽度
   - fontSize: 字体大小（仅用于text类型）

2. 清空画板 (clear)：无参数

3. 删除元素 (delete)：
   - elementId: 元素ID

4. 更新元素 (update)：
   - elementId: 元素ID
   - 其他可更新属性：x, y, width, height, color, text

响应格式要求：
1. 首先用自然语言向用户解释你将要做什么
2. 然后在 \`\`\`json 代码块中返回操作指令
3. 如果有多个操作，返回数组格式

示例：
用户："创建一个红色的矩形，宽200，高150"
你："我将为您创建一个红色的矩形，宽度200，高度150。"
\`\`\`json
{"action": "create", "type": "rectangle", "x": 100, "y": 100, "width": 200, "height": 150, "color": "#ff0000"}
\`\`\`

用户："画一个蓝色的圆，半径50"
你："我将为您创建一个蓝色的圆形，半径为50。"
\`\`\`json
{"action": "create", "type": "circle", "x": 100, "y": 100, "width": 100, "height": 100, "color": "#0000ff"}
\`\`\``;

  // 转换消息格式为 ai-sdk 格式
  const aiMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages
      .filter((msg) => msg.role !== "system")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
      })),
  ];

  // 使用 LMStudio provider
  const model = process.env.MODEL_NAME || "qwen/qwen3-vl-8b";

  // 使用 ai-sdk v6 的 streamText
  const result = streamText({
    model: lmstudioProvider(model),
    messages: aiMessages,
    onFinish: async ({ text }) => {
      // 保存助手消息
      if (text) {
        await saveAssistantMessage(chatId, text);
      }
    },
  });

  // 使用 toUIMessageStreamResponse 创建流式响应
  return result.toUIMessageStreamResponse({
    headers: {
      "X-Chat-Id": chatId,
    },
  });
});

export default app;

