/**
 * 工作流节点面板
 * 显示可添加的节点类型
 */

import { For } from "solid-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkflowNodeType, NodePosition } from "@/types/workflow";
import { listWorkflowNodeDefinitions } from "./nodeRegistry";

interface WorkflowNodePanelProps {
  onAddNode: (type: WorkflowNodeType, position?: NodePosition) => void;
  onClose: () => void;
}

export function WorkflowNodePanel(props: WorkflowNodePanelProps) {
  const nodeTypes = () => listWorkflowNodeDefinitions();

  return (
    <Card class="absolute left-4 top-4 w-64 z-10 max-h-[80vh] overflow-y-auto">
      <CardHeader>
        <div class="flex items-center justify-between">
          <CardTitle>添加节点</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={props.onClose}
            class="h-8 px-2 text-xs"
          >
            关闭
          </Button>
        </div>
      </CardHeader>
      <CardContent class="space-y-2">
        <For each={nodeTypes()}>
          {(nodeDef) => (
            <Button
              variant="outline"
              class="w-full justify-start h-auto p-3"
              draggable
              onDragStart={(event) => {
                // 标记拖拽的数据类型，canvas 区域会读取此数据创建节点
                event.dataTransfer?.setData(
                  "application/x-workflow-node-type",
                  nodeDef.type,
                );
                // 兼容一些调试场景
                event.dataTransfer?.setData("text/plain", nodeDef.type);
              }}
              onClick={() => props.onAddNode(nodeDef.type as WorkflowNodeType)}
            >
              <div class="flex items-start gap-3 w-full">
                {nodeDef.icon && <span class="text-2xl">{nodeDef.icon}</span>}
                <div class="flex-1 text-left">
                  <div class="font-medium">{nodeDef.label}</div>
                  <div class="text-xs text-muted-foreground">
                    {nodeDef.description}
                  </div>
                </div>
              </div>
            </Button>
          )}
        </For>
      </CardContent>
    </Card>
  );
}
