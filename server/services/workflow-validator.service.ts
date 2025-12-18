/**
 * 工作流验证服务
 * 验证工作流的有效性和完整性
 */

import type { Workflow, WorkflowNode, WorkflowEdge } from "@/types/workflow";

export interface WorkflowValidationError {
  type: "error" | "warning";
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface WorkflowValidationResult {
  valid: boolean;
  errors: WorkflowValidationError[];
  warnings: WorkflowValidationError[];
}

/**
 * 验证工作流
 */
export function validateWorkflow(
  workflow: Workflow & { nodes: WorkflowNode[]; edges: WorkflowEdge[] },
): WorkflowValidationResult {
  const errors: WorkflowValidationError[] = [];
  const warnings: WorkflowValidationError[] = [];

  // 1. 检查是否有开始节点
  const startNodes = workflow.nodes.filter((n) => n.type === "start");
  if (startNodes.length === 0) {
    errors.push({
      type: "error",
      message: "工作流必须至少有一个开始节点",
    });
  } else if (startNodes.length > 1) {
    warnings.push({
      type: "warning",
      message: "工作流有多个开始节点，建议只保留一个",
    });
  }

  // 2. 检查是否有结束节点
  const endNodes = workflow.nodes.filter((n) => n.type === "end");
  if (endNodes.length === 0) {
    warnings.push({
      type: "warning",
      message: "工作流没有结束节点，建议添加结束节点",
    });
  }

  // 3. 检查节点配置
  workflow.nodes.forEach((node) => {
    // 检查 LLM 节点配置
    if (node.type === "llm") {
      const config = node.config as any;
      if (!config?.model) {
        errors.push({
          type: "error",
          message: `LLM 节点 "${node.title}" 未配置模型`,
          nodeId: node.id,
        });
      }
      if (!config?.userPrompt && !config?.systemPrompt) {
        warnings.push({
          type: "warning",
          message: `LLM 节点 "${node.title}" 未配置提示词`,
          nodeId: node.id,
        });
      }
    }

    // 检查条件节点配置
    if (node.type === "condition") {
      const config = node.config as any;
      if (!config?.condition) {
        errors.push({
          type: "error",
          message: `条件节点 "${node.title}" 未配置条件表达式`,
          nodeId: node.id,
        });
      }
    }

    // 检查 HTTP 节点配置
    if (node.type === "http") {
      const config = node.config as any;
      if (!config?.url) {
        errors.push({
          type: "error",
          message: `HTTP 节点 "${node.title}" 未配置 URL`,
          nodeId: node.id,
        });
      }
    }

    // 检查代码节点配置
    if (node.type === "code") {
      const config = node.config as any;
      if (!config?.code || config.code.trim() === "") {
        errors.push({
          type: "error",
          message: `代码节点 "${node.title}" 未配置代码`,
          nodeId: node.id,
        });
      }
    }

    // 检查模板节点配置
    if (node.type === "template") {
      const config = node.config as any;
      if (!config?.template || config.template.trim() === "") {
        errors.push({
          type: "error",
          message: `模板节点 "${node.title}" 未配置模板`,
          nodeId: node.id,
        });
      }
    }
  });

  // 4. 检查边的有效性
  const nodeIds = new Set(workflow.nodes.map((n) => n.id));
  workflow.edges.forEach((edge) => {
    if (!nodeIds.has(edge.source)) {
      errors.push({
        type: "error",
        message: `边引用了不存在的源节点: ${edge.source}`,
        edgeId: edge.id,
      });
    }
    if (!nodeIds.has(edge.target)) {
      errors.push({
        type: "error",
        message: `边引用了不存在的目标节点: ${edge.target}`,
        edgeId: edge.id,
      });
    }
  });

  // 5. 检查条件节点的边
  const conditionNodes = workflow.nodes.filter((n) => n.type === "condition");
  conditionNodes.forEach((node) => {
    const outgoingEdges = workflow.edges.filter((e) => e.source === node.id);
    if (outgoingEdges.length < 2) {
      warnings.push({
        type: "warning",
        message: `条件节点 "${node.title}" 应该有至少两条输出边（真/假分支）`,
        nodeId: node.id,
      });
    }
  });

  // 6. 检查孤立节点（没有连接的节点）
  const connectedNodeIds = new Set<string>();
  workflow.edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  workflow.nodes.forEach((node) => {
    if (node.type !== "start" && node.type !== "end" && !connectedNodeIds.has(node.id)) {
      warnings.push({
        type: "warning",
        message: `节点 "${node.title}" 未连接到工作流中`,
        nodeId: node.id,
      });
    }
  });

  // 7. 检查循环依赖（简单检查）
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      return true;
    }
    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoingEdges = workflow.edges.filter((e) => e.source === nodeId);
    for (const edge of outgoingEdges) {
      if (hasCycle(edge.target)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of workflow.nodes) {
    if (!visited.has(node.id) && hasCycle(node.id)) {
      warnings.push({
        type: "warning",
        message: "工作流中检测到循环依赖，可能导致无限执行",
      });
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
