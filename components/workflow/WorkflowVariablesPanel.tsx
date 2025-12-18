/**
 * 工作流变量管理面板
 */

import { createSignal, For, Show } from "solid-js";
import { Button } from "@/registry/ui/button";
import type { Node } from "@/lib/xyflow/solid";

interface WorkflowVariable {
  name: string;
  type: "string" | "number" | "boolean" | "object";
  value: any;
  description?: string;
}

interface WorkflowVariablesPanelProps {
  nodes: Node[];
  onVariableChange?: (variables: WorkflowVariable[]) => void;
}

export function WorkflowVariablesPanel(props: WorkflowVariablesPanelProps) {
  const [variables, setVariables] = createSignal<WorkflowVariable[]>([]);
  const [showAddForm, setShowAddForm] = createSignal(false);
  const [newVarName, setNewVarName] = createSignal("");
  const [newVarType, setNewVarType] = createSignal<WorkflowVariable["type"]>("string");
  const [newVarValue, setNewVarValue] = createSignal("");

  // 从节点中提取变量引用
  const extractVariables = () => {
    const varSet = new Set<string>();
    props.nodes.forEach((node) => {
      const data = node.data as Record<string, any>;
      if (data) {
        // 查找所有 {{variable}} 格式的变量引用
        const dataStr = JSON.stringify(data);
        const matches = dataStr.match(/\{\{(\w+)\}\}/g);
        if (matches) {
          matches.forEach((match) => {
            const varName = match.replace(/\{\{|\}\}/g, "");
            varSet.add(varName);
          });
        }
      }
    });
    return Array.from(varSet);
  };

  const referencedVariables = () => extractVariables();

  const handleAddVariable = () => {
    if (!newVarName().trim()) return;

    const newVar: WorkflowVariable = {
      name: newVarName().trim(),
      type: newVarType(),
      value: parseValue(newVarValue(), newVarType()),
    };

    setVariables((prev) => [...prev, newVar]);
    props.onVariableChange?.(variables());
    
    setNewVarName("");
    setNewVarValue("");
    setShowAddForm(false);
  };

  const parseValue = (value: string, type: WorkflowVariable["type"]): any => {
    try {
      switch (type) {
        case "number":
          return Number(value);
        case "boolean":
          return value === "true" || value === "1";
        case "object":
          return JSON.parse(value);
        default:
          return value;
      }
    } catch {
      return value;
    }
  };

  const handleRemoveVariable = (name: string) => {
    setVariables((prev) => prev.filter((v) => v.name !== name));
    props.onVariableChange?.(variables());
  };

  return (
    <div class="h-full flex flex-col bg-background border-l">
      <div class="p-4 border-b">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-semibold">工作流变量</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm())}
          >
            {showAddForm() ? "取消" : "添加变量"}
          </Button>
        </div>
        
        <Show when={showAddForm()}>
          <div class="space-y-2 mt-2">
            <input
              type="text"
              placeholder="变量名"
              value={newVarName()}
              onInput={(e) => setNewVarName(e.currentTarget.value)}
              class="w-full h-9 px-3 border border-input rounded-md bg-background text-sm"
            />
            <select
              value={newVarType()}
              onChange={(e) => setNewVarType(e.currentTarget.value as WorkflowVariable["type"])}
              class="w-full h-9 px-3 border border-input rounded-md bg-background text-sm"
            >
              <option value="string">字符串</option>
              <option value="number">数字</option>
              <option value="boolean">布尔值</option>
              <option value="object">对象</option>
            </select>
            <input
              type="text"
              placeholder="变量值"
              value={newVarValue()}
              onInput={(e) => setNewVarValue(e.currentTarget.value)}
              class="w-full h-9 px-3 border border-input rounded-md bg-background text-sm"
            />
            <Button onClick={handleAddVariable} class="w-full" size="sm">
              添加
            </Button>
          </div>
        </Show>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-2">
        <Show
          when={variables().length > 0}
          fallback={
            <div class="text-sm text-muted-foreground text-center py-8">
              暂无变量
            </div>
          }
        >
          <For each={variables()}>
            {(variable) => (
              <div class="p-3 border rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <div>
                    <span class="font-medium">{variable.name}</span>
                    <span class="text-xs text-muted-foreground ml-2">
                      ({variable.type})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveVariable(variable.name)}
                  >
                    删除
                  </Button>
                </div>
                <div class="text-sm text-muted-foreground">
                  {JSON.stringify(variable.value)}
                </div>
              </div>
            )}
          </For>
        </Show>

        <Show when={referencedVariables().length > 0}>
          <div class="mt-4 pt-4 border-t">
            <h4 class="text-sm font-medium mb-2">引用的变量</h4>
            <div class="flex flex-wrap gap-2">
              <For each={referencedVariables()}>
                {(varName) => (
                  <span class="px-2 py-1 bg-muted rounded text-xs">
                    {`{{${varName}}}`}
                  </span>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}

