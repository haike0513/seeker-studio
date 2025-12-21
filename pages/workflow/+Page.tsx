/**
 * 工作流列表页面
 */

import { createResource, createSignal, For, Show } from "solid-js";
import { navigate } from "vike/client/router";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/registry/ui/card";
import { Badge } from "@/registry/ui/badge";
import { Link } from "@/components/Link";
import type { Workflow } from "@/types/workflow";
import { toast } from "somoto";

export default function WorkflowListPage() {
  const [createLoading, setCreateLoading] = createSignal(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);
  const [deletingId, setDeletingId] = createSignal<string | null>(null);
  const [deleting, setDeleting] = createSignal(false);

  const [workflows, { refetch }] = createResource(async () => {
    const res = await fetch("/api/workflows", {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to load workflows");
    const data = await res.json();
    return data.success ? data.data : [];
  });

  const handleCreateWorkflow = async () => {
    if (createLoading()) return;
    setCreateLoading(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: "新建工作流",
        }),
      });

      if (!res.ok) throw new Error("创建失败");
      const data = await res.json();
      if (!data.success || !data.data?.id) {
        throw new Error("创建失败");
      }

      const created = data.data as Workflow;
      toast.success("工作流创建成功！");
      navigate(`/workflow/${created.id}`);
    } catch (error) {
      console.error("Create workflow error:", error);
      toast.error("创建失败");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    const id = deletingId();
    if (!id) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/workflows/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error("删除失败");
      }

      toast.success("工作流删除成功！");
      setDeleteDialogOpen(false);
      setDeletingId(null);
      refetch();
    } catch (error) {
      console.error("Delete workflow error:", error);
      toast.error("删除失败");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div class="container mx-auto p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">工作流</h1>
          <p class="text-muted-foreground mt-2">
            管理和编辑你的 AI 工作流，支持可视化编排和执行
          </p>
        </div>
        <Button onClick={handleCreateWorkflow} disabled={createLoading()}>
          {createLoading() ? "创建中..." : "新建工作流"}
        </Button>
      </div>

      <Show
        when={workflows() && workflows()!.length > 0}
        fallback={
          <div class="text-center py-12">
            <p class="text-muted-foreground mb-4">还没有工作流</p>
            <Button onClick={handleCreateWorkflow} disabled={createLoading()}>
              {createLoading() ? "创建中..." : "创建第一个工作流"}
            </Button>
          </div>
        }
      >
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <For each={workflows()}>
            {(wf) => (
              <Card class="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div class="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle>{wf.name}</CardTitle>
                      <CardDescription>{wf.description || "无描述"}</CardDescription>
                    </div>
                    <div class="flex flex-col items-end gap-1">
                      <Badge variant={wf.enabled ? "default" : "outline"}>
                        {wf.enabled ? "已启用" : "未启用"}
                      </Badge>
                      {wf.isPublic && <Badge variant="outline">公开</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent class="space-y-4">
                  <div class="flex gap-2">
                    <Link href={`/workflow/${wf.id}`} class="flex-1">
                      <Button variant="outline" class="w-full">
                        打开编辑器
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(wf.id)}
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

      <AlertDialog open={deleteDialogOpen()} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个工作流吗？此操作无法撤销。
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

