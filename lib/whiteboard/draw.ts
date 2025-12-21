import type { DrawingElement } from "./types.js";

// 将路径点数组转换为 SVG path 字符串
export function pathToSVGPath(path: Array<{ x: number; y: number }>): string {
  if (path.length === 0) return "";
  if (path.length === 1) {
    return `M ${path[0].x} ${path[0].y}`;
  }
  return `M ${path[0].x} ${path[0].y} L ${path.slice(1).map(p => `${p.x} ${p.y}`).join(" ")}`;
}

// 生成箭头路径
export function arrowToSVGPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  arrowLength: number = 20,
  arrowWidth: number = 10
): string {
  // 计算箭头的方向
  const angle = Math.atan2(y2 - y1, x2 - x1);
  
  // 箭头的两个侧边点
  const arrowX1 = x2 - arrowLength * Math.cos(angle) + arrowWidth * Math.sin(angle);
  const arrowY1 = y2 - arrowLength * Math.sin(angle) - arrowWidth * Math.cos(angle);
  const arrowX2 = x2 - arrowLength * Math.cos(angle) - arrowWidth * Math.sin(angle);
  const arrowY2 = y2 - arrowLength * Math.sin(angle) + arrowWidth * Math.cos(angle);
  
  // 生成路径：主线 + 箭头头部
  return `M ${x1} ${y1} L ${x2} ${y2} M ${arrowX1} ${arrowY1} L ${x2} ${y2} L ${arrowX2} ${arrowY2}`;
}

// 生成菱形路径点
export function getDiamondPoints(
  x: number,
  y: number,
  width: number,
  height: number
): string {
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const halfWidth = Math.abs(width) / 2;
  const halfHeight = Math.abs(height) / 2;
  
  return `${centerX},${y} ${x + width},${centerY} ${centerX},${y + height} ${x},${centerY}`;
}

// 检查点是否在元素内
export function isPointInElement(
  x: number,
  y: number,
  element: DrawingElement
): boolean {
  if (element.type === "pen" || element.type === "eraser") {
    if (!element.path) return false;
    // 检查点是否在路径附近
    const threshold = element.strokeWidth * 2;
    for (let i = 0; i < element.path.length; i++) {
      const point = element.path[i];
      const distance = Math.sqrt(
        Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)
      );
      if (distance < threshold) return true;
    }
    return false;
  }
  
  if (element.width === undefined || element.height === undefined) return false;
  
  if (element.type === "circle") {
    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;
    const radiusX = Math.abs(element.width) / 2;
    const radiusY = Math.abs(element.height) / 2;
    const dx = (x - centerX) / radiusX;
    const dy = (y - centerY) / radiusY;
    return dx * dx + dy * dy <= 1;
  }
  
  if (element.type === "text") {
    // 文本使用 dominant-baseline="hanging"，所以 y 是文本顶部
    const textHeight = element.fontSize || 16;
    return (
      x >= element.x &&
      x <= element.x + (element.width || 0) &&
      y >= element.y &&
      y <= element.y + textHeight
    );
  }
  
  if (element.type === "diamond") {
    // 菱形：检查点是否在菱形内
    const centerX = element.x + element.width / 2;
    const centerY = element.y + element.height / 2;
    const halfWidth = Math.abs(element.width) / 2;
    const halfHeight = Math.abs(element.height) / 2;
    
    // 菱形可以用两个三角形来判断，或者用距离公式
    const dx = Math.abs(x - centerX) / halfWidth;
    const dy = Math.abs(y - centerY) / halfHeight;
    return dx + dy <= 1;
  }
  
  if (element.type === "arrow" || element.type === "line") {
    // 对于箭头和线条，检查点是否在路径附近
    const threshold = element.strokeWidth * 3;
    const x1 = element.x;
    const y1 = element.y;
    const x2 = element.x + element.width;
    const y2 = element.y + element.height;
    
    // 计算点到线段的距离
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx: number, yy: number;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  }
  
  // 矩形
  const minX = Math.min(element.x, element.x + element.width);
  const maxX = Math.max(element.x, element.x + element.width);
  const minY = Math.min(element.y, element.y + element.height);
  const maxY = Math.max(element.y, element.y + element.height);
  
  return x >= minX && x <= maxX && y >= minY && y <= maxY;
}

// 获取元素的边界框
export function getElementBounds(element: DrawingElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} | null {
  if (element.type === "pen" || element.type === "eraser") {
    if (!element.path || element.path.length === 0) return null;
    const xs = element.path.map(p => p.x);
    const ys = element.path.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const padding = element.strokeWidth / 2;
    return {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    };
  }
  
  if (element.width === undefined || element.height === undefined) return null;
  
  return {
    x: element.x,
    y: element.y,
    width: Math.abs(element.width),
    height: Math.abs(element.height),
  };
}
