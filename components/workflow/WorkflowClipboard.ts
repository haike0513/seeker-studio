/**
 * 工作流剪贴板管理器 - 节点复制/粘贴
 */

import type { Node, Edge } from "@/lib/xyflow/solid";
import type { WorkflowNode, WorkflowEdge } from "@/types/workflow";

export interface ClipboardData {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  offset: { x: number; y: number };
}

export class WorkflowClipboard {
  private data: ClipboardData | null = null;

  /**
   * 复制节点和边
   */
  copy(
    nodes: Node[],
    edges: Edge[],
    selectedNodeIds: string[],
    fullNodes: WorkflowNode[]
  ): boolean {
    if (selectedNodeIds.length === 0) {
      return false;
    }

    // 获取选中的节点
    const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));
    if (selectedNodes.length === 0) {
      return false;
    }

    // 计算选中节点的边界框
    let minX = Infinity;
    let minY = Infinity;
    selectedNodes.forEach((node) => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
    });

    // 获取完整的节点数据
    const fullSelectedNodes = selectedNodeIds
      .map((id) => fullNodes.find((n) => n.id === id))
      .filter((n): n is WorkflowNode => n !== undefined);

    // 获取相关的边（只包含选中节点之间的边）
    const selectedNodeIdSet = new Set(selectedNodeIds);
    const relatedEdges = edges.filter(
      (edge) =>
        selectedNodeIdSet.has(edge.source) && selectedNodeIdSet.has(edge.target)
    );

    // 转换为完整边数据
    const fullEdges: WorkflowEdge[] = relatedEdges.map((edge) => ({
      id: edge.id,
      workflowId: "",
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || undefined,
      targetHandle: edge.targetHandle || undefined,
      config: {},
      createdAt: new Date(),
    }));

    // 调整节点位置（相对于左上角）
    const adjustedNodes = fullSelectedNodes.map((node) => ({
      ...node,
      position: {
        x: node.position.x - minX,
        y: node.position.y - minY,
      },
    }));

    this.data = {
      nodes: adjustedNodes,
      edges: fullEdges,
      offset: { x: minX, y: minY },
    };

    return true;
  }

  /**
   * 粘贴节点和边
   */
  paste(
    pastePosition?: { x: number; y: number }
  ): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } | null {
    if (!this.data) {
      return null;
    }

    const offset = pastePosition || { x: 100, y: 100 };
    const timestamp = Date.now();

    // 创建新的节点（生成新ID，调整位置）
    const newNodes = this.data.nodes.map((node, index) => ({
      ...node,
      id: `node-${timestamp}-${index}`,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
    }));

    // 创建节点ID映射
    const nodeIdMap = new Map<string, string>();
    this.data.nodes.forEach((oldNode, index) => {
      nodeIdMap.set(oldNode.id, newNodes[index].id);
    });

    // 创建新的边（更新源和目标节点ID）
    const newEdges = this.data.edges.map((edge, index) => ({
      ...edge,
      id: `edge-${timestamp}-${index}`,
      source: nodeIdMap.get(edge.source) || edge.source,
      target: nodeIdMap.get(edge.target) || edge.target,
    }));

    return {
      nodes: newNodes,
      edges: newEdges,
    };
  }

  /**
   * 检查剪贴板是否有数据
   */
  hasData(): boolean {
    return this.data !== null && this.data.nodes.length > 0;
  }

  /**
   * 清空剪贴板
   */
  clear(): void {
    this.data = null;
  }
}

