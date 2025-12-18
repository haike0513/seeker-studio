/**
 * 工作流属性面板 - 右侧侧边栏
 */

import { createSignal, createEffect, Show } from "solid-js";
import { Button } from "@/registry/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/ui/card";
import { Separator } from "@/registry/ui/separator";
import { toast } from "somoto";
import type { Workflow, WorkflowNode } from "@/types/workflow";
import { getWorkflowNodeDefinition, type NodeConfigComponent } from "./nodeRegistry";

interface WorkflowPropertiesPanelProps {
  node: WorkflowNode | null;
  workflow: Workflow;
  onUpdate: (node: WorkflowNode) => void;
  onClose: () => void;
}

export function WorkflowPropertiesPanel(props: WorkflowPropertiesPanelProps) {
  const [title, setTitle] = createSignal(props.node?.title || "");
  const [config, setConfig] = createSignal(props.node?.config);

  createEffect(() => {
    if (props.node) {
      // 当节点变化时，更新表单数据
      const nodeTitle = props.node.title || "";
      const nodeConfig = props.node.config || {};
      
      setTitle(nodeTitle);
      setConfig(nodeConfig);
      
      // 调试输出
      console.log("PropertiesPanel: Node updated", {
        nodeId: props.node.id,
        nodeType: props.node.type,
        title: nodeTitle,
        hasConfig: !!nodeConfig,
        configKeys: Object.keys(nodeConfig),
      });
    } else {
      // 当节点为null时，清空表单数据
      setTitle("");
      setConfig(undefined);
      console.log("PropertiesPanel: Node cleared");
    }
  });

  const handleSave = async () => {
    if (!props.node || !props.workflow.id) return;
    
    try {
      // 更新workflow中的节点
      const updatedNodes = props.workflow.nodes?.map((n) =>
        n.id === props.node!.id
          ? {
              ...props.node!,
              title: title(),
              config: config(),
              updatedAt: new Date(),
            }
          : n
      ) || [];

      const response = await fetch(`/api/workflows/${props.workflow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nodes: updatedNodes.map((n) => ({
            type: n.type,
            title: n.title,
            position: n.position,
            config: n.config,
            data: n.data,
          })),
          edges: props.workflow.edges?.map((e) => ({
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
            config: e.config,
          })) || [],
        }),
      });

      if (!response.ok) throw new Error("保存失败");
      
      const updatedNode: WorkflowNode = {
        ...props.node,
        title: title(),
        config: config(),
        updatedAt: new Date(),
      };
      
      props.onUpdate(updatedNode);
      toast.success("节点已更新");
    } catch (error) {
      console.error("Update node error:", error);
      toast.error("保存失败");
    }
  };

  const renderConfigEditor = () => {
    if (!props.node) return null;
    
    const def = getWorkflowNodeDefinition(props.node.type);
    const ConfigComponent = def?.ConfigComponent as NodeConfigComponent<any> | undefined;

    if (!ConfigComponent) {
      return <div class="text-sm text-muted-foreground">此节点类型无需配置</div>;
    }

    return (
      <ConfigComponent
        config={config() as any}
        onUpdate={setConfig}
      />
    );
  };

  return (
    <div class="h-full flex flex-col bg-background border-l">
      <Show
        when={props.node}
        fallback={
          <div class="flex-1 flex items-center justify-center p-8">
            <div class="text-center space-y-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-12 w-12 mx-auto text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <p class="text-sm text-muted-foreground">选择一个节点以查看和编辑其属性</p>
            </div>
          </div>
        }
      >
        <div class="flex-1 flex flex-col overflow-hidden">
          {/* 标题栏 */}
          <div class="p-4 border-b space-y-2">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">属性面板</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  props.onClose();
                }}
                class="h-8 w-8 p-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <div class="text-xs text-muted-foreground">
              {props.node!.type}
            </div>
          </div>

          {/* 内容区域 */}
          <div class="flex-1 overflow-y-auto p-4 space-y-6">
            {/* 节点标题 */}
            <div class="space-y-2">
              <label class="text-sm font-medium">节点标题</label>
              <input
                type="text"
                value={title()}
                onInput={(e) => setTitle(e.currentTarget.value)}
                class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="输入节点标题..."
              />
            </div>

            <Separator />

            {/* 节点配置 */}
            <div class="space-y-2">
              <label class="text-sm font-medium">节点配置</label>
              <div class="min-h-[200px]">
                {renderConfigEditor()}
              </div>
            </div>
          </div>

          {/* 底部操作按钮 */}
          <div class="p-4 border-t space-y-2">
            <Button onClick={handleSave} class="w-full">
              保存更改
            </Button>
            <Button variant="outline" onClick={props.onClose} class="w-full">
              关闭
            </Button>
          </div>
        </div>
      </Show>
    </div>
  );
}

