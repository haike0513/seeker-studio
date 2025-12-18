/**
 * 工作流执行服务
 * 解析和执行工作流
 */

import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { db } from "@/database/drizzle/db";
import {
  workflowExecution,
  workflowNodeExecution,
} from "@/database/drizzle/schema/workflow";
import type {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  WorkflowExecutionStatus,
  ExecuteWorkflowRequest,
} from "@/types/workflow";
import { validateWorkflow } from "./workflow-validator.service";
import { executeLLMNode } from "./workflow-nodes/llm-node";
import { executeConditionNode } from "./workflow-nodes/condition-node";
import { executeHTTPNode } from "./workflow-nodes/http-node";
import { executeCodeNode } from "./workflow-nodes/code-node";
import { executeParameterNode } from "./workflow-nodes/parameter-node";
import { executeTemplateNode } from "./workflow-nodes/template-node";
import { executeKnowledgeRetrievalNode } from "./workflow-nodes/knowledge-retrieval-node";

/**
 * 执行工作流
 */
export async function executeWorkflow(
  workflow: Workflow & { nodes: WorkflowNode[]; edges: WorkflowEdge[] },
  userId: string,
  input: ExecuteWorkflowRequest["input"] = {},
): Promise<string> {
  // 验证工作流
  const validation = validateWorkflow(workflow);
  if (!validation.valid) {
    throw new Error(
      `工作流验证失败: ${validation.errors.map((e) => e.message).join(", ")}`,
    );
  }

  // 创建执行记录
  const executionId = nanoid();
  await db.insert(workflowExecution).values({
    id: executionId,
    workflowId: workflow.id,
    userId,
    status: "running",
    input: input || {},
    startedAt: new Date(),
    createdAt: new Date(),
  });

  // 异步执行工作流
  executeWorkflowAsync(workflow, executionId, input || {}, userId).catch((error) => {
    console.error("Workflow execution error:", error);
    // 更新执行状态为失败
    db.update(workflowExecution)
      .set({
        status: "failed",
        error: error.message,
        completedAt: new Date(),
      })
      .where(eq(workflowExecution.id, executionId));
  });

  return executionId;
}

/**
 * 异步执行工作流
 */
async function executeWorkflowAsync(
  workflow: Workflow & { nodes: WorkflowNode[]; edges: WorkflowEdge[] },
  executionId: string,
  input: Record<string, unknown>,
  userId: string,
): Promise<void> {
  try {
    // 构建执行图
    const executionGraph = buildExecutionGraph(workflow);
    
    // 找到开始节点
    const startNode = workflow.nodes.find((n) => n.type === "start");
    if (!startNode) {
      throw new Error("工作流没有开始节点");
    }

    // 执行工作流
    const output = await executeNodeRecursive(
      startNode,
      workflow,
      executionGraph,
      input,
      executionId,
      userId,
    );

    // 更新执行状态为完成
    await db
      .update(workflowExecution)
      .set({
        status: "completed",
        output,
        completedAt: new Date(),
      })
      .where(eq(workflowExecution.id, executionId));
  } catch (error) {
    // 更新执行状态为失败
    await db
      .update(workflowExecution)
      .set({
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        completedAt: new Date(),
      })
      .where(eq(workflowExecution.id, executionId));
    throw error;
  }
}

/**
 * 构建执行图（节点ID -> 下游节点列表）
 */
function buildExecutionGraph(workflow: {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}): Map<string, WorkflowEdge[]> {
  const graph = new Map<string, WorkflowEdge[]>();
  
  workflow.nodes.forEach((node) => {
    graph.set(node.id, []);
  });

  workflow.edges.forEach((edge) => {
    const edges = graph.get(edge.source) || [];
    edges.push(edge);
    graph.set(edge.source, edges);
  });

  return graph;
}

/**
 * 递归执行节点
 */
async function executeNodeRecursive(
  node: WorkflowNode,
  workflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] },
  executionGraph: Map<string, WorkflowEdge[]>,
  input: Record<string, unknown>,
  executionId: string,
  userId: string,
): Promise<Record<string, unknown>> {
  // 创建节点执行记录
  const nodeExecutionId = nanoid();
  await db.insert(workflowNodeExecution).values({
    id: nodeExecutionId,
    executionId,
    nodeId: node.id,
    status: "running",
    input,
    startedAt: new Date(),
    createdAt: new Date(),
  });

  let output: Record<string, unknown> = {};

  try {
    // 执行节点
    switch (node.type) {
      case "start":
        output = input;
        break;
      case "end":
        output = input;
        break;
      case "llm":
        output = await executeLLMNode(node, input);
        break;
      case "condition":
        output = await executeConditionNode(node, input);
        break;
      case "http":
        output = await executeHTTPNode(node, input);
        break;
      case "code":
        output = await executeCodeNode(node, input);
        break;
      case "parameter":
        output = await executeParameterNode(node, input);
        break;
      case "template":
        output = await executeTemplateNode(node, input);
        break;
      case "knowledge_retrieval":
        output = await executeKnowledgeRetrievalNode(node, input, userId);
        break;
      default:
        output = input;
    }

    // 更新节点执行状态为完成
    await db
      .update(workflowNodeExecution)
      .set({
        status: "completed",
        output,
        completedAt: new Date(),
      })
      .where(eq(workflowNodeExecution.id, nodeExecutionId));

    // 如果是结束节点，返回输出
    if (node.type === "end") {
      return output;
    }

    // 获取下游节点
    const outgoingEdges = executionGraph.get(node.id) || [];
    
    // 如果是条件节点，根据条件选择分支
    if (node.type === "condition") {
      const conditionResult = output.conditionResult as boolean;
      const targetEdge = outgoingEdges.find((e) => {
        const config = e.config || {};
        if (conditionResult && e.sourceHandle === "true") {
          return true;
        }
        if (!conditionResult && e.sourceHandle === "false") {
          return true;
        }
        return false;
      });

      if (targetEdge) {
        const nextNode = workflow.nodes.find((n) => n.id === targetEdge.target);
        if (nextNode) {
          return executeNodeRecursive(nextNode, workflow, executionGraph, output, executionId, userId);
        }
      }
    } else {
      // 对于其他节点，执行所有下游节点（并行或顺序）
      const results: Record<string, unknown>[] = [];
      for (const edge of outgoingEdges) {
        const nextNode = workflow.nodes.find((n) => n.id === edge.target);
        if (nextNode) {
          const result = await executeNodeRecursive(
            nextNode,
            workflow,
            executionGraph,
            output,
            executionId,
            userId,
          );
          results.push(result);
        }
      }
      
      // 合并所有结果
      if (results.length > 0) {
        output = Object.assign({}, ...results);
      }
    }

    return output;
  } catch (error) {
    // 更新节点执行状态为失败
    await db
      .update(workflowNodeExecution)
      .set({
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        completedAt: new Date(),
      })
      .where(eq(workflowNodeExecution.id, nodeExecutionId));
    throw error;
  }
}
