/**
 * Node 组件 - 节点渲染
 */

import { createMemo } from "solid-js";
import { Dynamic } from "solid-js/web";
import { useSolidFlowContext } from "./context";
import type { Node as NodeType } from "./types";
import "./styles.css";

export interface NodeProps {
  node: NodeType;
  selected?: boolean;
  dragging?: boolean;
}

export function Node(props: NodeProps) {
  const context = useSolidFlowContext();
  const nodeType = () => props.node.type || "default";

  return (
    <div
      class={`solid-flow__node solid-flow__node-${nodeType()}`}
      classList={{
        "solid-flow__node-selected": props.selected || props.node.selected,
        "solid-flow__node-dragging": props.dragging || props.node.dragging,
      }}
      data-node-id={props.node.id}
      style={{
        position: "absolute",
        transform: `translate(${props.node.position.x}px, ${props.node.position.y}px)`,
        ...props.node.style,
      }}
    >
      <NodeInner
        node={props.node}
        nodeType={nodeType()}
        context={context}
      />
    </div>
  );
}

function NodeInner(props: {
  node: NodeType;
  nodeType: string;
  context: ReturnType<typeof useSolidFlowContext>;
}) {
  const NodeComponent = createMemo(() => {
    const customNode = props.context.nodeTypes[props.nodeType];
    return customNode || DefaultNode;
  });

  return (
    <Dynamic component={NodeComponent()} node={props.node} />
  );
}

/**
 * 默认节点组件
 */
function DefaultNode(props: { node: NodeType }) {
  return (
    <div class="solid-flow__node-default">
      <div class="solid-flow__node-default-label">
        {props.node.data?.label || props.node.id}
      </div>
    </div>
  );
}

