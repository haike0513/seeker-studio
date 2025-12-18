/**
 * 子工作流调用节点配置组件
 */

import { createSignal, createEffect, createResource, For, Show } from "solid-js";
import type { SubWorkflowNodeConfig, Workflow } from "@/types/workflow";

interface SubWorkflowNodeConfigProps {
  config?: SubWorkflowNodeConfig;
  onUpdate: (config: SubWorkflowNodeConfig) => void;
}

export function SubWorkflowNodeConfig(props: SubWorkflowNodeConfigProps) {
  const [workflowId, setWorkflowId] = createSignal(props.config?.workflowId || "");
  const [mode, setMode] = createSignal<SubWorkflowNodeConfig["mode"]>(
    props.config?.mode || "call",
  );

  // 获取当前用户的工作流列表，用于选择要调用的子工作流
  const [workflows] = createResource<Workflow[]>(async () => {
    const res = await fetch("/api/workflows", {
      credentials: "include",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? (data.data as Workflow[]) : [];
  });

  createEffect(() => {
    props.onUpdate({
      workflowId: workflowId(),
      mode: mode(),
    });
  });

  return (
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-medium">子工作流 *</label>
        <select
          value={workflowId()}
          onChange={(e) => setWorkflowId(e.currentTarget.value)}
          class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
        >
          <option value="">选择要调用的工作流</option>
          <Show when={workflows()}>
            <For each={workflows()}>
              {(wf) => (
                <option value={wf.id}>{wf.name}</option>
              )}
            </For>
          </Show>
        </select>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">调用模式</label>
        <select
          value={mode() || "call"}
          onChange={(e) =>
            setMode(e.currentTarget.value as SubWorkflowNodeConfig["mode"])
          }
          class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
        >
          <option value="call">调用并等待结果</option>
          <option value="embed">嵌入执行（高级）</option>
        </select>
        <p class="text-xs text-muted-foreground">
          调用模式仅影响执行引擎如何与子工作流交互，具体语义由后端实现决定。
        </p>
      </div>
    </div>
  );
}


