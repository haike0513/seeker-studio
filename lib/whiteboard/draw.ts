import type { DrawingElement } from "./types.js";

// 将路径点数组转换为 SVG path 字符串
export function pathToSVGPath(path: Array<{ x: number; y: number }>): string {
  if (path.length === 0) return "";
  if (path.length === 1) {
    return `M ${path[0].x} ${path[0].y}`;
  }
  return `M ${path[0].x} ${path[0].y} L ${path.slice(1).map(p => `${p.x} ${p.y}`).join(" ")}`;
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
  
  // 矩形和线条
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
