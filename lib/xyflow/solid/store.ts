/**
 * xyflow SolidJS 版本 Store
 * 管理节点、边和视口状态
 */

import { createStore } from "solid-js/store";
import type { Node, Edge, Viewport, Connection } from "./types";

export interface SolidFlowStore {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  connectionStart: Connection | null;
  connectionEnd: { x: number; y: number } | null;
  selectedNodes: Node[];
  selectedEdges: Edge[];
}

export function createSolidFlowStore(initialNodes: Node[] = [], initialEdges: Edge[] = []) {
  const [store, setStore] = createStore<SolidFlowStore>({
    nodes: initialNodes,
    edges: initialEdges,
    viewport: {
      x: 0,
      y: 0,
      zoom: 1,
    },
    connectionStart: null,
    connectionEnd: null,
    selectedNodes: [],
    selectedEdges: [],
  });

  return {
    store,
    setStore,
    // 节点操作
    addNode: (node: Node) => {
      setStore("nodes", (nodes) => [...nodes, node]);
    },
    updateNode: (id: string, updates: Partial<Node>) => {
      setStore("nodes", (nodes) =>
        nodes.map((node) => (node.id === id ? { ...node, ...updates } : node))
      );
    },
    removeNode: (id: string) => {
      setStore("nodes", (nodes) => nodes.filter((node) => node.id !== id));
      // 同时移除相关的边
      setStore("edges", (edges) =>
        edges.filter((edge) => edge.source !== id && edge.target !== id)
      );
    },
    // 边操作
    addEdge: (edge: Edge) => {
      setStore("edges", (edges) => [...edges, edge]);
    },
    updateEdge: (id: string, updates: Partial<Edge>) => {
      setStore("edges", (edges) =>
        edges.map((edge) => (edge.id === id ? { ...edge, ...updates } : edge))
      );
    },
    removeEdge: (id: string) => {
      setStore("edges", (edges) => edges.filter((edge) => edge.id !== id));
    },
    // 视口操作
    setViewport: (viewport: Viewport) => {
      setStore("viewport", viewport);
    },
    updateViewport: (updates: Partial<Viewport>) => {
      setStore("viewport", (viewport) => ({ ...viewport, ...updates }));
    },
    // 连接操作
    setConnectionStart: (connection: Connection | null) => {
      setStore("connectionStart", connection);
    },
    setConnectionEnd: (position: { x: number; y: number } | null) => {
      setStore("connectionEnd", position);
    },
    // 选择操作
    setSelectedNodes: (nodes: Node[]) => {
      setStore("selectedNodes", nodes);
    },
    setSelectedEdges: (edges: Edge[]) => {
      setStore("selectedEdges", edges);
    },
    clearSelection: () => {
      setStore("selectedNodes", []);
      setStore("selectedEdges", []);
    },
  };
}

export type SolidFlowStoreType = ReturnType<typeof createSolidFlowStore>;

