/**
 * 知识库检索组件
 */

import { createSignal, For, Show } from "solid-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "somoto";
import type { SearchResult } from "@/types/knowledge-base";

interface KnowledgeBaseSearchProps {
  knowledgeBaseId: string;
}

export function KnowledgeBaseSearch(props: KnowledgeBaseSearchProps) {
  const [query, setQuery] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [results, setResults] = createSignal<SearchResult[]>([]);

  const handleSearch = async () => {
    if (!query().trim()) {
      toast.error("请输入检索查询");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/knowledge-bases/${props.knowledgeBaseId}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          query: query(),
          topK: 5,
        }),
      });

      if (!response.ok) {
        throw new Error("检索失败");
      }

      const data = await response.json();
      if (data.success) {
        setResults(data.data.results || []);
        if (data.data.results.length === 0) {
          toast.info("未找到相关结果");
        }
      } else {
        throw new Error(data.message || "检索失败");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("检索失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="space-y-4">
      <div class="flex gap-2">
        <input
          type="text"
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading()) {
              handleSearch();
            }
          }}
          class="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm"
          placeholder="输入检索查询..."
        />
        <Button onClick={handleSearch} disabled={loading()}>
          {loading() ? "检索中..." : "检索"}
        </Button>
      </div>

      <Show when={results().length > 0}>
        <div class="space-y-3">
          <div class="text-sm text-muted-foreground">
            找到 {results().length} 个相关结果
          </div>
          <For each={results()}>
            {(result) => (
              <Card>
                <CardContent class="p-4">
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <div class="font-medium">{result.document.name}</div>
                      <div class="text-xs text-muted-foreground">
                        相似度: {(result.score * 100).toFixed(1)}%
                      </div>
                    </div>
                    <Badge variant="outline">{result.document.type}</Badge>
                  </div>
                  <div class="text-sm text-muted-foreground line-clamp-3">
                    {result.segment.content}
                  </div>
                </CardContent>
              </Card>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
