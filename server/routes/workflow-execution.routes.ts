/**
 * 工作流执行记录路由
 */

import { Hono } from "hono";
import { requireAuth } from "../middleware/auth.middleware";
import { successResponse, errorResponse, notFoundResponse } from "../utils/response";
import { db } from "@/database/drizzle/db";
import {
  workflowExecution,
  workflowNodeExecution,
} from "@/database/drizzle/schema/workflow";
import { eq, and, desc } from "drizzle-orm";

const app = new Hono();

/**
 * 获取工作流的执行记录列表
 */
app.get("/api/workflows/:id/executions", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const workflowId = c.req.param("id");

  const executions = await db
    .select()
    .from(workflowExecution)
    .where(
      and(
        eq(workflowExecution.workflowId, workflowId),
        eq(workflowExecution.userId, authResult.user.id),
      ),
    )
    .orderBy(desc(workflowExecution.createdAt))
    .limit(50);

  return successResponse(c, executions);
});

/**
 * 获取执行记录详情
 */
app.get("/api/workflows/executions/:executionId", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const executionId = c.req.param("executionId");

  const execution = await db
    .select()
    .from(workflowExecution)
    .where(
      and(
        eq(workflowExecution.id, executionId),
        eq(workflowExecution.userId, authResult.user.id),
      ),
    )
    .limit(1);

  if (execution.length === 0) {
    return notFoundResponse(c, "Execution not found");
  }

  // 获取节点执行记录
  const nodeExecutions = await db
    .select()
    .from(workflowNodeExecution)
    .where(eq(workflowNodeExecution.executionId, executionId))
    .orderBy(workflowNodeExecution.startedAt);

  return successResponse(c, {
    ...execution[0],
    nodeExecutions,
  });
});

/**
 * 取消执行
 */
app.post("/api/workflows/executions/:executionId/cancel", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const executionId = c.req.param("executionId");

  const execution = await db
    .select()
    .from(workflowExecution)
    .where(
      and(
        eq(workflowExecution.id, executionId),
        eq(workflowExecution.userId, authResult.user.id),
      ),
    )
    .limit(1);

  if (execution.length === 0) {
    return notFoundResponse(c, "Execution not found");
  }

  if (execution[0].status !== "running") {
    return errorResponse(c, "只能取消正在运行的任务", 400);
  }

  await db
    .update(workflowExecution)
    .set({
      status: "cancelled",
      completedAt: new Date(),
    })
    .where(eq(workflowExecution.id, executionId));

  return successResponse(c, { success: true });
});

export default app;
