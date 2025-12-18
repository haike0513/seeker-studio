/**
 * 工作流验证器 - 检查工作流的有效性
 */

import type { Node, Edge } from "@/lib/xyflow/solid";
import type { WorkflowNodeType } from "@/types/workflow";

export interface ValidationError {
  type: "error" | "warning";
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * 验证工作流
 */
export function validateWorkflow(
  nodes: Node[],
  edges: Edge[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // 1. 检查是否有开始节点
  const startNodes = nodes.filter((n) => n.type === "start");
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
  const endNodes = nodes.filter((n) => n.type === "end");
  if (endNodes.length === 0) {
    warnings.push({
      type: "warning",
      message: "工作流没有结束节点",
    });
  }

  // 3. 检查孤立节点（没有连接的节点）
  const connectedNodeIds = new Set<string>();
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  nodes.forEach((node) => {
    if (node.type !== "start" && node.type !== "end" && !connectedNodeIds.has(node.id)) {
      warnings.push({
        type: "warning",
        message: `节点 "${(node.data as { title?: string })?.title || node.id}" 未连接到工作流`,
        nodeId: node.id,
      });
    }
  });

  // 4. 检查边的有效性
  edges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode) {
      errors.push({
        type: "error",
        message: `边连接到不存在的源节点: ${edge.source}`,
        edgeId: edge.id,
      });
    }

    if (!targetNode) {
      errors.push({
        type: "error",
        message: `边连接到不存在的目标节点: ${edge.target}`,
        edgeId: edge.id,
      });
    }

    // 检查循环连接（节点连接到自身）
    if (edge.source === edge.target) {
      errors.push({
        type: "error",
        message: `节点不能连接到自身`,
        edgeId: edge.id,
        nodeId: edge.source,
      });
    }
  });

  // 5. 检查条件节点的输出连接
  nodes.forEach((node) => {
    if (node.type === "condition") {
      const outgoingEdges = edges.filter((e) => e.source === node.id);
      if (outgoingEdges.length === 0) {
        warnings.push({
          type: "warning",
          message: `条件节点 "${(node.data as { title?: string })?.title || node.id}" 没有输出连接`,
          nodeId: node.id,
        });
      } else if (outgoingEdges.length === 1) {
        warnings.push({
          type: "warning",
          message: `条件节点 "${(node.data as { title?: string })?.title || node.id}" 应该有两个输出连接（是/否）`,
          nodeId: node.id,
        });
      }
    }
  });

  // 6. 检查是否有循环依赖（简单检查）
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

    const outgoingEdges = edges.filter((e) => e.source === nodeId);
    for (const edge of outgoingEdges) {
      if (hasCycle(edge.target)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  // 只检查非开始节点（开始节点可能有循环是正常的）
  nodes.forEach((node) => {
    if (node.type !== "start" && !visited.has(node.id)) {
      if (hasCycle(node.id)) {
        warnings.push({
          type: "warning",
          message: `检测到可能的循环依赖`,
          nodeId: node.id,
        });
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

