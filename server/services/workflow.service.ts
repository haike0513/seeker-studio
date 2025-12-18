/**
 * 工作流服务
 */

import { db } from "@/database/drizzle/db";
import {
  workflow,
  workflowNode,
  workflowEdge,
  workflowExecution,
  workflowNodeExecution,
} from "@/database/drizzle/schema/workflow";
import { and, eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import type {
  Workflow,
  WorkflowNode as WorkflowNodeType,
  WorkflowEdge as WorkflowEdgeType,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
} from "@/types/workflow";

/**
 * 获取用户的所有工作流
 */
export async function getUserWorkflows(userId: string): Promise<Workflow[]> {
  const workflows = await db
    .select()
    .from(workflow)
    .where(eq(workflow.userId, userId))
    .orderBy(desc(workflow.updatedAt));

  return workflows.map((w) => ({
    id: w.id,
    userId: w.userId,
    name: w.name,
    description: w.description || undefined,
    config: (w.config as Workflow["config"]) || undefined,
    enabled: w.enabled || false,
    isPublic: w.isPublic || false,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  }));
}

/**
 * 获取工作流详情（包括节点和边）
 */
export async function getWorkflow(
  workflowId: string,
  userId: string,
): Promise<(Workflow & { nodes: WorkflowNodeType[]; edges: WorkflowEdgeType[] }) | null> {
  // 验证工作流所有权
  const workflowData = await db
    .select()
    .from(workflow)
    .where(and(eq(workflow.id, workflowId), eq(workflow.userId, userId)))
    .limit(1);

  if (workflowData.length === 0) return null;

  const w = workflowData[0];

  // 获取节点
  const nodes = await db
    .select()
    .from(workflowNode)
    .where(eq(workflowNode.workflowId, workflowId));

  // 获取边
  const edges = await db
    .select()
    .from(workflowEdge)
    .where(eq(workflowEdge.workflowId, workflowId));

  return {
    id: w.id,
    userId: w.userId,
    name: w.name,
    description: w.description || undefined,
    config: (w.config as Workflow["config"]) || undefined,
    enabled: w.enabled || false,
    isPublic: w.isPublic || false,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
    nodes: nodes.map((n) => ({
      id: n.id,
      workflowId: n.workflowId,
      type: n.type as WorkflowNodeType["type"],
      title: n.title,
      position: n.position as WorkflowNodeType["position"],
      config: n.config as WorkflowNodeType["config"],
      data: n.data as WorkflowNodeType["data"],
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      workflowId: e.workflowId,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle || undefined,
      targetHandle: e.targetHandle || undefined,
      config: e.config as WorkflowEdgeType["config"],
      createdAt: e.createdAt,
    })),
  };
}

/**
 * 创建工作流
 */
export async function createWorkflow(
  userId: string,
  data: CreateWorkflowRequest,
): Promise<string> {
  const workflowId = nanoid();

  // 创建工作流
  await db.insert(workflow).values({
    id: workflowId,
    userId,
    name: data.name,
    description: data.description || null,
    config: data.config || null,
    enabled: true,
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 创建节点
  if (data.nodes && data.nodes.length > 0) {
    await db.insert(workflowNode).values(
      data.nodes.map((node) => ({
        id: nanoid(),
        workflowId,
        type: node.type,
        title: node.title,
        position: node.position,
        config: node.config || null,
        data: node.data || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    );
  }

  // 创建边
  if (data.edges && data.edges.length > 0) {
    // 需要先获取节点 ID 映射
    const nodes = await db
      .select()
      .from(workflowNode)
      .where(eq(workflowNode.workflowId, workflowId));

    const nodeIdMap = new Map<string, string>();
    // 假设 data.nodes 中的索引对应 nodes 的索引
    if (data.nodes) {
      data.nodes.forEach((node, index) => {
        if (nodes[index]) {
          nodeIdMap.set(node.title || `node-${index}`, nodes[index].id);
        }
      });
    }

    await db.insert(workflowEdge).values(
      data.edges.map((edge) => ({
        id: nanoid(),
        workflowId,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || null,
        targetHandle: edge.targetHandle || null,
        config: edge.config || null,
        createdAt: new Date(),
      })),
    );
  }

  return workflowId;
}

/**
 * 更新工作流
 */
export async function updateWorkflow(
  workflowId: string,
  userId: string,
  data: UpdateWorkflowRequest,
): Promise<boolean> {
  // 验证所有权
  const workflowData = await db
    .select()
    .from(workflow)
    .where(and(eq(workflow.id, workflowId), eq(workflow.userId, userId)))
    .limit(1);

  if (workflowData.length === 0) return false;

  // 更新工作流基本信息
  const updateData: {
    name?: string;
    description?: string | null;
    config?: unknown;
    enabled?: boolean;
    isPublic?: boolean;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.config !== undefined) updateData.config = data.config || null;
  if (data.enabled !== undefined) updateData.enabled = data.enabled;
  if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

  await db.update(workflow).set(updateData).where(eq(workflow.id, workflowId));

  // 更新节点和边（如果提供）
  if (data.nodes !== undefined) {
    // 删除旧节点
    await db.delete(workflowNode).where(eq(workflowNode.workflowId, workflowId));

    // 创建新节点
    if (data.nodes.length > 0) {
      await db.insert(workflowNode).values(
        data.nodes.map((node) => ({
          id: nanoid(),
          workflowId,
          type: node.type,
          title: node.title,
          position: node.position,
          config: node.config || null,
          data: node.data || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      );
    }
  }

  if (data.edges !== undefined) {
    // 删除旧边
    await db.delete(workflowEdge).where(eq(workflowEdge.workflowId, workflowId));

    // 创建新边
    if (data.edges.length > 0) {
      await db.insert(workflowEdge).values(
        data.edges.map((edge) => ({
          id: nanoid(),
          workflowId,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || null,
          targetHandle: edge.targetHandle || null,
          config: edge.config || null,
          createdAt: new Date(),
        })),
      );
    }
  }

  return true;
}

/**
 * 删除工作流
 */
export async function deleteWorkflow(workflowId: string, userId: string): Promise<boolean> {
  // 验证所有权
  const workflowData = await db
    .select()
    .from(workflow)
    .where(and(eq(workflow.id, workflowId), eq(workflow.userId, userId)))
    .limit(1);

  if (workflowData.length === 0) return false;

  // 删除工作流（级联删除节点和边）
  await db.delete(workflow).where(eq(workflow.id, workflowId));

  return true;
}

/**
 * 验证工作流所有权
 */
export async function verifyWorkflowOwnership(
  workflowId: string,
  userId: string,
): Promise<boolean> {
  const workflowData = await db
    .select()
    .from(workflow)
    .where(and(eq(workflow.id, workflowId), eq(workflow.userId, userId)))
    .limit(1);

  return workflowData.length > 0;
}
