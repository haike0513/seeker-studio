/**
 * Edge 组件 - 边/连接线渲染
 */

import { Show } from "solid-js";
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
  const customEdge = props.context.edgeTypes[props.edgeType];
  const EdgeComponent = customEdge || DefaultEdge;

  return (
    <EdgeComponent
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
  const sourcePosition = () => {
    const node = props.sourceNode;
    const handleId = props.edge.sourceHandle || null;
    return getHandlePosition(node, handleId, "source", "bottom");
  };

  const targetPosition = () => {
    const node = props.targetNode;
    const handleId = props.edge.targetHandle || null;
    return getHandlePosition(node, handleId, "target", "top");
  };

  const path = () => {
    const source = sourcePosition();
    const target = targetPosition();
    const midY = (source.y + target.y) / 2;

    // 简单的贝塞尔曲线路径
    return `M ${source.x} ${source.y} C ${source.x} ${midY}, ${target.x} ${midY}, ${target.x} ${target.y}`;
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
        classList={{
          "solid-flow__edge-selected": props.selected,
        }}
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

