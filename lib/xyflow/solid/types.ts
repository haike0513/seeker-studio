/**
 * xyflow SolidJS 版本类型定义
 * 基于 @xyflow/react 的类型系统
 */

export type NodeId = string;
export type EdgeId = string;
export type HandleId = string | null;

export type XYPosition = {
  x: number;
  y: number;
};

export type Position = "top" | "right" | "bottom" | "left";

export const Position = {
  Top: "top" as const,
  Right: "right" as const,
  Bottom: "bottom" as const,
  Left: "left" as const,
};

export type NodeTypes = Record<string, any>;
export type EdgeTypes = Record<string, any>;

export type Node<T = any> = {
  id: NodeId;
  type?: string;
  data: T;
  position: XYPosition;
  style?: CSSProperties;
  className?: string;
  sourcePosition?: Position;
  targetPosition?: Position;
  hidden?: boolean;
  selected?: boolean;
  dragging?: boolean;
  draggable?: boolean;
  selectable?: boolean;
  connectable?: boolean;
  deletable?: boolean;
  focusable?: boolean;
  width?: number | null;
  height?: number | null;
  parentNode?: string;
  zIndex?: number;
  extent?: "parent" | [[number, number], [number, number]];
  expandParent?: boolean;
  positionAbsolute?: XYPosition;
  ariaLabel?: string;
};

export type Edge<T = any> = {
  id: EdgeId;
  source: NodeId;
  target: NodeId;
  sourceHandle?: HandleId;
  targetHandle?: HandleId;
  type?: string;
  animated?: boolean;
  hidden?: boolean;
  deletable?: boolean;
  focusable?: boolean;
  selected?: boolean;
  data?: T;
  style?: CSSProperties;
  className?: string;
  label?: string;
  labelStyle?: CSSProperties;
  labelShowBg?: boolean;
  labelBgStyle?: CSSProperties;
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;
  markerStart?: MarkerType;
  markerEnd?: MarkerType;
  zIndex?: number;
  ariaLabel?: string;
};

export type MarkerType = {
  type: MarkerTypeType;
  color?: string;
  width?: number;
  height?: number;
  markerUnits?: string;
  orient?: string;
};

export type MarkerTypeType = "arrow" | "arrowclosed";

export type Connection = {
  source: NodeId | null;
  target: NodeId | null;
  sourceHandle: HandleId;
  targetHandle: HandleId;
};

export type HandleType = "source" | "target";

export type HandleProps = {
  type: HandleType;
  position?: Position;
  id?: HandleId;
  style?: CSSProperties;
  className?: string;
  isConnectable?: boolean;
  isConnectableStart?: boolean;
  isConnectableEnd?: boolean;
  onConnect?: (params: Connection) => void;
};

export type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

export type BackgroundVariant = "dots" | "lines" | "cross";

export type BackgroundProps = {
  id?: string;
  variant?: BackgroundVariant;
  gap?: number;
  size?: number;
  lineWidth?: number;
  offset?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
};

export type ControlButton = {
  id: string;
  icon: any;
  title: string;
  onClick: () => void;
};

export type SolidFlowProps = {
  nodes: Node[];
  edges: Edge[];
  nodeTypes?: NodeTypes;
  edgeTypes?: EdgeTypes;
  defaultNodes?: Node[];
  defaultEdges?: Edge[];
  onNodesChange?: (changes: any[]) => void;
  onEdgesChange?: (changes: any[]) => void;
  onConnect?: (connection: Connection) => void;
  onConnectStart?: (event: MouseEvent | TouchEvent, params: { nodeId?: NodeId; handleType?: HandleType; handleId?: HandleId }) => void;
  onConnectEnd?: (event: MouseEvent | TouchEvent) => void;
  onNodeClick?: (event: MouseEvent, node: Node) => void;
  onNodeDoubleClick?: (event: MouseEvent, node: Node) => void;
  onNodeMouseEnter?: (event: MouseEvent, node: Node) => void;
  onNodeMouseMove?: (event: MouseEvent, node: Node) => void;
  onNodeMouseLeave?: (event: MouseEvent, node: Node) => void;
  onNodeContextMenu?: (event: MouseEvent, node: Node) => void;
  onNodeDrag?: (event: MouseEvent, node: Node) => void;
  onNodeDragStart?: (event: MouseEvent, node: Node) => void;
  onNodeDragStop?: (event: MouseEvent, node: Node) => void;
  onEdgeClick?: (event: MouseEvent, edge: Edge) => void;
  onEdgeDoubleClick?: (event: MouseEvent, edge: Edge) => void;
  onEdgeContextMenu?: (event: MouseEvent, edge: Edge) => void;
  onPaneClick?: (event: MouseEvent) => void;
  onPaneContextMenu?: (event: MouseEvent) => void;
  onPaneScroll?: (event: WheelEvent) => void;
  onPaneMouseMove?: (event: MouseEvent) => void;
  onMove?: (event: MouseEvent | TouchEvent | null, viewport: Viewport) => void;
  onMoveStart?: (event: MouseEvent | TouchEvent | null, viewport: Viewport) => void;
  onMoveEnd?: (event: MouseEvent | TouchEvent | null, viewport: Viewport) => void;
  onSelectionChange?: (params: { nodes: Node[]; edges: Edge[] }) => void;
  onNodesDelete?: (nodes: Node[]) => void;
  onEdgesDelete?: (edges: Edge[]) => void;
  fitView?: boolean;
  fitViewOptions?: FitViewOptions;
  minZoom?: number;
  maxZoom?: number;
  defaultZoom?: number;
  defaultPosition?: [number, number];
  translateExtent?: [[number, number], [number, number]];
  nodeExtent?: [[number, number], [number, number]];
  preventScrolling?: boolean;
  nodesDraggable?: boolean;
  nodesConnectable?: boolean;
  nodesFocusable?: boolean;
  edgesFocusable?: boolean;
  elementsSelectable?: boolean;
  selectNodesOnDrag?: boolean;
  panOnDrag?: boolean | number[];
  panOnScroll?: boolean;
  zoomOnScroll?: boolean;
  zoomOnPinch?: boolean;
  zoomOnDoubleClick?: boolean;
  connectionMode?: "loose" | "strict";
  connectionRadius?: number;
  snapToGrid?: boolean;
  snapGrid?: [number, number];
  onlyRenderVisibleElements?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: any;
};

export type FitViewOptions = {
  padding?: number;
  includeHiddenNodes?: boolean;
  minZoom?: number;
  maxZoom?: number;
  duration?: number;
};

export type CSSProperties = Record<string, string | number | undefined>;

