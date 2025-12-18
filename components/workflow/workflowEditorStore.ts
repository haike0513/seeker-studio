/**
 * Workflow 编辑器状态管理（前端单页内的 UI & 图数据状态）
 *
 * 说明：
 * - 目前主要负责 SolidFlow 节点/连线，以及「选中节点/面板开关」等 UI 状态
 * - 后续可以在这里逐步扩展：多选、连线模式、撤销重做、校验结果等
 */

import { createSignal, type Accessor, type Setter } from "solid-js";
import type { Node, Edge } from "@/lib/xyflow/solid";
import type { Workflow, WorkflowNode, WorkflowEdge } from "@/types/workflow";

export interface WorkflowEditorStoreOptions {
  workflowId?: string;
  initialWorkflow?: Workflow & {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
}

export interface WorkflowEditorStore {
  // SolidFlow 节点/边 store
  nodes: Accessor<Node[]>;
  setNodes: (updater: (prev: Node[]) => Node[]) => void;
  edges: Accessor<Edge[]>;
  setEdges: (updater: (prev: Edge[]) => Edge[]) => void;

  // 选中节点（域模型）
  selectedNode: Accessor<WorkflowNode | null>;
  setSelectedNode: Setter<WorkflowNode | null>;

  // UI 状态：面板开关
  showNodePanel: Accessor<boolean>;
  setShowNodePanel: Setter<boolean>;
  showConfigPanel: Accessor<boolean>;
  setShowConfigPanel: Setter<boolean>;
}

export function createWorkflowEditorStore(
  options: WorkflowEditorStoreOptions,
): WorkflowEditorStore {
  // 初始化节点和边数据
  const initialNodes: Node[] = options.initialWorkflow
    ? options.initialWorkflow.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        data: { ...n.data, title: n.title },
        position: n.position,
      }))
    : [];

  const initialEdges: Edge[] = options.initialWorkflow
    ? options.initialWorkflow.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || null,
        targetHandle: e.targetHandle || null,
      }))
    : [];

  const [nodes, setNodesInternal] = createSignal<Node[]>(initialNodes);
  const [edges, setEdgesInternal] = createSignal<Edge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = createSignal<WorkflowNode | null>(null);
  const [showNodePanel, setShowNodePanel] = createSignal(false);
  const [showConfigPanel, setShowConfigPanel] = createSignal(false);

  return {
    nodes,
    setNodes: (updater) => {
      setNodesInternal((prev) => updater(prev));
    },
    edges,
    setEdges: (updater) => {
      setEdgesInternal((prev) => updater(prev));
    },
    selectedNode,
    setSelectedNode,
    showNodePanel,
    setShowNodePanel,
    showConfigPanel,
    setShowConfigPanel,
  };
}


