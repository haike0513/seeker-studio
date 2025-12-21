/**
 * 工作流节点配置面板
 */

import { createSignal, createEffect, Show } from "solid-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/ui/card";
import type { WorkflowNode } from "@/types/workflow";
import { getWorkflowNodeDefinition, type NodeConfigComponent } from "./nodeRegistry";

interface WorkflowConfigPanelProps {
  node: WorkflowNode;
  onClose: () => void;
  onUpdate: (node: WorkflowNode) => void;
}

export function WorkflowConfigPanel(props: WorkflowConfigPanelProps) {
  const [title, setTitle] = createSignal(props.node.title);
  const [config, setConfig] = createSignal(props.node.config);

  createEffect(() => {
    setTitle(props.node.title);
    setConfig(props.node.config);
  });

  const handleSave = () => {
    const updatedNode: WorkflowNode = {
      ...props.node,
      title: title(),
      config: config(),
      updatedAt: new Date(),
    };
    props.onUpdate(updatedNode);
  };

  const renderConfigEditor = () => {
    const def = getWorkflowNodeDefinition(props.node.type);
    const ConfigComponent = def?.ConfigComponent as NodeConfigComponent<any> | undefined;

    if (!ConfigComponent) {
      return <div class="text-muted-foreground">此节点类型无需配置</div>;
    }

    return (
      <ConfigComponent
        config={config() as any}
        onUpdate={setConfig}
      />
    );
  };

  return (
    <Card class="absolute right-4 top-4 w-96 z-10 max-h-[80vh] overflow-y-auto">
      <CardHeader>
        <CardTitle>配置节点</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        {/* 节点标题 */}
        <div class="space-y-2">
          <label class="text-sm font-medium">节点标题</label>
          <input
            type="text"
            value={title()}
            onInput={(e) => setTitle(e.currentTarget.value)}
            class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
          />
        </div>

        {/* 节点类型 */}
        <div class="space-y-2">
          <label class="text-sm font-medium">节点类型</label>
          <div class="text-sm text-muted-foreground">{props.node.type}</div>
        </div>

        {/* 节点配置 */}
        <div class="space-y-2">
          <label class="text-sm font-medium">节点配置</label>
          {renderConfigEditor()}
        </div>

        {/* 操作按钮 */}
        <div class="flex gap-2 pt-4">
          <Button variant="outline" onClick={props.onClose} class="flex-1">
            取消
          </Button>
          <Button onClick={handleSave} class="flex-1">
            保存
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
