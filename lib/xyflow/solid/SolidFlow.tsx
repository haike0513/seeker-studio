/**
 * SolidFlow 主组件
 * 基于 xyflow React 版本的 SolidJS 实现
 */

import {
  createEffect,
  onMount,
  onCleanup,
  For,
  Show,
  splitProps,
  type ComponentProps,
} from "solid-js";
import { SolidFlowProvider, useSolidFlowContext } from "./context";
import { createSolidFlowStore } from "./store";
import { Node } from "./Node";
import { Edge } from "./Edge";
import type { SolidFlowProps, Node as NodeType, Edge as EdgeType, Connection } from "./types";
import { isValidConnection } from "./utils";
import "./styles.css";

export function SolidFlow(props: SolidFlowProps) {
  const [local, rest] = splitProps(props, [
    "nodes",
    "edges",
    "nodeTypes",
    "edgeTypes",
    "defaultNodes",
    "defaultEdges",
    "onNodesChange",
    "onEdgesChange",
    "onConnect",
    "onNodeClick",
    "onNodeDrag",
    "onNodeDragStart",
    "onNodeDragStop",
    "onPaneClick",
    "fitView",
    "fitViewOptions",
    "minZoom",
    "maxZoom",
    "defaultZoom",
    "defaultPosition",
    "nodesDraggable",
    "panOnDrag",
    "panOnScroll",
    "zoomOnScroll",
    "zoomOnDoubleClick",
    "className",
    "style",
    "children",
  ]);

  const initialNodes = () => local.defaultNodes || local.nodes || [];
  const initialEdges = () => local.defaultEdges || local.edges || [];

  const store = createSolidFlowStore(initialNodes(), initialEdges());

  // 同步外部 nodes 和 edges
  createEffect(() => {
    if (local.nodes) {
      store.setStore("nodes", local.nodes);
    }
  });

  createEffect(() => {
    if (local.edges) {
      store.setStore("edges", local.edges);
    }
  });

  // 处理连接
  const handleConnect = (connection: Connection) => {
    if (!isValidConnection(connection, store.store.nodes, store.store.edges)) {
      return;
    }

    const newEdge: EdgeType = {
      id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source!,
      target: connection.target!,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    };

    store.addEdge(newEdge);
    local.onConnect?.(connection);
    local.onEdgesChange?.([{ type: "add", item: newEdge }]);
  };

  // 适应视图
  createEffect(() => {
    if (local.fitView && store.store.nodes.length > 0) {
      const nodes = store.store.nodes;
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

      const padding = local.fitViewOptions?.padding || 50;
      const width = maxX - minX + padding * 2;
      const height = maxY - minY + padding * 2;

      store.updateViewport({
        x: -minX + padding,
        y: -minY + padding,
        zoom: 1,
      });
    }
  });

  const contextValue = {
    store,
    nodeTypes: local.nodeTypes || {},
    edgeTypes: local.edgeTypes || {},
    props: local,
  };

  return (
    <SolidFlowProvider value={contextValue}>
      <SolidFlowInner
        {...local}
        store={store}
        onConnect={handleConnect}
        {...rest}
      />
    </SolidFlowProvider>
  );
}

function SolidFlowInner(props: SolidFlowProps & { store: ReturnType<typeof createSolidFlowStore> }) {
  const context = useSolidFlowContext();
  let containerRef: HTMLDivElement | undefined;
  let paneRef: HTMLDivElement | undefined;

  const viewport = () => context.store.store.viewport;
  const nodes = () => context.store.store.nodes;
  const edges = () => context.store.store.edges;

  // 拖拽处理
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let nodeDragStart: { node: NodeType; offset: { x: number; y: number } } | null = null;

  const handleMouseDown = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const nodeElement = target.closest("[data-node-id]");

    if (nodeElement && props.nodesDraggable !== false) {
      const nodeId = nodeElement.getAttribute("data-node-id");
      const node = nodes().find((n) => n.id === nodeId);
      if (node) {
        isDragging = true;
        dragStart = { x: event.clientX, y: event.clientY };
        nodeDragStart = {
          node,
          offset: {
            x: event.clientX - node.position.x,
            y: event.clientY - node.position.y,
          },
        };
        props.onNodeDragStart?.(event, node);
      }
    } else if (props.panOnDrag !== false) {
      isDragging = true;
      dragStart = { x: event.clientX, y: event.clientY };
    }
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging) return;

    if (nodeDragStart) {
      const newPosition = {
        x: event.clientX - nodeDragStart.offset.x,
        y: event.clientY - nodeDragStart.offset.y,
      };
      const updatedNode = { ...nodeDragStart.node, position: newPosition };
      context.store.updateNode(nodeDragStart.node.id, { position: newPosition });
      props.onNodeDrag?.(event, updatedNode);
      // 通知外部节点已更新
      props.onNodesChange?.([{ type: "position", id: nodeDragStart.node.id, position: newPosition }]);
    } else {
      const deltaX = event.clientX - dragStart.x;
      const deltaY = event.clientY - dragStart.y;
      context.store.updateViewport({
        x: viewport().x + deltaX,
        y: viewport().y + deltaY,
      });
      dragStart = { x: event.clientX, y: event.clientY };
    }
  };

  const handleMouseUp = (event: MouseEvent) => {
    if (isDragging && nodeDragStart) {
      const currentNode = context.store.store.nodes.find(n => n.id === nodeDragStart!.node.id);
      const updatedNode = currentNode ? { ...nodeDragStart!.node, position: currentNode.position } : nodeDragStart!.node;
      props.onNodeDragStop?.(event, updatedNode);
      // 通知外部节点拖拽结束
      if (currentNode) {
        props.onNodesChange?.([{ type: "position", id: nodeDragStart!.node.id, position: currentNode.position }]);
      }
      nodeDragStart = null;
    }
    isDragging = false;
  };

  // 滚轮缩放
  const handleWheel = (event: WheelEvent) => {
    if (props.zoomOnScroll !== false) {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(
        props.minZoom || 0.1,
        Math.min(props.maxZoom || 2, viewport().zoom + delta)
      );
      context.store.updateViewport({ zoom: newZoom });
    } else if (props.panOnScroll) {
      event.preventDefault();
      context.store.updateViewport({
        x: viewport().x - event.deltaX,
        y: viewport().y - event.deltaY,
      });
    }
  };

  // 双击缩放
  const handleDoubleClick = (event: MouseEvent) => {
    if (props.zoomOnDoubleClick !== false) {
      const newZoom = Math.min(viewport().zoom * 1.5, props.maxZoom || 2);
      context.store.updateViewport({ zoom: newZoom });
    }
  };

  onMount(() => {
    if (paneRef) {
      paneRef.addEventListener("mousedown", handleMouseDown);
      paneRef.addEventListener("wheel", handleWheel, { passive: false });
      paneRef.addEventListener("dblclick", handleDoubleClick);
    }
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  });

  onCleanup(() => {
    if (paneRef) {
      paneRef.removeEventListener("mousedown", handleMouseDown);
      paneRef.removeEventListener("wheel", handleWheel);
      paneRef.removeEventListener("dblclick", handleDoubleClick);
    }
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  });

  const handlePaneClick = (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest("[data-node-id]")) {
      return;
    }
    props.onPaneClick?.(event);
    context.store.clearSelection();
  };

  const handleNodeClick = (event: MouseEvent, node: NodeType) => {
    event.stopPropagation();
    props.onNodeClick?.(event, node);
    context.store.setSelectedNodes([node]);
  };

  return (
    <div
      ref={containerRef}
      class={`solid-flow ${props.className || ""}`}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        ...props.style,
      }}
    >
      <div
        ref={paneRef}
        class="solid-flow__pane"
        style={{
          width: "100%",
          height: "100%",
          transform: `translate(${viewport().x}px, ${viewport().y}px) scale(${viewport().zoom})`,
          transformOrigin: "0 0",
        }}
        onClick={handlePaneClick}
      >
        {/* 边 */}
        <svg
          class="solid-flow__edges"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          <defs>
            <marker
              id="solid-flow__arrowclosed"
              markerWidth="12"
              markerHeight="12"
              refX="6"
              refY="6"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M 0 0 L 12 6 L 0 12 z" fill="#b1b1b7" />
            </marker>
          </defs>
          <For each={edges()}>
            {(edge) => (
              <Edge
                edge={edge}
                nodes={nodes()}
                selected={
                  edge.selected !== undefined
                    ? edge.selected
                    : context.store.store.selectedEdges.some((e) => e.id === edge.id)
                }
              />
            )}
          </For>
        </svg>

        {/* 节点 */}
        <For each={nodes()}>
          {(node) => (
            <Node
              node={node}
              selected={context.store.store.selectedNodes.some((n) => n.id === node.id)}
              dragging={node.dragging}
            />
          )}
        </For>
      </div>

      {/* 子组件（Controls, MiniMap, Panel, Background 等） */}
      {props.children}
    </div>
  );
}

