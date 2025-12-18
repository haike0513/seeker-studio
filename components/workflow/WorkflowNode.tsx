/**
 * 工作流自定义节点组件
 * 包含连接点（Handle）用于节点间的连接
 */

import { Show, For } from "solid-js";
import { Handle, Position } from "@/lib/xyflow/solid";
import type { Node } from "@/lib/xyflow/solid";
import { getWorkflowNodeDefinition } from "./nodeRegistry";
import type { WorkflowNodeType } from "@/types/workflow";

interface WorkflowNodeProps {
  node: Node;
}

/**
 * 根据节点类型判断是否需要连接点
 */
function getNodeHandles(type: WorkflowNodeType): {
  hasInput: boolean;
  hasOutput: boolean;
  outputHandles?: string[];
} {
  switch (type) {
    case "start":
      // 开始节点只有输出
      return { hasInput: false, hasOutput: true };
    case "end":
      // 结束节点只有输入
      return { hasInput: true, hasOutput: false };
    case "condition":
      // 条件判断节点：1个输入，2个输出（true/false）
      return {
        hasInput: true,
        hasOutput: true,
        outputHandles: ["true", "false"],
      };
    default:
      // 其他节点：1个输入，1个输出
      return { hasInput: true, hasOutput: true };
  }
}

export function WorkflowNode(props: WorkflowNodeProps) {
  const node = props.node;
  const nodeType = node.type as WorkflowNodeType;
  const nodeDef = getWorkflowNodeDefinition(nodeType);
  const title = (node.data as { title?: string })?.title || nodeDef?.label || "节点";
  const icon = nodeDef?.icon;
  const handles = getNodeHandles(nodeType);

  return (
    <div class="relative min-w-[150px] bg-background border-2 border-border rounded-lg shadow-md hover:shadow-lg transition-shadow">
      {/* 输入连接点 */}
      <Show when={handles.hasInput}>
        <Handle
          type="target"
          position={Position.Top}
          class="!bg-primary !w-3 !h-3 !border-2 !border-background"
        />
      </Show>

      {/* 节点内容 */}
      <div class="px-3 py-2">
        <div class="flex items-center gap-2">
          {icon && <span class="text-lg">{icon}</span>}
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sm truncate">{title}</div>
            <div class="text-xs text-muted-foreground truncate">
              {nodeDef?.description}
            </div>
          </div>
        </div>
      </div>

      {/* 输出连接点 */}
      <Show when={handles.hasOutput}>
        <Show
          when={handles.outputHandles && handles.outputHandles.length > 1}
          fallback={
            <Handle
              type="source"
              position={Position.Bottom}
              id="default"
              class="!bg-primary !w-3 !h-3 !border-2 !border-background"
            />
          }
        >
          {/* 多个输出连接点的情况（如条件判断节点） */}
          <div class="relative pb-2">
            <For each={handles.outputHandles}>
              {(handleId, index) => {
                const offset =
                  (index() - (handles.outputHandles!.length - 1) / 2) * 32;
                const label =
                  handleId === "true"
                    ? "是"
                    : handleId === "false"
                      ? "否"
                      : handleId;
                return (
                  <div
                    class="absolute -bottom-1 left-1/2 flex flex-col items-center"
                    style={{
                      transform: `translateX(${offset}px)`,
                    }}
                  >
                    <Handle
                      type="source"
                      position={Position.Bottom}
                      id={handleId}
                      class="!bg-primary !w-3 !h-3 !border-2 !border-background"
                    />
                    <span class="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">
                      {label}
                    </span>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
}

