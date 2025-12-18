/**
 * 代码执行节点配置组件
 */

import { createSignal, createEffect } from "solid-js";
import type { CodeNodeConfig } from "@/types/workflow";

interface CodeNodeConfigProps {
  config?: CodeNodeConfig;
  onUpdate: (config: CodeNodeConfig) => void;
}

export function CodeNodeConfig(props: CodeNodeConfigProps) {
  const [language, setLanguage] = createSignal<CodeNodeConfig["language"]>(
    props.config?.language || "javascript",
  );
  const [code, setCode] = createSignal(props.config?.code || "");
  const [timeout, setTimeout] = createSignal(props.config?.timeout || 30000);

  createEffect(() => {
    props.onUpdate({
      language: language(),
      code: code(),
      timeout: timeout(),
    });
  });

  return (
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-medium">编程语言</label>
        <select
          value={language()}
          onChange={(e) => setLanguage(e.currentTarget.value as CodeNodeConfig["language"])}
          class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
        </select>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">代码</label>
        <textarea
          value={code()}
          onInput={(e) => setCode(e.currentTarget.value)}
          class="w-full min-h-40 px-3 py-2 bg-background border border-input rounded-md text-sm font-mono"
          placeholder={
            language() === "javascript"
              ? "// JavaScript 代码\n// 使用 input 变量访问输入数据\nreturn input;"
              : "# Python 代码\n# 使用 input 变量访问输入数据\nreturn input"
          }
        />
        <p class="text-xs text-muted-foreground">
          代码应返回结果，可通过 input 变量访问输入数据
        </p>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">超时时间 (毫秒)</label>
        <input
          type="number"
          value={timeout()}
          onInput={(e) => setTimeout(parseInt(e.currentTarget.value) || 30000)}
          class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
        />
      </div>
    </div>
  );
}
