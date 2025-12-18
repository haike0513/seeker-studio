/**
 * xyflow SolidJS 版本主入口
 * 基于 @xyflow/react 的 API 设计
 */

// 主组件
export { SolidFlow } from "./SolidFlow";
export type { SolidFlowProps } from "./types";

// 核心组件
export { Handle } from "./Handle";
export type { HandleProps } from "./types";

export { Background } from "./Background";
export type { BackgroundProps } from "./types";

export { Controls } from "./Controls";
export type { ControlsProps } from "./Controls";

export { MiniMap } from "./MiniMap";
export type { MiniMapProps } from "./MiniMap";

export { Panel } from "./Panel";
export type { PanelProps } from "./Panel";

// 类型定义
export type {
  Node,
  Edge,
  Connection,
  XYPosition,
  Position,
  Viewport,
  NodeTypes,
  EdgeTypes,
  MarkerType,
  MarkerTypeType,
  FitViewOptions,
} from "./types";

export { Position } from "./types";

// Context 和 Store
export { SolidFlowProvider, useSolidFlowContext } from "./context";
export { createSolidFlowStore } from "./store";
export type { SolidFlowStoreType } from "./store";

// 工具函数
export {
  getDistance,
  getNodeCenter,
  getHandlePosition,
  isValidConnection,
  getHandleId,
  isPointInNode,
  findClosestNode,
  clamp,
  formatPosition,
  getNodeBounds,
} from "./utils";

// 样式
import "./styles.css";

