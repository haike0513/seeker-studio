/**
 * 条件判断节点配置组件
 */

import { createSignal, createEffect } from "solid-js";
import type { ConditionNodeConfig } from "@/types/workflow";

interface ConditionNodeConfigProps {
  config?: ConditionNodeConfig;
  onUpdate: (config: ConditionNodeConfig) => void;
}

export function ConditionNodeConfig(props: ConditionNodeConfigProps) {
  const [condition, setCondition] = createSignal(props.config?.condition || "{{input.value}} > 0");
  const [trueLabel, setTrueLabel] = createSignal(props.config?.trueLabel || "是");
  const [falseLabel, setFalseLabel] = createSignal(props.config?.falseLabel || "否");

  createEffect(() => {
    props.onUpdate({
      condition: condition(),
      trueLabel: trueLabel(),
      falseLabel: falseLabel(),
    });
  });

  return (
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-medium">条件表达式</label>
        <input
          type="text"
          value={condition()}
          onInput={(e) => setCondition(e.currentTarget.value)}
          class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
          placeholder={`例如: ${'{'}${'{'}input.value${'}'}${'}'} > 10`}
        />
        <p class="text-xs text-muted-foreground">
          支持变量引用，如 {'{{'}input.value{'}}'}
        </p>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">真值标签</label>
        <input
          type="text"
          value={trueLabel()}
          onInput={(e) => setTrueLabel(e.currentTarget.value)}
          class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">假值标签</label>
        <input
          type="text"
          value={falseLabel()}
          onInput={(e) => setFalseLabel(e.currentTarget.value)}
          class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
        />
      </div>
    </div>
  );
}
