/**
 * 任务队列路由
 */

import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.middleware.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { validateRequestQuery } from "../utils/validation.js";
import {
  getQueueNames,
  getQueueStats,
  getTasks,
  getTask,
} from "../queue/task-manager.js";
import type { TaskStatus } from "../queue/types.js";

const app = new Hono();

/**
 * 获取所有队列名称
 */
app.get("/api/queue/names", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  try {
    const queueNames = await getQueueNames();
    return successResponse(c, { queueNames });
  } catch (error) {
    console.error("获取队列名称失败:", error);
    return errorResponse(
      c,
      error instanceof Error ? error.message : "获取队列名称失败",
      500
    );
  }
});

/**
 * 获取队列统计信息
 */
app.get("/api/queue/stats", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  try {
    const validation = await validateRequestQuery(
      c.req.raw,
      z.object({
        queueName: z.string().optional(),
      })
    );

    if (!validation.success) {
      return errorResponse(c, validation.error, 400);
    }

    const { queueName } = validation.data;
    const stats = await getQueueStats(queueName);
    return successResponse(c, { stats });
  } catch (error) {
    console.error("获取队列统计失败:", error);
    return errorResponse(
      c,
      error instanceof Error ? error.message : "获取队列统计失败",
      500
    );
  }
});

/**
 * 获取任务列表
 */
app.get("/api/queue/tasks", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  try {
    const validation = await validateRequestQuery(
      c.req.raw,
      z.object({
        queueName: z.string().optional(),
        status: z.string().optional(),
        page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : undefined)),
        pageSize: z
          .string()
          .optional()
          .transform((val) => (val ? parseInt(val, 10) : undefined)),
        orderBy: z.enum(["created", "started", "completed"]).optional(),
        order: z.enum(["asc", "desc"]).optional(),
      })
    );

    if (!validation.success) {
      return errorResponse(c, validation.error, 400);
    }

    const statusArray = validation.data.status
      ? validation.data.status.split(",")
      : undefined;

    const options = {
      queueName: validation.data.queueName,
      status: statusArray as TaskStatus[] | undefined,
      page: validation.data.page,
      pageSize: validation.data.pageSize,
      orderBy: validation.data.orderBy,
      order: validation.data.order,
    };

    const result = await getTasks(options);
    return successResponse(c, result);
  } catch (error) {
    console.error("获取任务列表失败:", error);
    return errorResponse(
      c,
      error instanceof Error ? error.message : "获取任务列表失败",
      500
    );
  }
});

/**
 * 获取任务详情
 */
app.get("/api/queue/tasks/:taskId", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  try {
    const taskId = c.req.param("taskId");
    if (!taskId) {
      return errorResponse(c, "任务 ID 是必需的", 400);
    }

    const task = await getTask(taskId);
    if (!task) {
      return errorResponse(c, "任务不存在", 404);
    }

    return successResponse(c, { task });
  } catch (error) {
    console.error("获取任务详情失败:", error);
    return errorResponse(
      c,
      error instanceof Error ? error.message : "获取任务详情失败",
      500
    );
  }
});

export default app;

