/**
 * xyflow SolidJS 版本工具函数
 */

import type { XYPosition, Node, Edge, Connection, Position } from "./types";

/**
 * 计算两个点之间的距离
 */
export function getDistance(a: XYPosition, b: XYPosition): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

/**
 * 获取节点的中心位置
 */
export function getNodeCenter(node: Node): XYPosition {
  return {
    x: node.position.x + (node.width || 0) / 2,
    y: node.position.y + (node.height || 0) / 2,
  };
}

/**
 * 获取连接点的位置
 */
export function getHandlePosition(
  node: Node,
  handleId: string | null,
  handleType: "source" | "target",
  position: Position
): XYPosition {
  const nodeWidth = node.width || 150;
  const nodeHeight = node.height || 40;
  const handleOffset = 5;

  let x = node.position.x;
  let y = node.position.y;

  switch (position) {
    case "top":
      x += nodeWidth / 2;
      y += handleOffset;
      break;
    case "right":
      x += nodeWidth - handleOffset;
      y += nodeHeight / 2;
      break;
    case "bottom":
      x += nodeWidth / 2;
      y += nodeHeight - handleOffset;
      break;
    case "left":
      x += handleOffset;
      y += nodeHeight / 2;
      break;
  }

  return { x, y };
}

/**
 * 检查连接是否有效
 */
export function isValidConnection(
  connection: Connection,
  nodes: Node[],
  edges: Edge[],
  connectionMode: "loose" | "strict" = "loose",
  _connectionRadius: number = 20
): boolean {
  if (!connection.source || !connection.target) {
    return false;
  }

  // 不能连接到自身
  if (connection.source === connection.target) {
    return false;
  }

  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);

  if (!sourceNode || !targetNode) {
    return false;
  }

  // strict 模式：必须从 source handle 连接到 target handle
  if (connectionMode === "strict") {
    if (!connection.sourceHandle || !connection.targetHandle) {
      return false;
    }
  }

  // 检查是否已存在相同的连接
  const existingEdge = edges.find(
    (edge) =>
      edge.source === connection.source &&
      edge.target === connection.target &&
      edge.sourceHandle === connection.sourceHandle &&
      edge.targetHandle === connection.targetHandle
  );

  if (existingEdge) {
    return false;
  }

  // 检查节点是否可连接
  if (sourceNode.connectable === false || targetNode.connectable === false) {
    return false;
  }

  return true;
}

/**
 * 获取连接点 ID
 */
export function getHandleId(handleId: string | null | undefined): string {
  return handleId || "default";
}

/**
 * 检查点是否在节点内
 */
export function isPointInNode(point: XYPosition, node: Node): boolean {
  const nodeWidth = node.width || 150;
  const nodeHeight = node.height || 40;

  return (
    point.x >= node.position.x &&
    point.x <= node.position.x + nodeWidth &&
    point.y >= node.position.y &&
    point.y <= node.position.y + nodeHeight
  );
}

/**
 * 查找最近的节点
 */
export function findClosestNode(
  point: XYPosition,
  nodes: Node[],
  maxDistance: number = 50
): Node | null {
  let closestNode: Node | null = null;
  let minDistance = maxDistance;

  for (const node of nodes) {
    const center = getNodeCenter(node);
    const distance = getDistance(point, center);

    if (distance < minDistance) {
      minDistance = distance;
      closestNode = node;
    }
  }

  return closestNode;
}

/**
 * 限制数值在范围内
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 格式化位置
 */
export function formatPosition(position: XYPosition): string {
  return `${position.x.toFixed(2)}, ${position.y.toFixed(2)}`;
}

/**
 * 获取节点的边界框
 */
export function getNodeBounds(node: Node): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  return {
    x: node.position.x,
    y: node.position.y,
    width: node.width || 150,
    height: node.height || 40,
  };
}

