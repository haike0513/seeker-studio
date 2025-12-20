/**
 * 画板路由
 * 包含画板的 CRUD 操作和 AI 聊天功能
 */

import { Hono } from "hono";
import { streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.middleware";
import { successResponse, errorResponse, notFoundResponse } from "../utils/response";
import { validateRequestBody } from "../utils/validation";
import {
  getUserWhiteboards,
  getUserWhiteboardsPaginated,
  getWhiteboardById,
  createWhiteboard,
  updateWhiteboard,
  deleteWhiteboard,
  verifyWhiteboardOwnership,
  getWhiteboardByShareToken,
  enableWhiteboardSharing,
  disableWhiteboardSharing,
} from "../services/whiteboard.service";
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
 * 获取用户的所有画板（支持分页）
 */
app.get("/api/whiteboards", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  // 解析查询参数
  const url = new URL(c.req.url);
  const pageParam = url.searchParams.get("page");
  const pageSizeParam = url.searchParams.get("pageSize");
  
  // 如果提供了分页参数，使用分页接口
  if (pageParam || pageSizeParam) {
    const page = Math.max(1, parseInt(pageParam || "1", 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(pageSizeParam || "12", 10))); // 限制每页最多100条
    
    const result = await getUserWhiteboardsPaginated(
      authResult.user.id,
      page,
      pageSize,
    );
    return successResponse(c, result);
  }

  // 否则返回所有画板（向后兼容）
  const whiteboards = await getUserWhiteboards(authResult.user.id);
  return successResponse(c, whiteboards);
});

/**
 * 创建新画板
 */
app.post("/api/whiteboards", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const validation = await validateRequestBody(
    c.req.raw,
    z.object({
      title: z.string().min(1).max(200).optional(),
      elements: z.array(z.any()).optional(),
    }),
  );

  if (!validation.success) {
    return errorResponse(c, validation.error, 400);
  }

  const { title, elements, metadata, backgroundColor, viewState } = validation.data as {
    title?: string;
    elements?: unknown[];
    metadata?: unknown;
    backgroundColor?: string;
    viewState?: unknown;
  };

  const whiteboardData = await createWhiteboard(
    authResult.user.id,
    title || "新画板",
    elements || [],
    { metadata, backgroundColor, viewState },
  );

  return successResponse(c, whiteboardData);
});

/**
 * 获取画板详情
 */
app.get("/api/whiteboards/:id", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const id = c.req.param("id");
  const whiteboardData = await getWhiteboardById(id, authResult.user.id);

  if (!whiteboardData) {
    return notFoundResponse(c, "Whiteboard not found");
  }

  return successResponse(c, whiteboardData);
});

/**
 * 更新画板
 */
app.patch("/api/whiteboards/:id", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const id = c.req.param("id");

  const validation = await validateRequestBody(
    c.req.raw,
    z.object({
      title: z.string().min(1).max(200).optional(),
      elements: z.array(z.any()).optional(),
      metadata: z.any().optional(),
      backgroundColor: z.string().optional(),
      viewState: z.any().optional(),
    }),
  );

  if (!validation.success) {
    return errorResponse(c, validation.error, 400);
  }

  // 验证画板所有权
  const isOwner = await verifyWhiteboardOwnership(id, authResult.user.id);
  if (!isOwner) {
    return notFoundResponse(c, "Whiteboard not found");
  }

  const updated = await updateWhiteboard(id, authResult.user.id, validation.data);

  if (!updated) {
    return notFoundResponse(c, "Whiteboard not found");
  }

  return successResponse(c, updated);
});

/**
 * 删除画板
 */
app.delete("/api/whiteboards/:id", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const id = c.req.param("id");

  // 验证画板所有权
  const isOwner = await verifyWhiteboardOwnership(id, authResult.user.id);
  if (!isOwner) {
    return notFoundResponse(c, "Whiteboard not found");
  }

  await deleteWhiteboard(id, authResult.user.id);

  return successResponse(c, { success: true, id }, 200);
});

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

/**
 * 通过分享token获取画板（公开访问，无需认证）
 */
app.get("/api/whiteboards/shared/:token", async (c) => {
  const token = c.req.param("token");
  const whiteboardData = await getWhiteboardByShareToken(token);

  if (!whiteboardData) {
    return notFoundResponse(c, "Whiteboard not found or sharing is disabled");
  }

  return successResponse(c, whiteboardData);
});

/**
 * 启用画板分享（生成分享链接）
 */
app.post("/api/whiteboards/:id/share", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const id = c.req.param("id");

  // 验证画板所有权
  const isOwner = await verifyWhiteboardOwnership(id, authResult.user.id);
  if (!isOwner) {
    return notFoundResponse(c, "Whiteboard not found");
  }

  const result = await enableWhiteboardSharing(id, authResult.user.id);
  if (!result) {
    return errorResponse(c, "Failed to enable sharing", 500);
  }

  return successResponse(c, result);
});

/**
 * 禁用画板分享
 */
app.delete("/api/whiteboards/:id/share", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const id = c.req.param("id");

  // 验证画板所有权
  const isOwner = await verifyWhiteboardOwnership(id, authResult.user.id);
  if (!isOwner) {
    return notFoundResponse(c, "Whiteboard not found");
  }

  const success = await disableWhiteboardSharing(id, authResult.user.id);
  if (!success) {
    return errorResponse(c, "Failed to disable sharing", 500);
  }

  return successResponse(c, { success: true });
});

/**
 * 导出画板为JSON格式
 */
app.get("/api/whiteboards/:id/export/json", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const id = c.req.param("id");
  const whiteboardData = await getWhiteboardById(id, authResult.user.id);

  if (!whiteboardData) {
    return notFoundResponse(c, "Whiteboard not found");
  }

  // 构建导出的JSON数据
  const exportData = {
    version: "1.0.0",
    title: whiteboardData.title,
    elements: whiteboardData.elements,
    metadata: whiteboardData.metadata || {},
    backgroundColor: whiteboardData.backgroundColor || "#ffffff",
    viewState: whiteboardData.viewState || {},
    exportedAt: new Date().toISOString(),
  };

  // 返回JSON文件
  return c.json(exportData, 200, {
    "Content-Type": "application/json",
    "Content-Disposition": `attachment; filename="${whiteboardData.title}.excalidraw"`,
  });
});

/**
 * 导入画板（从JSON文件）
 */
app.post("/api/whiteboards/import", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const validation = await validateRequestBody(
    c.req.raw,
    z.object({
      data: z.object({
        title: z.string().optional(),
        elements: z.array(z.any()).optional(),
        metadata: z.any().optional(),
        backgroundColor: z.string().optional(),
        viewState: z.any().optional(),
      }),
      title: z.string().min(1).max(200).optional(),
    }),
  );

  if (!validation.success) {
    return errorResponse(c, validation.error, 400);
  }

  const { data: importData, title } = validation.data;

  // 使用导入的数据创建新画板
  const whiteboardData = await createWhiteboard(
    authResult.user.id,
    title || (typeof importData.title === "string" ? importData.title : "导入的画板"),
    Array.isArray(importData.elements) ? importData.elements : [],
    {
      metadata: importData.metadata,
      backgroundColor: typeof importData.backgroundColor === "string" ? importData.backgroundColor : undefined,
      viewState: importData.viewState,
    },
  );

  return successResponse(c, whiteboardData);
});

/**
 * 导出画板为SVG格式
 */
app.get("/api/whiteboards/:id/export/svg", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const id = c.req.param("id");
  const whiteboardData = await getWhiteboardById(id, authResult.user.id);

  if (!whiteboardData) {
    return notFoundResponse(c, "Whiteboard not found");
  }

  // 构建SVG内容
  const backgroundColor = (whiteboardData.backgroundColor as string) || "#ffffff";
  const elements = (whiteboardData.elements as Array<Record<string, unknown>>) || [];

  // 计算画布边界
  let minX = 0;
  let minY = 0;
  let maxX = 1000;
  let maxY = 1000;

  elements.forEach((el) => {
    const x = typeof el.x === "number" ? el.x : 0;
    const y = typeof el.y === "number" ? el.y : 0;
    const width = typeof el.width === "number" ? el.width : 0;
    const height = typeof el.height === "number" ? el.height : 0;
    
    if (el.x !== undefined) minX = Math.min(minX, x);
    if (el.y !== undefined) minY = Math.min(minY, y);
    if (el.x !== undefined && el.width !== undefined) {
      maxX = Math.max(maxX, x + width);
    }
    if (el.y !== undefined && el.height !== undefined) {
      maxY = Math.max(maxY, y + height);
    }
    if (Array.isArray(el.path)) {
      el.path.forEach((point: unknown) => {
        if (point && typeof point === "object" && "x" in point && "y" in point) {
          const px = typeof point.x === "number" ? point.x : 0;
          const py = typeof point.y === "number" ? point.y : 0;
          minX = Math.min(minX, px);
          minY = Math.min(minY, py);
          maxX = Math.max(maxX, px);
          maxY = Math.max(maxY, py);
        }
      });
    }
  });

  const width = Math.max(maxX - minX, 1000);
  const height = Math.max(maxY - minY, 1000);

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
`;

  // 渲染元素
  elements.forEach((el) => {
    const type = typeof el.type === "string" ? el.type : "";
    const x = typeof el.x === "number" ? el.x : 0;
    const y = typeof el.y === "number" ? el.y : 0;
    const width = typeof el.width === "number" ? el.width : 0;
    const height = typeof el.height === "number" ? el.height : 0;
    const color = typeof el.color === "string" ? el.color : "#000";
    const strokeWidth = typeof el.strokeWidth === "number" ? el.strokeWidth : 2;
    const fontSize = typeof el.fontSize === "number" ? el.fontSize : 16;
    const text = typeof el.text === "string" ? el.text : "";

    if (type === "rectangle") {
      svg += `  <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"/>\n`;
    } else if (type === "circle") {
      const radius = (width || height) / 2;
      const cx = x + radius;
      const cy = y + radius;
      svg += `  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"/>\n`;
    } else if ((type === "line" || type === "pen") && Array.isArray(el.path) && el.path.length >= 2) {
      const pathData = el.path
        .map((point: unknown, idx: number) => {
          if (point && typeof point === "object" && "x" in point && "y" in point) {
            const px = typeof point.x === "number" ? point.x : 0;
            const py = typeof point.y === "number" ? point.y : 0;
            return `${idx === 0 ? "M" : "L"} ${px} ${py}`;
          }
          return "";
        })
        .filter(Boolean)
        .join(" ");
      if (pathData) {
        const linecap = type === "pen" ? ' stroke-linecap="round" stroke-linejoin="round"' : "";
        svg += `  <path d="${pathData}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"${linecap}/>\n`;
      }
    } else if (type === "text") {
      const escapedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      svg += `  <text x="${x}" y="${y + fontSize}" fill="${color}" font-size="${fontSize}">${escapedText}</text>\n`;
    }
  });

  svg += `</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="${whiteboardData.title}.svg"`,
    },
  });
});

export default app;

