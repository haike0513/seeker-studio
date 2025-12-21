// 画板工具类型
export type DrawingTool = "select" | "pen" | "rectangle" | "circle" | "line" | "arrow" | "diamond" | "text" | "eraser";

// 绘制元素类型
export interface DrawingElement {
  id: string;
  type: DrawingTool;
  x: number;
  y: number;
  width?: number;
  height?: number;
  path?: Array<{ x: number; y: number }>;
  text?: string;
  fontSize?: number;
  color: string;
  strokeWidth: number;
  fill?: string; // 填充颜色，如果为空则不填充
  rotation?: number;
}

// 画板状态
export interface WhiteboardState {
  elements: DrawingElement[];
  selectedElementId: string | null;
  tool: DrawingTool;
  color: string;
  strokeWidth: number;
  fontSize: number;
  fillColor: string; // 填充颜色，空字符串表示无填充
  history: DrawingElement[][];
  historyIndex: number;
}
