/**
 * 参数提取节点配置组件
 */

import { createSignal, createEffect, For } from "solid-js";
import { Button } from "@/registry/ui/button";
import type { ParameterNodeConfig } from "@/types/workflow";

interface ParameterNodeConfigProps {
  config?: ParameterNodeConfig;
  onUpdate: (config: ParameterNodeConfig) => void;
}

export function ParameterNodeConfig(props: ParameterNodeConfigProps) {
  const [parameters, setParameters] = createSignal(
    props.config?.parameters || [],
  );

  createEffect(() => {
    props.onUpdate({
      parameters: parameters(),
    });
  });

  const addParameter = () => {
    setParameters((prev) => [
      ...prev,
      {
        name: `param${prev.length + 1}`,
        type: "string" as const,
        path: "",
      },
    ]);
  };

  const removeParameter = (index: number) => {
    setParameters((prev) => prev.filter((_, i) => i !== index));
  };

  const updateParameter = (index: number, field: string, value: unknown) => {
    setParameters((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    );
  };

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <label class="text-sm font-medium">参数列表</label>
        <Button variant="outline" size="sm" onClick={addParameter}>
          添加参数
        </Button>
      </div>

      <div class="space-y-3">
        <For each={parameters()}>
          {(param, index) => (
            <div class="p-3 border rounded-lg space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">参数 {index() + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeParameter(index())}
                >
                  删除
                </Button>
              </div>

              <div class="space-y-2">
                <div>
                  <label class="text-xs text-muted-foreground">名称</label>
                  <input
                    type="text"
                    value={param.name}
                    onInput={(e) =>
                      updateParameter(index(), "name", e.currentTarget.value)
                    }
                    class="w-full px-2 py-1 bg-background border border-input rounded text-sm"
                  />
                </div>

                <div>
                  <label class="text-xs text-muted-foreground">类型</label>
                  <select
                    value={param.type}
                    onChange={(e) =>
                      updateParameter(index(), "type", e.currentTarget.value)
                    }
                    class="w-full px-2 py-1 bg-background border border-input rounded text-sm"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="object">Object</option>
                    <option value="array">Array</option>
                  </select>
                </div>

                <div>
                  <label class="text-xs text-muted-foreground">提取路径 (可选)</label>
                  <input
                    type="text"
                    value={param.path || ""}
                    onInput={(e) =>
                      updateParameter(index(), "path", e.currentTarget.value)
                    }
                    class="w-full px-2 py-1 bg-background border border-input rounded text-sm"
                    placeholder="例如: $.data.value 或 input.key"
                  />
                </div>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
