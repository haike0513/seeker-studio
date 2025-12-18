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
} from "solid-js";
import { SolidFlowProvider, useSolidFlowContext } from "./context";
import { createSolidFlowStore } from "./store";
import { Node } from "./Node";
import { Edge } from "./Edge";
import type { SolidFlowProps, Node as NodeType, Edge as EdgeType, Connection } from "./types";
import { isValidConnection } from "./utils";

interface Viewport {
  x: number;
  y: number;
  zoom: number;
}
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
    "connectionMode",
    "connectionRadius",
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
    const connectionMode = local.connectionMode || "loose";
    const connectionRadius = local.connectionRadius || 20;
    
    if (!isValidConnection(connection, store.store.nodes, store.store.edges, connectionMode, connectionRadius)) {
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
      // 等待 DOM 更新后再计算
      setTimeout(() => {
        const nodes = store.store.nodes.filter((n) => !n.hidden || local.fitViewOptions?.includeHiddenNodes);
        if (nodes.length === 0) return;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const node of nodes) {
          const width = node.width || 150;
          const height = node.height || 40;
          minX = Math.min(minX, node.position.x);
          minY = Math.min(minY, node.position.y);
          maxX = Math.max(maxX, node.position.x + width);
          maxY = Math.max(maxY, node.position.y + height);
        }

        const padding = local.fitViewOptions?.padding || 50;
        const minZoom = local.fitViewOptions?.minZoom || 0.1;
        const maxZoom = local.fitViewOptions?.maxZoom || 2;

        // 计算容器尺寸（需要从 DOM 获取）
        const container = document.querySelector(".solid-flow");
        if (!container) return;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const contentWidth = maxX - minX;
        const contentHeight = maxY - minY;

        // 计算合适的缩放比例
        const scaleX = (containerWidth - padding * 2) / contentWidth;
        const scaleY = (containerHeight - padding * 2) / contentHeight;
        const scale = Math.min(scaleX, scaleY, maxZoom);
        const zoom = Math.max(scale, minZoom);

        // 计算居中位置
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const x = containerWidth / 2 - centerX * zoom;
        const y = containerHeight / 2 - centerY * zoom;

        store.updateViewport({
          x,
          y,
          zoom,
        });
      }, 0);
    }
  });

  return (
    <SolidFlowProvider
      value={{
        store,
        nodeTypes: () => local.nodeTypes || {},
        edgeTypes: () => local.edgeTypes || {},
        props: local,
      }}
    >
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

  // 更新 DOM 上的视口信息
  createEffect(() => {
    if (paneRef) {
      (paneRef as HTMLElement & { __viewport?: Viewport }).__viewport = viewport();
    }
  });

  // 拖拽处理
  let isDragging = false;
  let hasMoved = false; // 标记是否真的发生了移动
  let dragStart = { x: 0, y: 0 };
  let nodeDragStart: { node: NodeType; offset: { x: number; y: number } } | null = null;
  const DRAG_THRESHOLD = 5; // 拖拽阈值，超过这个距离才认为是拖拽

  const handleMouseDown = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const nodeElement = target.closest("[data-node-id]");

    if (nodeElement && props.nodesDraggable !== false) {
      const nodeId = nodeElement.getAttribute("data-node-id");
      const node = nodes().find((n) => n.id === nodeId);
      if (node) {
        // 不立即设置 isDragging，等待鼠标移动
        // 这样可以让节点的 onClick 正常触发
        hasMoved = false;
        dragStart = { x: event.clientX, y: event.clientY };
        nodeDragStart = {
          node,
          offset: {
            x: event.clientX - node.position.x,
            y: event.clientY - node.position.y,
          },
        };
        // 不立即调用 onNodeDragStart，等真正开始拖拽时再调用
      }
    } else if (props.panOnDrag !== false) {
      isDragging = true;
      hasMoved = false;
      dragStart = { x: event.clientX, y: event.clientY };
      const currentViewport = viewport();
      props.onMoveStart?.(event, currentViewport);
    }
  };

  const handleMouseMove = (event: MouseEvent) => {
    // 如果 nodeDragStart 存在但还没有开始拖拽，检查是否需要开始拖拽
    if (nodeDragStart && !isDragging) {
      const deltaX = Math.abs(event.clientX - dragStart.x);
      const deltaY = Math.abs(event.clientY - dragStart.y);
      if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
        // 开始拖拽
        isDragging = true;
        hasMoved = true;
        props.onNodeDragStart?.(event, nodeDragStart.node);
      }
    }

    if (!isDragging) return;

    // 检查是否移动超过阈值
    const deltaX = Math.abs(event.clientX - dragStart.x);
    const deltaY = Math.abs(event.clientY - dragStart.y);
    if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
      hasMoved = true;
    }

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
      const newViewport = {
        x: viewport().x + deltaX,
        y: viewport().y + deltaY,
        zoom: viewport().zoom,
      };
      context.store.updateViewport(newViewport);
      props.onMove?.(event, newViewport);
      dragStart = { x: event.clientX, y: event.clientY };
    }
  };

  const handleMouseUp = (event: MouseEvent) => {
    if (isDragging && nodeDragStart) {
      // 如果没有移动，认为是点击事件
      if (!hasMoved) {
        // 触发节点点击事件
        handleNodeClick(event, nodeDragStart.node);
      } else {
        // 真正的拖拽结束
        const currentNode = context.store.store.nodes.find(n => n.id === nodeDragStart!.node.id);
        const updatedNode = currentNode ? { ...nodeDragStart!.node, position: currentNode.position } : nodeDragStart!.node;
        props.onNodeDragStop?.(event, updatedNode);
        // 通知外部节点拖拽结束
        if (currentNode) {
          props.onNodesChange?.([{ type: "position", id: nodeDragStart!.node.id, position: currentNode.position }]);
        }
      }
      nodeDragStart = null;
    } else if (isDragging && !nodeDragStart) {
      // 画布拖拽结束
      const currentViewport = viewport();
      props.onMoveEnd?.(event, currentViewport);
    }
    isDragging = false;
    hasMoved = false;
  };

  // 滚轮缩放
  const handleWheel = (event: WheelEvent) => {
    props.onPaneScroll?.(event);
    
    if (props.zoomOnScroll !== false) {
      event.preventDefault();
      
      // 获取鼠标位置相对于容器的坐标
      const rect = paneRef?.getBoundingClientRect();
      if (!rect) return;
      
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      // 计算缩放前后的世界坐标
      const worldX = (mouseX - viewport().x) / viewport().zoom;
      const worldY = (mouseY - viewport().y) / viewport().zoom;
      
      // 计算新的缩放值
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(
        props.minZoom || 0.1,
        Math.min(props.maxZoom || 2, viewport().zoom * zoomFactor)
      );
      
      // 调整视口位置，使鼠标位置保持在世界坐标中的同一位置
      const newX = mouseX - worldX * newZoom;
      const newY = mouseY - worldY * newZoom;
      
      const newViewport = {
        x: newX,
        y: newY,
        zoom: newZoom,
      };
      
      context.store.updateViewport(newViewport);
      props.onMove?.(event, newViewport);
    } else if (props.panOnScroll) {
      event.preventDefault();
      const newViewport = {
        x: viewport().x - event.deltaX,
        y: viewport().y - event.deltaY,
        zoom: viewport().zoom,
      };
      context.store.updateViewport(newViewport);
      props.onMove?.(event, newViewport);
    }
  };

  // 双击缩放
  const handleDoubleClick = (_event: MouseEvent) => {
    if (props.zoomOnDoubleClick !== false) {
      const newZoom = Math.min(viewport().zoom * 1.5, props.maxZoom || 2);
      context.store.updateViewport({ zoom: newZoom });
    }
  };

  // 处理画布鼠标移动
  const handlePaneMouseMove = (event: MouseEvent) => {
    props.onPaneMouseMove?.(event);
  };

  onMount(() => {
    if (paneRef) {
      paneRef.addEventListener("mousedown", handleMouseDown);
      paneRef.addEventListener("wheel", handleWheel, { passive: false });
      paneRef.addEventListener("dblclick", handleDoubleClick);
      paneRef.addEventListener("mousemove", handlePaneMouseMove);
      paneRef.addEventListener("contextmenu", (e) => {
        if (!(e.target as HTMLElement).closest("[data-node-id]")) {
          props.onPaneContextMenu?.(e);
        }
      });
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
    if ((event.target as HTMLElement).closest(".solid-flow__edge-path")) {
      return;
    }
    props.onPaneClick?.(event);
    context.store.clearSelection();
    props.onSelectionChange?.({ nodes: [], edges: [] });
  };

  const handleNodeClick = (event: MouseEvent, node: NodeType) => {
    event.stopPropagation();
    props.onNodeClick?.(event, node);
    context.store.setSelectedNodes([node]);
    props.onSelectionChange?.({ 
      nodes: [node], 
      edges: context.store.store.selectedEdges 
    });
  };

  // 更新 context 以包含 handleNodeClick
  const contextValueWithHandlers = {
    ...context,
    handleNodeClick,
  };

  return (
    <SolidFlowProvider value={contextValueWithHandlers}>
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
          ref={(el) => {
            paneRef = el;
            if (el) {
              // 存储视口信息到 DOM，方便工具函数访问
              (el as HTMLElement & { __viewport?: Viewport }).__viewport = viewport();
            }
          }}
          class="solid-flow__pane"
          style={{
            width: "100%",
            height: "100%",
            transform: `translate(${viewport().x}px, ${viewport().y}px) scale(${viewport().zoom})`,
            "transform-origin": "0 0",
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
              "pointer-events": "none",
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
              <marker
                id="solid-flow__arrowclosed-temp"
                markerWidth="12"
                markerHeight="12"
                refX="6"
                refY="6"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M 0 0 L 12 6 L 0 12 z" fill="#007bff" />
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
            {/* 临时连接线 */}
            <Show when={context.store.store.connectionStart && context.store.store.connectionEnd}>
              <ConnectionLine
                connectionStart={context.store.store.connectionStart!}
                connectionEnd={context.store.store.connectionEnd!}
                nodes={nodes()}
              />
            </Show>
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
    </SolidFlowProvider>
  );
}

/**
 * 临时连接线组件
 */
function ConnectionLine(props: {
  connectionStart: Connection;
  connectionEnd: { x: number; y: number };
  nodes: NodeType[];
}) {
  const sourceNode = () => props.nodes.find((n) => n.id === props.connectionStart.source);
  
  const path = () => {
    const node = sourceNode();
    if (!node) return "";
    
    // 简化计算，直接使用节点中心位置
    const nodeWidth = node.width || 150;
    const nodeHeight = node.height || 40;
    const sourceX = node.position.x + nodeWidth / 2;
    const sourceY = node.position.y + nodeHeight;
    
    const midY = (sourceY + props.connectionEnd.y) / 2;
    return `M ${sourceX} ${sourceY} C ${sourceX} ${midY}, ${props.connectionEnd.x} ${midY}, ${props.connectionEnd.x} ${props.connectionEnd.y}`;
  };
  
  return (
    <Show when={sourceNode()}>
      <path
        class="solid-flow__edge-path solid-flow__edge-temp"
        d={path()}
        stroke="#007bff"
        stroke-width="2"
        stroke-dasharray="5,5"
        fill="none"
        marker-end="url(#solid-flow__arrowclosed-temp)"
      />
    </Show>
  );
}

