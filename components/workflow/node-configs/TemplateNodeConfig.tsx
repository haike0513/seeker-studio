/**
 * 模板转换节点配置组件
 */

import { createSignal, createEffect } from "solid-js";
import type { TemplateNodeConfig } from "@/types/workflow";

interface TemplateNodeConfigProps {
  config?: TemplateNodeConfig;
  onUpdate: (config: TemplateNodeConfig) => void;
}

export function TemplateNodeConfig(props: TemplateNodeConfigProps) {
  const [template, setTemplate] = createSignal(props.config?.template || "");
  const [outputFormat, setOutputFormat] = createSignal<TemplateNodeConfig["outputFormat"]>(
    props.config?.outputFormat || "text",
  );

  createEffect(() => {
    props.onUpdate({
      template: template(),
      outputFormat: outputFormat(),
    });
  });

  return (
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-medium">模板 (Jinja2)</label>
        <textarea
          value={template()}
          onInput={(e) => setTemplate(e.currentTarget.value)}
          class="w-full min-h-40 px-3 py-2 bg-background border border-input rounded-md text-sm font-mono"
          placeholder={`例如: Hello ${'{'}${'{'}input.name${'}'}${'}'}, your age is ${'{'}${'{'}input.age${'}'}${'}'}`}
        />
        <p class="text-xs text-muted-foreground">
          使用 Jinja2 模板语法，可通过 {'{{'}variable{'}}'} 引用变量
        </p>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">输出格式</label>
        <select
          value={outputFormat()}
          onChange={(e) =>
            setOutputFormat(e.currentTarget.value as TemplateNodeConfig["outputFormat"])
          }
          class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
        >
          <option value="text">文本</option>
          <option value="json">JSON</option>
        </select>
      </div>
    </div>
  );
}
