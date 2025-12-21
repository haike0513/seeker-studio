/**
 * 知识库列表页面
 */

import { createResource, createSignal, For, Show } from "solid-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/registry/ui/card";
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
import { CreateKnowledgeBaseDialog } from "@/components/knowledge-base/CreateKnowledgeBaseDialog";

export default function KnowledgeBasesPage() {
  const [createDialogOpen, setCreateDialogOpen] = createSignal(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);
  const [deletingId, setDeletingId] = createSignal<string | null>(null);
  const [deleting, setDeleting] = createSignal(false);

  const [knowledgeBases, { refetch }] = createResource(async () => {
    const res = await fetch("/api/knowledge-bases", {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load knowledge bases");
    const data = await res.json();
    return data.success ? data.data : [];
  });

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    const id = deletingId();
    if (!id) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/knowledge-bases/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("删除失败");
      
      toast.success("知识库删除成功！");
      setDeleteDialogOpen(false);
      setDeletingId(null);
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
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">知识库</h1>
          <p class="text-muted-foreground mt-2">
            管理和组织您的知识库，支持文档上传、分段和语义检索
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          创建知识库
        </Button>
      </div>

      <Show
        when={knowledgeBases() && knowledgeBases()!.length > 0}
        fallback={
          <div class="text-center py-12">
            <p class="text-muted-foreground mb-4">还没有知识库</p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              创建第一个知识库
            </Button>
          </div>
        }
      >
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <For each={knowledgeBases()}>
            {(kb) => (
              <Card class="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{kb.name}</CardTitle>
                  <CardDescription>
                    {kb.description || "无描述"}
                  </CardDescription>
                </CardHeader>
                <CardContent class="space-y-4">
                  <div class="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>索引方法: {kb.indexingMethod}</span>
                    <span class={kb.enabled ? "text-green-600" : "text-gray-400"}>
                      {kb.enabled ? "已启用" : "已禁用"}
                    </span>
                  </div>
                  <div class="flex gap-2">
                    <Link href={`/knowledge-bases/${kb.id}`} class="flex-1">
                      <Button variant="outline" class="w-full">
                        查看详情
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(kb.id)}
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

      <Show when={createDialogOpen()}>
        <CreateKnowledgeBaseDialog
          open={createDialogOpen()}
          onOpenChange={setCreateDialogOpen}
          onCreated={() => {
            setCreateDialogOpen(false);
            refetch();
          }}
        />
      </Show>

      <AlertDialog open={deleteDialogOpen()} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个知识库吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting()}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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
