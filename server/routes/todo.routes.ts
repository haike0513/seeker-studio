/**
 * Todo 路由
 */

import { Hono } from "hono";
import { z } from "zod";
import { enhance, type UniversalHandler } from "@universal-middleware/core";
import { requireAuth } from "../middleware/auth.middleware";
import { successResponse, errorResponse } from "../utils/response";
import { validateRequestBody } from "../utils/validation";
import { createTodo } from "../services/todo.service";
import { db } from "@/database/drizzle/db";
import type { CreateTodoRequest } from "@/types/todo";

const app = new Hono();

/**
 * 创建 Todo 处理器（使用 Universal Middleware）
 */
export const createTodoHandler: UniversalHandler<Universal.Context & { db: typeof db }> = enhance(
  async (request, context, _runtime) => {
    // 验证请求体
    const validation = await validateRequestBody(
      request,
      z.object({
        text: z.string().min(1, "Todo text is required"),
      }),
    );

    if (!validation.success) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    await createTodo(context.db, validation.data.text);

    return new Response(
      JSON.stringify({ success: true, data: { status: "OK" } }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  },
  {
    name: "my-app:todo-handler",
    path: `/api/todo/create`,
    method: ["GET", "POST"],
    immutable: false,
  },
);

/**
 * 创建 Todo（Hono 路由）
 */
app.post("/api/todo/create", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const validation = await validateRequestBody(
    c.req.raw,
    z.object({
      text: z.string().min(1, "Todo text is required"),
    }),
  );

  if (!validation.success) {
    return errorResponse(c, validation.error, 400);
  }

  await createTodo(db, validation.data.text);

  return successResponse(c, { status: "OK" });
});

export default app;
