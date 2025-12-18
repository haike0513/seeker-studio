/**
 * 知识检索节点配置组件
 */

import { createSignal, createResource, createEffect, For, Show } from "solid-js";
import type { KnowledgeRetrievalNodeConfig } from "@/types/workflow";
import type { KnowledgeBase } from "@/types/knowledge-base";

interface KnowledgeRetrievalNodeConfigProps {
  config?: KnowledgeRetrievalNodeConfig;
  onUpdate: (config: KnowledgeRetrievalNodeConfig) => void;
}

export function KnowledgeRetrievalNodeConfig(props: KnowledgeRetrievalNodeConfigProps) {
  const [knowledgeBaseId, setKnowledgeBaseId] = createSignal(
    props.config?.knowledgeBaseId || "",
  );
  const [query, setQuery] = createSignal(props.config?.query || "");
  const [topK, setTopK] = createSignal(props.config?.topK || 5);
  const [scoreThreshold, setScoreThreshold] = createSignal(
    props.config?.scoreThreshold || 0.7,
  );

  // 获取用户的知识库列表
  const [knowledgeBases] = createResource(async () => {
    const res = await fetch("/api/knowledge-bases", {
      credentials: "include",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.success ? data.data : [];
  });

  createEffect(() => {
    props.onUpdate({
      knowledgeBaseId: knowledgeBaseId(),
      query: query(),
      topK: topK(),
      scoreThreshold: scoreThreshold(),
    });
  });

  return (
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-medium">知识库 *</label>
        <select
          value={knowledgeBaseId()}
          onChange={(e) => setKnowledgeBaseId(e.currentTarget.value)}
          class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
        >
          <option value="">选择知识库</option>
          <Show when={knowledgeBases()}>
            <For each={knowledgeBases()}>
              {(kb) => (
                <option value={kb.id}>{kb.name}</option>
              )}
            </For>
          </Show>
        </select>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">检索查询 *</label>
        <input
          type="text"
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
          class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
          placeholder={`输入检索查询（可使用变量，如 ${'{'}${'{'}input.question${'}'}${'}'}）`}
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">返回结果数</label>
        <input
          type="number"
          value={topK()}
          onInput={(e) => setTopK(parseInt(e.currentTarget.value) || 5)}
          class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
          min="1"
          max="20"
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">相似度阈值 ({scoreThreshold()})</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={scoreThreshold()}
          onInput={(e) => setScoreThreshold(parseFloat(e.currentTarget.value))}
          class="w-full"
        />
      </div>
    </div>
  );
}
