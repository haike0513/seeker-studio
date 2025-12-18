/**
 * LLM 节点配置组件
 */

import { createSignal, createEffect } from "solid-js";
import type { LLMNodeConfig } from "@/types/workflow";

interface LLMNodeConfigProps {
  config?: LLMNodeConfig;
  onUpdate: (config: LLMNodeConfig) => void;
}

export function LLMNodeConfig(props: LLMNodeConfigProps) {
  const [model, setModel] = createSignal(props.config?.model || "gpt-4o");
  const [temperature, setTemperature] = createSignal(props.config?.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = createSignal(props.config?.maxTokens ?? 1000);
  const [systemPrompt, setSystemPrompt] = createSignal(props.config?.systemPrompt || "");
  const [userPrompt, setUserPrompt] = createSignal(props.config?.userPrompt || "");

  createEffect(() => {
    props.onUpdate({
      model: model(),
      temperature: temperature(),
      maxTokens: maxTokens(),
      systemPrompt: systemPrompt(),
      userPrompt: userPrompt(),
    });
  });

  return (
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-medium">模型</label>
        <select
          value={model()}
          onChange={(e) => setModel(e.currentTarget.value)}
          class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
        >
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-4o-mini">GPT-4o Mini</option>
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">温度 ({temperature()})</label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={temperature()}
          onInput={(e) => setTemperature(parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">最大 Token 数</label>
        <input
          type="number"
          value={maxTokens()}
          onInput={(e) => setMaxTokens(parseInt(e.currentTarget.value) || 1000)}
          class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">系统提示词</label>
        <textarea
          value={systemPrompt()}
          onInput={(e) => setSystemPrompt(e.currentTarget.value)}
          class="w-full min-h-20 px-3 py-2 bg-background border border-input rounded-md text-sm"
          placeholder="输入系统提示词..."
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">用户提示词</label>
        <textarea
          value={userPrompt()}
          onInput={(e) => setUserPrompt(e.currentTarget.value)}
          class="w-full min-h-20 px-3 py-2 bg-background border border-input rounded-md text-sm"
          placeholder={`输入用户提示词（可使用变量，如 ${'{'}${'{'}input.text${'}'}${'}'}）...`}
        />
      </div>
    </div>
  );
}
