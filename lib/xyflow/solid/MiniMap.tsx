/**
 * MiniMap 组件 - 小地图
 */

import { For, splitProps } from "solid-js";
import { useSolidFlowContext } from "./context";
import type { ComponentProps } from "solid-js";
import type { Node } from "./types";
import "./styles.css";

export interface MiniMapProps extends ComponentProps<"div"> {
  nodeColor?: (node: Node) => string;
  nodeStrokeColor?: (node: Node) => string;
  nodeBorderRadius?: number;
  maskColor?: string;
}

export function MiniMap(props: MiniMapProps) {
  const context = useSolidFlowContext();
  const [local, rest] = splitProps(props, [
    "nodeColor",
    "nodeStrokeColor",
    "nodeBorderRadius",
    "maskColor",
    "class",
    "style",
  ]);

  const nodeColor = () => local.nodeColor || (() => "#b1b1b7");
  const nodeStrokeColor = () => local.nodeStrokeColor || (() => "#fff");
  const nodeBorderRadius = () => local.nodeBorderRadius || 2;
  const maskColor = () => local.maskColor || "rgba(0, 0, 0, 0.1)";

  const nodes = () => context.store.store.nodes;
  const viewport = () => context.store.store.viewport;

  // 计算缩放比例
  const getScale = () => {
    if (nodes().length === 0) return 1;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of nodes()) {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + (node.width || 150));
      maxY = Math.max(maxY, node.position.y + (node.height || 40));
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const containerWidth = 200; // MiniMap 容器宽度
    const containerHeight = 150; // MiniMap 容器高度

    return Math.min(containerWidth / width, containerHeight / height, 1);
  };

  const scale = () => getScale();

  return (
    <div
      class={`solid-flow__minimap ${local.class || ""}`}
      style={{
        position: "absolute",
        bottom: "10px",
        right: "10px",
        width: "200px",
        height: "150px",
        background: "#fff",
        border: "1px solid #b1b1b7",
        "border-radius": "4px",
        ...(local.style as Record<string, string>),
      }}
      {...rest}
    >
      <svg width="100%" height="100%" viewBox="0 0 200 150">
        <For each={nodes()}>
          {(node) => (
            <rect
              x={node.position.x * scale()}
              y={node.position.y * scale()}
              width={(node.width || 150) * scale()}
              height={(node.height || 40) * scale()}
              fill={nodeColor()(node)}
              stroke={nodeStrokeColor()(node)}
              stroke-width="1"
              rx={nodeBorderRadius()}
              ry={nodeBorderRadius()}
            />
          )}
        </For>
        {/* 视口指示器 */}
        <rect
          x={viewport().x * scale()}
          y={viewport().y * scale()}
          width={200 / viewport().zoom}
          height={150 / viewport().zoom}
          fill="none"
          stroke="#007bff"
          stroke-width="2"
          stroke-dasharray="4,4"
        />
      </svg>
    </div>
  );
}

