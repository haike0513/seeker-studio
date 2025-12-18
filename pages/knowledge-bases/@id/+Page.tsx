/**
 * 知识库详情页面
 */

import { createResource, createSignal, For, Show } from "solid-js";
import { usePageContext } from "vike-solid/usePageContext";
import { Button } from "@/registry/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/ui/card";
import { Badge } from "@/registry/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/registry/ui/alert-dialog";
import { Link } from "@/components/Link";
import { toast } from "somoto";
import type { KnowledgeBase, Document } from "@/types/knowledge-base";
import { DocumentUploadDialog } from "@/components/knowledge-base/DocumentUploadDialog";
import { KnowledgeBaseSearch } from "@/components/knowledge-base/KnowledgeBaseSearch";

export default function KnowledgeBaseDetailPage() {
  const pageContext = usePageContext();
  const knowledgeBaseId = pageContext.routeParams?.id;
  const [uploadDialogOpen, setUploadDialogOpen] = createSignal(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);
  const [deletingDocId, setDeletingDocId] = createSignal<string | null>(null);
  const [deleting, setDeleting] = createSignal(false);

  const [knowledgeBase, { refetch }] = createResource(
    () => knowledgeBaseId,
    async (id) => {
      if (!id) return null;
      const res = await fetch(`/api/knowledge-bases/${id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load knowledge base");
      const data = await res.json();
      return data.success ? data.data : null;
    },
  );

  const handleDeleteDocumentClick = (docId: string) => {
    setDeletingDocId(docId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDocumentConfirm = async () => {
    const docId = deletingDocId();
    if (!docId) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("删除失败");
      
      toast.success("文档删除成功！");
      setDeleteDialogOpen(false);
      setDeletingDocId(null);
      refetch();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("删除失败");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div class="container mx-auto p-6 space-y-6">
      <Show
        when={knowledgeBase()}
        fallback={<div class="text-center py-12">加载中...</div>}
      >
        <div>
          <div class="flex items-center justify-between mb-4">
            <div>
              <h1 class="text-3xl font-bold">{knowledgeBase()!.name}</h1>
              <p class="text-muted-foreground mt-2">
                {knowledgeBase()!.description || "无描述"}
              </p>
            </div>
            <div class="flex gap-2">
              <Button onClick={() => setUploadDialogOpen(true)}>
                上传文档
              </Button>
              <Link href="/knowledge-bases">
                <Button variant="outline">返回列表</Button>
              </Link>
            </div>
          </div>

          <div class="flex gap-4 mb-6">
            <Badge>索引方法: {knowledgeBase()!.indexingMethod}</Badge>
            <Badge>嵌入模型: {knowledgeBase()!.embeddingModel}</Badge>
            <Badge class={knowledgeBase()!.enabled ? "bg-green-500" : "bg-gray-500"}>
              {knowledgeBase()!.enabled ? "已启用" : "已禁用"}
            </Badge>
          </div>

          {/* 检索测试 */}
          <Card class="mb-6">
            <CardHeader>
              <CardTitle>检索测试</CardTitle>
            </CardHeader>
            <CardContent>
              <KnowledgeBaseSearch knowledgeBaseId={knowledgeBaseId!} />
            </CardContent>
          </Card>

          {/* 文档列表 */}
          <div>
            <h2 class="text-2xl font-bold mb-4">文档列表</h2>
            <Show
              when={knowledgeBase()!.documents && knowledgeBase()!.documents.length > 0}
              fallback={
                <div class="text-center py-12 text-muted-foreground">
                  还没有文档，点击"上传文档"开始添加
                </div>
              }
            >
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <For each={knowledgeBase()!.documents}>
                  {(doc) => (
                    <Card>
                      <CardHeader>
                        <CardTitle class="text-lg">{doc.name}</CardTitle>
                      </CardHeader>
                      <CardContent class="space-y-2">
                        <div class="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{doc.type}</Badge>
                          <Badge
                            class={
                              doc.status === "completed"
                                ? "bg-green-500"
                                : doc.status === "processing"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }
                          >
                            {doc.status === "completed"
                              ? "已完成"
                              : doc.status === "processing"
                                ? "处理中"
                                : "失败"}
                          </Badge>
                        </div>
                        <div class="flex gap-2">
                          <Link href={`/documents/${doc.id}`} class="flex-1">
                            <Button variant="outline" size="sm" class="w-full">
                              查看详情
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteDocumentClick(doc.id)}
                          >
                            删除
                          </Button>
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

      <Show when={uploadDialogOpen()}>
        <DocumentUploadDialog
          knowledgeBaseId={knowledgeBaseId!}
          open={uploadDialogOpen()}
          onOpenChange={setUploadDialogOpen}
          onUploaded={() => {
            setUploadDialogOpen(false);
            refetch();
          }}
        />
      </Show>

      <AlertDialog open={deleteDialogOpen()} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个文档吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting()}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocumentConfirm}
              disabled={deleting()}
              class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting() ? "删除中..." : "删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
