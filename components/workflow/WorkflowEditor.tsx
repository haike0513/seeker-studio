/**
 * 工作流编辑器组件
 */

import { createSignal, Show, createEffect, onMount, onCleanup } from "solid-js";
import {
  SolidFlow,
  Controls,
  Background,
  MiniMap,
  type Connection,
} from "@/lib/xyflow/solid";
import { Button } from "@/registry/ui/button";
import { toast } from "somoto";
import type { Workflow, WorkflowNode, WorkflowEdge } from "@/types/workflow";
import { WorkflowNodePanel } from "./WorkflowNodePanel";
import { WorkflowConfigPanel } from "./WorkflowConfigPanel";
import { WorkflowExecutionButton } from "./WorkflowExecutionButton";
import { getWorkflowNodeDefinition } from "./nodeRegistry";
import { createWorkflowEditorStore } from "./workflowEditorStore";
import { WorkflowNode as WorkflowNodeComponent } from "./WorkflowNode";

interface WorkflowEditorProps {
  workflowId?: string;
  initialWorkflow?: Workflow & { nodes: WorkflowNode[]; edges: WorkflowEdge[] };
  onSave?: (workflow: { nodes: WorkflowNode[]; edges: WorkflowEdge[] }) => void;
  showToolbar?: boolean;
  onNodeSelect?: (node: WorkflowNode | null) => void;
  selectedNode?: WorkflowNode | null;
  onAddNode?: (type: WorkflowNode["type"], position?: { x: number; y: number }) => void;
}

export function WorkflowEditor(props: WorkflowEditorProps) {
  const {
    nodes,
    setNodes,
    edges,
    setEdges,
    selectedNode,
    setSelectedNode,
    showNodePanel,
    setShowNodePanel,
    showConfigPanel,
    setShowConfigPanel,
  } = createWorkflowEditorStore({
    workflowId: props.workflowId,
    initialWorkflow: props.initialWorkflow,
  });
  const [saving, setSaving] = createSignal(false);
  const [selectedEdgeId, setSelectedEdgeId] = createSignal<string | null>(null);
  let canvasRef: HTMLDivElement | undefined;

  // 处理键盘删除操作
  const handleKeyDown = (event: KeyboardEvent) => {
    // 如果按下Delete键且选中了连线，则删除连线
    if ((event.key === "Delete" || event.key === "Backspace") && selectedEdgeId()) {
      event.preventDefault();
      const edgeId = selectedEdgeId();
      if (edgeId) {
        setEdges((prev) => prev.filter((e) => e.id !== edgeId));
        // 从初始工作流中删除
        if (props.initialWorkflow) {
          props.initialWorkflow.edges = (props.initialWorkflow.edges || []).filter(
            (e) => e.id !== edgeId
          );
        }
        setSelectedEdgeId(null);
        toast.success("连线已删除");
      }
    }
  };

  onMount(() => {
    window.addEventListener("keydown", handleKeyDown);
  });

  onCleanup(() => {
    window.removeEventListener("keydown", handleKeyDown);
  });

  const handleNodeClick = (nodeId: string) => {
    const node = nodes().find((n) => n.id === nodeId);
    if (!node) {
      props.onNodeSelect?.(null);
      return;
    }

    // 优先从initialWorkflow中查找完整节点信息
    let fullNode = props.initialWorkflow?.nodes?.find((n) => n.id === nodeId);
    
    // 如果找不到，尝试从当前selectedNode中查找（可能是之前选中过但还没保存的节点）
    if (!fullNode && selectedNode()?.id === nodeId) {
      fullNode = selectedNode()!;
    }
    
    // 如果还是没有，从节点数据构建一个基本节点对象
    if (!fullNode) {
      const nodeData = node.data as { title?: string; [key: string]: any };
      // 尝试从节点数据中获取更多信息
      fullNode = {
        id: node.id,
        workflowId: props.workflowId || "",
        type: node.type as WorkflowNode["type"],
        title: nodeData?.title || getNodeDefaultTitle(node.type as WorkflowNode["type"]),
        position: node.position as { x: number; y: number },
        config: nodeData?.config || getNodeDefaultConfig(node.type as WorkflowNode["type"]),
        data: nodeData,
        createdAt: nodeData?.createdAt ? new Date(nodeData.createdAt) : new Date(),
        updatedAt: new Date(),
      } as WorkflowNode;
    }

    // 确保节点信息完整
    if (fullNode) {
      // 同步节点的最新位置
      fullNode.position = node.position as { x: number; y: number };
      
      // 同步节点的最新标题（从nodes中获取）
      const nodeData = node.data as { title?: string };
      if (nodeData?.title && nodeData.title !== fullNode.title) {
        fullNode.title = nodeData.title;
      }

      setSelectedNode(fullNode);
      setShowConfigPanel(true);
      // 通知外部组件节点已选中
      props.onNodeSelect?.(fullNode);
      
      // 调试输出
      console.log("Node selected:", {
        nodeId: nodeId,
        fullNode,
        hasInitialWorkflow: !!props.initialWorkflow,
        initialNodesCount: props.initialWorkflow?.nodes?.length || 0,
      });
    }
  };

  const handleAddNode = (
    nodeType: WorkflowNode["type"],
    position?: { x: number; y: number },
  ) => {
    const definition = getWorkflowNodeDefinition(nodeType);

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      workflowId: props.workflowId || "",
      type: nodeType,
      title:
        definition?.createDefaultTitle?.() ??
        getNodeDefaultTitle(nodeType),
      position:
        position ?? {
          x: Math.random() * 400,
          y: Math.random() * 400,
        },
      config:
        (definition?.createDefaultConfig?.() as WorkflowNode["config"]) ??
        getNodeDefaultConfig(nodeType),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 将新节点加入当前工作流的节点列表中，便于后续配置与保存
    if (props.initialWorkflow) {
      props.initialWorkflow.nodes = [...props.initialWorkflow.nodes, newNode];
    }

    setNodes((prev) => [
      ...prev,
      {
        id: newNode.id,
        type: newNode.type,
        data: { title: newNode.title },
        position: newNode.position,
      },
    ]);

    // 默认选中新创建的节点并打开配置面板，提升编辑体验
    setSelectedNode(newNode);
    setShowConfigPanel(true);
    // 通知外部组件节点已创建并选中
    props.onNodeSelect?.(newNode);
    // 如果外部提供了添加节点的回调，也调用它
    props.onAddNode?.(nodeType, position);
  };
  
  // 监听外部selectedNode变化，同步内部状态
  createEffect(() => {
    if (props.selectedNode) {
      // 如果外部传入的selectedNode与内部不同，更新内部状态
      const currentNode = selectedNode();
      if (!currentNode || currentNode.id !== props.selectedNode.id) {
        setSelectedNode(props.selectedNode);
        setShowConfigPanel(true);
      }
    } else if (props.selectedNode === null) {
      // 外部明确设置为null，清除选中
      setSelectedNode(null);
      setShowConfigPanel(false);
    }
  });

  const handleConnect = (connection: Connection) => {
    // 当用户通过连接点创建连线时触发
    if (!connection || !connection.source || !connection.target) return;

    // 检查是否连接到自身
    if (connection.source === connection.target) {
      toast.error("不能连接到自身");
      return;
    }

    // 检查是否已存在相同的连接
    const existingEdge = edges().find(
      (e) =>
        e.source === connection.source &&
        e.target === connection.target &&
        e.sourceHandle === connection.sourceHandle &&
        e.targetHandle === connection.targetHandle,
    );

    if (existingEdge) {
      toast.error("该连接已存在");
      return;
    }

    const newEdge: WorkflowEdge = {
      id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
      workflowId: props.workflowId || "",
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle || undefined,
      targetHandle: connection.targetHandle || undefined,
      config: {},
      createdAt: new Date(),
    };

    // 更新初始工作流中的edges（如果存在）
    if (props.initialWorkflow) {
      props.initialWorkflow.edges = [...(props.initialWorkflow.edges || []), newEdge];
    }

    setEdges((prev) => [
      ...prev,
      {
        id: newEdge.id,
        source: newEdge.source,
        target: newEdge.target,
        sourceHandle: newEdge.sourceHandle,
        targetHandle: newEdge.targetHandle,
      },
    ]);

    toast.success("连接已创建");
  };

  const handleEdgeClick = (event: MouseEvent, edge: { id: string }) => {
    // 点击连线时，选中连线（可以通过Delete键删除）
    event.stopPropagation();
    setSelectedEdgeId(edge.id);
  };

  const handlePaneClick = () => {
    // 点击画布空白处，取消选中节点和连线
    setSelectedNode(null);
    setShowConfigPanel(false);
    setSelectedEdgeId(null);
    props.onNodeSelect?.(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const workflowData = {
        nodes: nodes().map((n) => {
          const fullNode = props.initialWorkflow?.nodes.find((fn) => fn.id === n.id);
          return {
            id: n.id,
            workflowId: props.workflowId || "",
            type: n.type as WorkflowNode["type"],
            title: (n.data as { title?: string })?.title || "",
            position: n.position as { x: number; y: number },
            config: fullNode?.config,
            data: n.data,
            createdAt: fullNode?.createdAt || new Date(),
            updatedAt: new Date(),
          };
        }),
        edges: edges().map((e) => ({
          id: e.id,
          workflowId: props.workflowId || "",
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          config: {},
          createdAt: new Date(),
        })),
      };

      if (props.workflowId) {
        // 更新工作流
        const response = await fetch(`/api/workflows/${props.workflowId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            nodes: workflowData.nodes.map((n) => ({
              type: n.type,
              title: n.title,
              position: n.position,
              config: n.config,
              data: n.data,
            })),
            edges: workflowData.edges.map((e) => ({
              source: e.source,
              target: e.target,
              sourceHandle: e.sourceHandle,
              targetHandle: e.targetHandle,
              config: e.config,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error("保存失败");
        }
      }

      props.onSave?.(workflowData);
      toast.success("工作流保存成功！");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="flex flex-col h-full">
      {/* 工具栏 - 可选显示 */}
      <Show when={props.showToolbar !== false}>
        <div class="flex items-center justify-between p-4 border-b">
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowNodePanel(!showNodePanel())}
            >
              {showNodePanel() ? "隐藏" : "显示"}节点面板
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowConfigPanel(!showConfigPanel())}
              disabled={!selectedNode()}
            >
              配置节点
            </Button>
          </div>
          <div class="flex items-center gap-2">
            <Show when={props.workflowId}>
              <WorkflowExecutionButton workflowId={props.workflowId!} />
            </Show>
            <Button onClick={handleSave} disabled={saving()}>
              {saving() ? "保存中..." : "保存"}
            </Button>
          </div>
        </div>
      </Show>

      {/* 主编辑区域 */}
      <div class="flex-1 relative min-h-0">
        <div
          ref={canvasRef}
          class="h-full w-full"
          onDragOver={(event) => {
            // 允许节点从面板拖拽到画布上
            event.preventDefault();
            if (event.dataTransfer) {
              event.dataTransfer.dropEffect = "copy";
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            const dt = event.dataTransfer;
            // 优先读取自定义 MIME 类型，读取不到时回退到 text/plain
            const type =
              dt?.getData("application/x-workflow-node-type") ||
              dt?.getData("text/plain");
            if (!type) return;

            const rect = canvasRef?.getBoundingClientRect();
            const position = rect
              ? {
                  x: event.clientX - rect.left,
                  y: event.clientY - rect.top,
                }
              : undefined;

            handleAddNode(type as WorkflowNode["type"], position);
          }}
        >
          <SolidFlow
            nodes={nodes()}
            edges={edges().map((e) => ({
              ...e,
              selected: e.id === selectedEdgeId(),
            }))}
            fitView
            nodeTypes={{
              // 注册所有节点类型使用自定义组件
              start: WorkflowNodeComponent,
              end: WorkflowNodeComponent,
              llm: WorkflowNodeComponent,
              condition: WorkflowNodeComponent,
              http: WorkflowNodeComponent,
              code: WorkflowNodeComponent,
              parameter: WorkflowNodeComponent,
              template: WorkflowNodeComponent,
              knowledge_retrieval: WorkflowNodeComponent,
              comment: WorkflowNodeComponent,
              delay: WorkflowNodeComponent,
              sub_workflow: WorkflowNodeComponent,
            }}
            onNodeClick={(event, node) => {
              setSelectedEdgeId(null); // 点击节点时取消选中连线
              handleNodeClick(node.id);
            }}
            onNodeDrag={(event, node) => {
              // 当节点拖拽时，同步更新 nodes signal
              setNodes((prev) =>
                prev.map((n) =>
                  n.id === node.id
                    ? { ...n, position: node.position as { x: number; y: number } }
                    : n,
                ),
              );
            }}
            onNodeDragStop={(event, node) => {
              // 当节点拖拽结束时，同步更新初始工作流中的位置
              setNodes((prev) =>
                prev.map((n) =>
                  n.id === node.id
                    ? { ...n, position: node.position as { x: number; y: number } }
                    : n,
                ),
              );
              if (props.initialWorkflow) {
                const nodeIndex = props.initialWorkflow.nodes.findIndex(
                  (n) => n.id === node.id,
                );
                if (nodeIndex >= 0) {
                  props.initialWorkflow.nodes[nodeIndex].position =
                    node.position as { x: number; y: number };
                }
              }
            }}
            onConnect={handleConnect}
            onEdgeClick={handleEdgeClick}
            onPaneClick={handlePaneClick}
            nodesDraggable
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" />
          </SolidFlow>
        </div>

        {/* 节点面板 - 仅在没有外部布局时显示 */}
        <Show when={props.showToolbar !== false && showNodePanel()}>
          <WorkflowNodePanel
            onAddNode={handleAddNode}
            onClose={() => setShowNodePanel(false)}
          />
        </Show>

        {/* 配置面板 - 仅在没有外部布局时显示 */}
        <Show when={props.showToolbar !== false && showConfigPanel() && selectedNode()}>
          <WorkflowConfigPanel
            node={selectedNode()!}
            onClose={() => {
              setShowConfigPanel(false);
              setSelectedNode(null);
              props.onNodeSelect?.(null);
            }}
            onUpdate={(updatedNode) => {
              // 更新节点
              setNodes((prev) =>
                prev.map((n) =>
                  n.id === updatedNode.id
                    ? {
                        ...n,
                        data: { ...n.data, title: updatedNode.title },
                      }
                    : n,
                ),
              );
              // 更新初始工作流中的节点（如果存在）
              if (props.initialWorkflow) {
                const index = props.initialWorkflow.nodes.findIndex(
                  (n) => n.id === updatedNode.id,
                );
                if (index >= 0) {
                  props.initialWorkflow.nodes[index] = updatedNode;
                }
              }
              setSelectedNode(updatedNode);
              props.onNodeSelect?.(updatedNode);
            }}
          />
        </Show>
      </div>
    </div>
  );
}

// 辅助函数
function getNodeDefaultTitle(type: WorkflowNode["type"]): string {
  const titles: Record<WorkflowNode["type"], string> = {
    start: "开始",
    end: "结束",
    llm: "LLM 节点",
    condition: "条件判断",
    http: "HTTP 请求",
    code: "代码执行",
    parameter: "参数提取",
    template: "模板转换",
  };
  return titles[type] || "节点";
}

function getNodeDefaultConfig(
  type: WorkflowNode["type"],
): WorkflowNode["config"] {
  switch (type) {
    case "llm":
      return {
        model: "gpt-4o",
        temperature: 0.7,
        maxTokens: 1000,
      };
    case "condition":
      return {
        condition: "{{input.value}} > 0",
        trueLabel: "是",
        falseLabel: "否",
      };
    case "http":
      return {
        method: "GET",
        url: "https://api.example.com",
      };
    case "code":
      return {
        language: "javascript",
        code: "// 在这里编写代码\nreturn input;",
      };
    case "parameter":
      return {
        parameters: [],
      };
    case "template":
      return {
        template: "{{input.text}}",
        outputFormat: "text",
      };
    default:
      return undefined;
  }
}
