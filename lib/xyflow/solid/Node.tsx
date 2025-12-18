/**
 * Node 组件 - 节点渲染
 */

import { createMemo, createEffect } from "solid-js";
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
  let nodeElement: HTMLDivElement | undefined;

  const handleClick = (event: MouseEvent) => {
    if (context.handleNodeClick) {
      context.handleNodeClick(event, props.node);
    }
  };

  // 自动检测节点尺寸
  createEffect(() => {
    if (nodeElement && (!props.node.width || !props.node.height)) {
      const rect = nodeElement.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        context.store.updateNode(props.node.id, {
          width: rect.width,
          height: rect.height,
        });
      }
    }
  });

  return (
    <div
      ref={nodeElement}
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
      onClick={handleClick}
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
    const nodeTypes = props.context.nodeTypes();
    const customNode = nodeTypes[props.nodeType];
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

