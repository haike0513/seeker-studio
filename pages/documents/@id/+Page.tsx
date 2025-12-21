/**
 * 文档详情页面
 */

import { createResource, For, Show } from "solid-js";
import { usePageContext } from "vike-solid/usePageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/Link";
import { toast } from "somoto";
import type { Document, DocumentSegment } from "@/types/knowledge-base";

export default function DocumentDetailPage() {
  const pageContext = usePageContext();
  const documentId = pageContext.routeParams?.id;

  const [document, { refetch }] = createResource(
    () => documentId,
    async (id) => {
      if (!id) return null;
      const res = await fetch(`/api/documents/${id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load document");
      const data = await res.json();
      return data.success ? data.data : null;
    },
  );

  const handleSegment = async () => {
    if (!documentId) return;

    try {
      const res = await fetch(`/api/documents/${documentId}/segment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          chunkSize: 1000,
          chunkOverlap: 200,
        }),
      });

      if (!res.ok) throw new Error("分段失败");
      
      toast.success("文档分段成功！");
      refetch();
    } catch (error) {
      console.error("Segment error:", error);
      toast.error("分段失败");
    }
  };

  return (
    <div class="container mx-auto p-6 space-y-6">
      <Show
        when={document()}
        fallback={<div class="text-center py-12">加载中...</div>}
      >
        <div>
          <div class="flex items-center justify-between mb-4">
            <div>
              <h1 class="text-3xl font-bold">{document()!.name}</h1>
              <div class="flex gap-2 mt-2">
                <Badge>{document()!.type}</Badge>
                <Badge
                  class={
                    document()!.status === "completed"
                      ? "bg-green-500"
                      : document()!.status === "processing"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }
                >
                  {document()!.status === "completed"
                    ? "已完成"
                    : document()!.status === "processing"
                      ? "处理中"
                      : "失败"}
                </Badge>
              </div>
            </div>
            <div class="flex gap-2">
              <Button onClick={handleSegment} variant="outline">
                重新分段
              </Button>
              <Link href="/knowledge-bases">
                <Button variant="outline">返回</Button>
              </Link>
            </div>
          </div>

          {/* 文档内容预览 */}
          <Card class="mb-6">
            <CardHeader>
              <CardTitle>文档内容</CardTitle>
            </CardHeader>
            <CardContent>
              <Show
                when={document()!.content}
                fallback={
                  <div class="text-muted-foreground">
                    {document()!.type === "file" && document()!.fileUrl ? (
                      <a
                        href={document()!.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-primary hover:underline"
                      >
                        查看文件: {document()!.fileUrl}
                      </a>
                    ) : (
                      "无内容"
                    )}
                  </div>
                }
              >
                <pre class="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                  {document()!.content}
                </pre>
              </Show>
            </CardContent>
          </Card>

          {/* 分段列表 */}
          <div>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-2xl font-bold">文档分段</h2>
              <div class="text-sm text-muted-foreground">
                共 {document()!.segments?.length || 0} 个分段
              </div>
            </div>
            <Show
              when={document()!.segments && document()!.segments.length > 0}
              fallback={
                <div class="text-center py-12 text-muted-foreground">
                  还没有分段，点击"重新分段"按钮进行分段
                </div>
              }
            >
              <div class="space-y-3">
                <For each={document()!.segments}>
                  {(segment, index) => (
                    <Card>
                      <CardContent class="p-4">
                        <div class="flex items-start justify-between mb-2">
                          <div class="flex items-center gap-2">
                            <Badge variant="outline">分段 {index() + 1}</Badge>
                            <Show when={segment.position !== undefined}>
                              <span class="text-xs text-muted-foreground">
                                位置: {segment.position}
                              </span>
                            </Show>
                            <Show when={segment.length}>
                              <span class="text-xs text-muted-foreground">
                                长度: {segment.length} 字符
                              </span>
                            </Show>
                          </div>
                          <Show when={segment.embedding}>
                            <Badge variant="outline" class="text-xs">
                              已生成嵌入
                            </Badge>
                          </Show>
                        </div>
                        <div class="text-sm text-muted-foreground line-clamp-3">
                          {segment.content}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </Show>
    </div>
  );
}
