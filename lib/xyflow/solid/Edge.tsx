/**
 * Edge 组件 - 边/连接线渲染
 */

import { Show, createMemo, createEffect, createSignal } from "solid-js";
import { Dynamic } from "solid-js/web";
import { useSolidFlowContext } from "./context";
import type { Edge as EdgeType, Node } from "./types";
import { getHandlePosition } from "./utils";
import "./styles.css";

export interface EdgeProps {
  edge: EdgeType;
  nodes: Node[];
  selected?: boolean;
}

export function Edge(props: EdgeProps) {
  const context = useSolidFlowContext();

  const source = () => props.nodes.find((n) => n.id === props.edge.source);
  const target = () => props.nodes.find((n) => n.id === props.edge.target);
  const edgeType = () => props.edge.type || "default";

  return (
    <Show when={source() && target()}>
      <EdgeInner
        edge={props.edge}
        sourceNode={source()!}
        targetNode={target()!}
        edgeType={edgeType()}
        selected={props.selected}
        context={context}
      />
    </Show>
  );
}

function EdgeInner(props: {
  edge: EdgeType;
  sourceNode: Node;
  targetNode: Node;
  edgeType: string;
  selected?: boolean;
  context: ReturnType<typeof useSolidFlowContext>;
}) {
  const EdgeComponent = createMemo(() => {
    const edgeTypes = props.context.edgeTypes();
    const customEdge = edgeTypes[props.edgeType];
    return customEdge || DefaultEdge;
  });

  return (
    <Dynamic
      component={EdgeComponent()}
      edge={props.edge}
      sourceNode={props.sourceNode}
      targetNode={props.targetNode}
      selected={props.selected}
    />
  );
}

/**
 * 默认边组件
 */
function DefaultEdge(props: {
  edge: EdgeType;
  sourceNode: Node;
  targetNode: Node;
  selected?: boolean;
}) {
  const [sourcePos, setSourcePos] = createSignal<{ x: number; y: number } | null>(null);
  const [targetPos, setTargetPos] = createSignal<{ x: number; y: number } | null>(null);

  // 使用 createEffect 确保在 DOM 渲染后获取位置
  // 监听节点位置和尺寸变化
  createEffect(() => {
    // 访问节点属性以建立响应式依赖
    const _ = props.sourceNode.position.x;
    const __ = props.sourceNode.position.y;
    const ___ = props.sourceNode.width;
    const ____ = props.sourceNode.height;
    
    // 延迟一帧，确保 Handle 已渲染
    requestAnimationFrame(() => {
      const node = props.sourceNode;
      const handleId = props.edge.sourceHandle || null;
      const position = node.sourcePosition || "bottom";
      const pos = getHandlePosition(node, handleId, "source", position);
      setSourcePos(pos);
    });
  });

  createEffect(() => {
    // 访问节点属性以建立响应式依赖
    const _ = props.targetNode.position.x;
    const __ = props.targetNode.position.y;
    const ___ = props.targetNode.width;
    const ____ = props.targetNode.height;
    
    requestAnimationFrame(() => {
      const node = props.targetNode;
      const handleId = props.edge.targetHandle || null;
      const position = node.targetPosition || "top";
      const pos = getHandlePosition(node, handleId, "target", position);
      setTargetPos(pos);
    });
  });

  const sourcePosition = () => {
    if (sourcePos()) return sourcePos()!;
    // 回退到计算位置
    const node = props.sourceNode;
    const handleId = props.edge.sourceHandle || null;
    const position = node.sourcePosition || "bottom";
    return getHandlePosition(node, handleId, "source", position);
  };

  const targetPosition = () => {
    if (targetPos()) return targetPos()!;
    // 回退到计算位置
    const node = props.targetNode;
    const handleId = props.edge.targetHandle || null;
    const position = node.targetPosition || "top";
    return getHandlePosition(node, handleId, "target", position);
  };

  const path = () => {
    const source = sourcePosition();
    const target = targetPosition();
    
    // 计算控制点，使曲线更平滑
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const curvature = 0.5; // 曲率系数
    
    // 根据方向确定控制点
    let controlPoint1X = source.x;
    let controlPoint1Y = source.y;
    let controlPoint2X = target.x;
    let controlPoint2Y = target.y;
    
    // 水平连接
    if (Math.abs(dx) > Math.abs(dy)) {
      const offset = Math.abs(dx) * curvature;
      controlPoint1X = source.x + offset;
      controlPoint1Y = source.y;
      controlPoint2X = target.x - offset;
      controlPoint2Y = target.y;
    } else {
      // 垂直连接
      const offset = Math.abs(dy) * curvature;
      controlPoint1X = source.x;
      controlPoint1Y = source.y + offset;
      controlPoint2X = target.x;
      controlPoint2Y = target.y - offset;
    }
    
    // 使用三次贝塞尔曲线
    return `M ${source.x} ${source.y} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${target.x} ${target.y}`;
  };

  return (
    <g class="solid-flow__edge" data-edge-id={props.edge.id}>
      <path
        class="solid-flow__edge-path"
        classList={{
          "solid-flow__edge-selected": props.selected,
          "solid-flow__edge-animated": props.edge.animated,
        }}
        d={path()}
        stroke={props.selected ? "#3b82f6" : "#b1b1b7"}
        stroke-width={props.selected ? "3" : "2"}
        fill="none"
        marker-end="url(#solid-flow__arrowclosed)"
      />
      <Show when={props.edge.label}>
        <text
          x={(sourcePosition().x + targetPosition().x) / 2}
          y={(sourcePosition().y + targetPosition().y) / 2}
          class="solid-flow__edge-text"
        >
          {props.edge.label}
        </text>
      </Show>
    </g>
  );
}

