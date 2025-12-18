/**
 * 延时节点配置组件
 */

import { createSignal, createEffect } from "solid-js";
import type { DelayNodeConfig } from "@/types/workflow";

interface DelayNodeConfigProps {
  config?: DelayNodeConfig;
  onUpdate: (config: DelayNodeConfig) => void;
}

export function DelayNodeConfig(props: DelayNodeConfigProps) {
  const [delayMs, setDelayMs] = createSignal(props.config?.delayMs ?? 1000);

  createEffect(() => {
    props.onUpdate({
      delayMs: delayMs(),
    });
  });

  return (
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-medium">延时时间（毫秒）</label>
        <input
          type="number"
          min="0"
          value={delayMs()}
          onInput={(e) => setDelayMs(parseInt(e.currentTarget.value) || 0)}
          class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
        />
        <p class="text-xs text-muted-foreground">
          在进入下一个节点前，等待指定毫秒数。
        </p>
      </div>
    </div>
  );
}


