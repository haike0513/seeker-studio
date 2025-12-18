/**
 * 工作流路由
 */

import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.middleware";
import { successResponse, errorResponse, notFoundResponse } from "../utils/response";
import { validateRequestBody } from "../utils/validation";
import {
  getUserWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  verifyWorkflowOwnership,
} from "../services/workflow.service";
import { validateWorkflow } from "../services/workflow-validator.service";
import { executeWorkflow } from "../services/workflow-executor.service";
import type { CreateWorkflowRequest, UpdateWorkflowRequest, ExecuteWorkflowRequest } from "@/types/workflow";

const app = new Hono();

/**
 * 获取用户的所有工作流
 */
app.get("/api/workflows", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const workflows = await getUserWorkflows(authResult.user.id);
  return successResponse(c, workflows);
});

/**
 * 获取工作流详情
 */
app.get("/api/workflows/:id", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const workflowId = c.req.param("id");
  const workflow = await getWorkflow(workflowId, authResult.user.id);

  if (!workflow) {
    return notFoundResponse(c, "Workflow not found");
  }

  return successResponse(c, workflow);
});

/**
 * 创建工作流
 */
app.post("/api/workflows", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const validation = await validateRequestBody(
    c.req.raw,
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      config: z.any().optional(),
      nodes: z
        .array(
          z.object({
            type: z.string(),
            title: z.string(),
            position: z.object({
              x: z.number(),
              y: z.number(),
            }),
            config: z.any().optional(),
            data: z.any().optional(),
          }),
        )
        .optional(),
      edges: z
        .array(
          z.object({
            source: z.string(),
            target: z.string(),
            sourceHandle: z.string().optional(),
            targetHandle: z.string().optional(),
            config: z.any().optional(),
          }),
        )
        .optional(),
    }),
  );

  if (!validation.success) {
    return errorResponse(c, validation.error, 400);
  }

  const workflowId = await createWorkflow(authResult.user.id, validation.data as CreateWorkflowRequest);
  const workflow = await getWorkflow(workflowId, authResult.user.id);

  return successResponse(c, workflow);
});

/**
 * 更新工作流
 */
app.put("/api/workflows/:id", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const workflowId = c.req.param("id");

  // 验证所有权
  const isOwner = await verifyWorkflowOwnership(workflowId, authResult.user.id);
  if (!isOwner) {
    return notFoundResponse(c, "Workflow not found");
  }

  const validation = await validateRequestBody(
    c.req.raw,
    z.object({
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      config: z.any().optional(),
      enabled: z.boolean().optional(),
      isPublic: z.boolean().optional(),
      nodes: z
        .array(
          z.object({
            type: z.string(),
            title: z.string(),
            position: z.object({
              x: z.number(),
              y: z.number(),
            }),
            config: z.any().optional(),
            data: z.any().optional(),
          }),
        )
        .optional(),
      edges: z
        .array(
          z.object({
            source: z.string(),
            target: z.string(),
            sourceHandle: z.string().optional(),
            targetHandle: z.string().optional(),
            config: z.any().optional(),
          }),
        )
        .optional(),
    }),
  );

  if (!validation.success) {
    return errorResponse(c, validation.error, 400);
  }

  const updated = await updateWorkflow(workflowId, authResult.user.id, validation.data as UpdateWorkflowRequest);

  if (!updated) {
    return errorResponse(c, "Failed to update workflow", 500);
  }

  const workflow = await getWorkflow(workflowId, authResult.user.id);
  return successResponse(c, workflow);
});

/**
 * 删除工作流
 */
app.delete("/api/workflows/:id", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const workflowId = c.req.param("id");

  const deleted = await deleteWorkflow(workflowId, authResult.user.id);

  if (!deleted) {
    return notFoundResponse(c, "Workflow not found");
  }

  return successResponse(c, { success: true });
});

/**
 * 验证工作流
 */
app.post("/api/workflows/:id/validate", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const workflowId = c.req.param("id");
  const workflow = await getWorkflow(workflowId, authResult.user.id);

  if (!workflow) {
    return notFoundResponse(c, "Workflow not found");
  }

  const validation = validateWorkflow(workflow);
  return successResponse(c, validation);
});

/**
 * 执行工作流
 */
app.post("/api/workflows/:id/execute", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  const workflowId = c.req.param("id");

  // 验证所有权
  const isOwner = await verifyWorkflowOwnership(workflowId, authResult.user.id);
  if (!isOwner) {
    return notFoundResponse(c, "Workflow not found");
  }

  const validation = await validateRequestBody(
    c.req.raw,
    z.object({
      input: z.any().optional(),
    }),
  );

  if (!validation.success) {
    return errorResponse(c, validation.error, 400);
  }

  const workflow = await getWorkflow(workflowId, authResult.user.id);
  if (!workflow) {
    return notFoundResponse(c, "Workflow not found");
  }

  try {
    const executionId = await executeWorkflow(
      workflow,
      authResult.user.id,
      (validation.data as ExecuteWorkflowRequest).input,
    );

    return successResponse(c, { executionId });
  } catch (error) {
    return errorResponse(
      c,
      error instanceof Error ? error.message : "执行失败",
      500,
    );
  }
});

export default app;
