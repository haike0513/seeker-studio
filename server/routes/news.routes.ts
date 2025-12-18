/**
 * 新闻路由
 */

import { Hono } from "hono";
import { requireAuth } from "../middleware/auth.middleware.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { scheduleTask } from "../queue/task-manager.js";
import { getTasks } from "../queue/task-manager.js";
import type { TaskStatus } from "../queue/types.js";

const app = new Hono();

/**
 * 触发新闻同步任务
 */
app.post("/api/news/sync", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  try {
    // 调度新闻同步任务（立即执行，延迟 0ms）
    await scheduleTask("news-fetcher", 0, {
      triggeredBy: authResult.user.id,
      triggeredAt: new Date().toISOString(),
    });

    return successResponse(c, {
      message: "新闻同步任务已提交到队列",
    });
  } catch (error) {
    console.error("触发新闻同步任务失败:", error);
    return errorResponse(
      c,
      error instanceof Error ? error.message : "触发新闻同步任务失败",
      500
    );
  }
});

/**
 * 获取新闻同步任务列表
 */
app.get("/api/news/tasks", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  try {
    const status = c.req.query("status") as TaskStatus | undefined;
    const page = c.req.query("page") ? parseInt(c.req.query("page")!, 10) : 1;
    const pageSize = c.req.query("pageSize")
      ? parseInt(c.req.query("pageSize")!, 10)
      : 20;

    const result = await getTasks({
      queueName: "news-fetcher",
      status: status ? [status] : undefined,
      page,
      pageSize,
      orderBy: "created",
      order: "desc",
    });

    return successResponse(c, result);
  } catch (error) {
    console.error("获取新闻同步任务列表失败:", error);
    return errorResponse(
      c,
      error instanceof Error ? error.message : "获取新闻同步任务列表失败",
      500
    );
  }
});

export default app;

