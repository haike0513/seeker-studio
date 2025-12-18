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
 * 从 DOM 获取实际位置，考虑所有 CSS transform
 */
export function getHandlePosition(
  node: Node,
  handleId: string | null,
  handleType: "source" | "target",
  position: Position
): XYPosition {
  // 从 DOM 获取 Handle 的实际位置
  const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`) as HTMLElement;
  if (!nodeElement) {
    return getCalculatedHandlePosition(node, handleId, position);
  }

  const handleSelector = handleId 
    ? `[data-handle-id="${handleId}"][data-handle-type="${handleType}"]`
    : `[data-handle-type="${handleType}"]`;
  const handleElement = nodeElement.querySelector(handleSelector) as HTMLElement;
  
  if (!handleElement) {
    return getCalculatedHandlePosition(node, handleId, position);
  }

  // 获取视口信息
  const paneElement = document.querySelector(".solid-flow__pane") as HTMLElement;
  if (!paneElement) {
    return getCalculatedHandlePosition(node, handleId, position);
  }
  
  interface Viewport {
    x: number;
    y: number;
    zoom: number;
  }
  const viewport = ((paneElement as HTMLElement & { __viewport?: Viewport }).__viewport) || { x: 0, y: 0, zoom: 1 };
  
  // 获取 Handle 的边界框（屏幕坐标）
  const handleRect = handleElement.getBoundingClientRect();
  
  // 计算 Handle 中心点（屏幕坐标）
  const handleCenterX = handleRect.left + handleRect.width / 2;
  const handleCenterY = handleRect.top + handleRect.height / 2;
  
  // 获取 pane 的边界框
  const paneRect = paneElement.getBoundingClientRect();
  
  // 将屏幕坐标转换为世界坐标
  // pane 的 transform: translate(viewport.x, viewport.y) scale(viewport.zoom)
  // 所以：screenX = (worldX * zoom) + viewport.x + paneLeft
  // 因此：worldX = (screenX - paneLeft - viewport.x) / zoom
  const x = (handleCenterX - paneRect.left - viewport.x) / viewport.zoom;
  const y = (handleCenterY - paneRect.top - viewport.y) / viewport.zoom;
  
  return { x, y };
}

/**
 * 计算连接点的位置（回退方法）
 */
function getCalculatedHandlePosition(
  node: Node,
  handleId: string | null,
  position: Position
): XYPosition {
  const nodeWidth = node.width || 150;
  const nodeHeight = node.height || 40;
  const handleOffset = 5;

  let x = node.position.x;
  let y = node.position.y;

  // 对于多个 Handle 的情况，需要根据 handleId 计算偏移
  // 这里假设 handleId 为 "true" 或 "false" 时，需要特殊处理
  let horizontalOffset = 0;
  if (handleId === "true" || handleId === "false") {
    // 条件判断节点的两个输出：true 在左，false 在右
    horizontalOffset = handleId === "true" ? -16 : 16;
  }

  switch (position) {
    case "top":
      x += nodeWidth / 2 + horizontalOffset;
      y += handleOffset;
      break;
    case "right":
      x += nodeWidth - handleOffset;
      y += nodeHeight / 2;
      break;
    case "bottom":
      x += nodeWidth / 2 + horizontalOffset;
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

