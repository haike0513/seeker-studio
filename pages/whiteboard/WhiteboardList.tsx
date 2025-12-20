import type { Data } from "./+data";
import { For, Show, createSignal } from "solid-js";
import { useData } from "vike-solid/useData";
import { navigate } from "vike/client/router";
import { Link } from "@/components/Link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/ui/card";
import { Button } from "@/registry/ui/button";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-solid";

export function WhiteboardList() {
  const { whiteboards: initialWhiteboards } = useData<Data>();
  const [whiteboards, setWhiteboards] = createSignal(
    Array.isArray(initialWhiteboards) ? initialWhiteboards : []
  );
  const [deletingId, setDeletingId] = createSignal<string | null>(null);
  const [isCreating, setIsCreating] = createSignal(false);

  const safeWhiteboards = () => whiteboards();

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "未知时间";
    try {
      return new Date(date).toLocaleString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "未知时间";
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/whiteboards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: "新画板",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.id) {
          // 跳转到新创建的画板
          navigate(`/whiteboard/${data.data.id}`);
        }
      }
    } catch (error) {
      console.error("创建画板失败:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("确定要删除这个画板吗？")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/whiteboards/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        // 从本地状态中移除被删除的画板，立即更新UI
        setWhiteboards((prev) => prev.filter((w) => w.id !== id));
        setDeletingId(null);
      } else {
        setDeletingId(null);
      }
    } catch (error) {
      console.error("删除画板失败:", error);
      setDeletingId(null);
    }
  };

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">画板</h1>
          <p class="text-sm text-muted-foreground mt-1">
            创建和管理您的画板
          </p>
        </div>
        <Button onClick={handleCreate} disabled={isCreating()}>
          <PlusIcon class="w-4 h-4 mr-2" />
          新建画板
        </Button>
      </div>

      <Show
        when={safeWhiteboards().length > 0}
        fallback={
          <div class="text-center py-12">
            <p class="text-muted-foreground">还没有画板</p>
            <p class="text-sm text-muted-foreground mt-2">
              点击"新建画板"按钮开始创建
            </p>
          </div>
        }
      >
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <For each={safeWhiteboards()}>
            {(whiteboard) => (
              <Link href={`/whiteboard/${whiteboard.id}`}>
                <Card class="flex flex-col hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div class="flex items-start justify-between gap-2">
                      <CardTitle class="text-lg line-clamp-2 flex-1">
                        {whiteboard.title}
                      </CardTitle>
                      <div class="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // TODO: 实现编辑标题功能
                          }}
                          class="text-muted-foreground hover:text-foreground transition-colors p-1"
                          title="编辑"
                        >
                          <PencilIcon class="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(whiteboard.id, e)}
                          class="text-muted-foreground hover:text-destructive transition-colors p-1"
                          title="删除"
                          disabled={deletingId() === whiteboard.id}
                        >
                          <TrashIcon class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent class="flex-1 flex flex-col justify-between">
                    <div>
                      <CardDescription>
                        元素数量: {Array.isArray(whiteboard.elements) ? whiteboard.elements.length : 0}
                      </CardDescription>
                    </div>
                    <div class="mt-4 text-xs text-muted-foreground">
                      <div>创建时间: {formatDate(whiteboard.createdAt)}</div>
                      <div>更新时间: {formatDate(whiteboard.updatedAt)}</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

