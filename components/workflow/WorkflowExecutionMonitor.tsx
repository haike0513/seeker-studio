/**
 * 工作流执行监控面板
 */

import { createResource, For, Show } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WorkflowExecutionStatus } from "@/types/workflow";

interface WorkflowExecutionMonitorProps {
  workflowId: string;
  executionId?: string;
}

export function WorkflowExecutionMonitor(props: WorkflowExecutionMonitorProps) {
  const [execution] = createResource(
    () => props.executionId,
    async (id) => {
      if (!id) return null;
      const res = await fetch(`/api/workflows/executions/${id}`, {
        credentials: "include",
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.success ? data.data : null;
    },
  );

  const getStatusColor = (status: WorkflowExecutionStatus) => {
    const colors: Record<WorkflowExecutionStatus, string> = {
      pending: "bg-yellow-500",
      running: "bg-blue-500",
      completed: "bg-green-500",
      failed: "bg-red-500",
      cancelled: "bg-gray-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: WorkflowExecutionStatus) => {
    const labels: Record<WorkflowExecutionStatus, string> = {
      pending: "等待中",
      running: "运行中",
      completed: "已完成",
      failed: "失败",
      cancelled: "已取消",
    };
    return labels[status] || status;
  };

  return (
    <Show when={execution()}>
      <Card class="w-full">
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle>执行监控</CardTitle>
            <Badge class={getStatusColor(execution()!.status)}>
              {getStatusLabel(execution()!.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          {/* 执行信息 */}
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div class="text-muted-foreground">执行 ID</div>
              <div class="font-mono text-xs">{execution()!.id}</div>
            </div>
            <div>
              <div class="text-muted-foreground">开始时间</div>
              <div>
                {execution()!.startedAt
                  ? new Date(execution()!.startedAt).toLocaleString()
                  : "-"}
              </div>
            </div>
            <div>
              <div class="text-muted-foreground">结束时间</div>
              <div>
                {execution()!.completedAt
                  ? new Date(execution()!.completedAt).toLocaleString()
                  : "-"}
              </div>
            </div>
            <div>
              <div class="text-muted-foreground">耗时</div>
              <div>
                {execution()!.startedAt && execution()!.completedAt
                  ? `${Math.round(
                      (new Date(execution()!.completedAt).getTime() -
                        new Date(execution()!.startedAt).getTime()) /
                        1000,
                    )} 秒`
                  : "-"}
              </div>
            </div>
          </div>

          {/* 错误信息 */}
          <Show when={execution()!.error}>
            <div class="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {execution()!.error}
            </div>
          </Show>

          {/* 节点执行记录 */}
          <Show when={execution()!.nodeExecutions && execution()!.nodeExecutions.length > 0}>
            <div class="space-y-2">
              <div class="text-sm font-medium">节点执行记录</div>
              <div class="space-y-2">
                <For each={execution()!.nodeExecutions}>
                  {(nodeExec) => (
                    <div class="p-2 border rounded-lg text-sm">
                      <div class="flex items-center justify-between">
                        <span class="font-medium">节点 {nodeExec.nodeId}</span>
                        <Badge class={getStatusColor(nodeExec.status)}>
                          {getStatusLabel(nodeExec.status)}
                        </Badge>
                      </div>
                      <Show when={nodeExec.error}>
                        <div class="mt-1 text-xs text-destructive">
                          {nodeExec.error}
                        </div>
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* 输出结果 */}
          <Show when={execution()!.output}>
            <div class="space-y-2">
              <div class="text-sm font-medium">输出结果</div>
              <pre class="p-3 bg-muted rounded-lg text-xs overflow-auto max-h-64">
                {JSON.stringify(execution()!.output, null, 2)}
              </pre>
            </div>
          </Show>
        </CardContent>
      </Card>
    </Show>
  );
}
