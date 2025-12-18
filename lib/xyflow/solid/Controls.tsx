/**
 * Controls 组件 - 控制按钮（缩放、适应视图等）
 */

import { Show, splitProps } from "solid-js";
import { useSolidFlowContext } from "./context";
import type { ComponentProps } from "solid-js";
import "./styles.css";

export interface ControlsProps extends ComponentProps<"div"> {
  showZoom?: boolean;
  showFitView?: boolean;
  showInteractive?: boolean;
}

export function Controls(props: ControlsProps) {
  const context = useSolidFlowContext();
  const [local, rest] = splitProps(props, [
    "showZoom",
    "showFitView",
    "showInteractive",
    "class",
    "style",
  ]);

  const showZoom = () => local.showZoom !== false;
  const showFitView = () => local.showFitView !== false;
  const showInteractive = () => local.showInteractive !== false;

  const handleZoomIn = () => {
    const currentZoom = context.store.store.viewport.zoom;
    const newZoom = Math.min(currentZoom + 0.2, 2);
    context.store.updateViewport({ zoom: newZoom });
  };

  const handleZoomOut = () => {
    const currentZoom = context.store.store.viewport.zoom;
    const newZoom = Math.max(currentZoom - 0.2, 0.1);
    context.store.updateViewport({ zoom: newZoom });
  };

  const handleFitView = () => {
    const nodes = context.store.store.nodes;
    if (nodes.length === 0) return;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of nodes) {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + (node.width || 150));
      maxY = Math.max(maxY, node.position.y + (node.height || 40));
    }

    const padding = 50;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    // 简单的适应视图逻辑
    context.store.updateViewport({
      x: -minX + padding,
      y: -minY + padding,
      zoom: 1,
    });
  };

  return (
    <div
      class={`solid-flow__controls ${local.class || ""}`}
      style={local.style}
      {...rest}
    >
      <Show when={showZoom()}>
        <button
          class="solid-flow__controls-button"
          onClick={handleZoomIn}
          title="放大"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path
              fill="currentColor"
              d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"
            />
          </svg>
        </button>
        <button
          class="solid-flow__controls-button"
          onClick={handleZoomOut}
          title="缩小"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path
              fill="currentColor"
              d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8Z"
            />
          </svg>
        </button>
      </Show>
      <Show when={showFitView()}>
        <button
          class="solid-flow__controls-button"
          onClick={handleFitView}
          title="适应视图"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path
              fill="currentColor"
              d="M1.5 1.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1H2.707l8.146 8.146a.5.5 0 0 1-.708.708L2 2.707V5.5a.5.5 0 0 1-1 0v-4a.5.5 0 0 1 .5-.5zm9 9a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V11.707l-8.146 8.147a.5.5 0 0 1-.708-.708L13.293 11H10.5a.5.5 0 0 1-.5-.5z"
            />
          </svg>
        </button>
      </Show>
    </div>
  );
}

