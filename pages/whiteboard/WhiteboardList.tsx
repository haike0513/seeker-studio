import type { Data } from "./+data";
import { For, Show, createSignal, createResource } from "solid-js";
import { useData } from "vike-solid/useData";
import { navigate } from "vike/client/router";
import { Link } from "@/components/Link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/ui/card";
import { Button } from "@/registry/ui/button";
import {
  Pagination,
  PaginationItems,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { PlusIcon, PencilIcon, TrashIcon } from "lucide-solid";

export function WhiteboardList() {
  const initialData = useData<Data>();
  // 将 initialData 转换为标准格式（兼容旧格式）
  const normalizedInitialData = initialData.items 
    ? initialData 
    : { 
        items: (initialData as any).whiteboards || [], 
        total: initialData.total || 0, 
        page: initialData.page || 1, 
        pageSize: initialData.pageSize || 12,
        hasMore: initialData.hasMore || false,
      };
  
  const [page, setPage] = createSignal(normalizedInitialData.page || 1);
  const pageSize = normalizedInitialData.pageSize || 12;
  
  const [whiteboardsData, { refetch }] = createResource(
    () => page(),
    async (currentPage) => {
      const res = await fetch(`/api/whiteboards?page=${currentPage}&pageSize=${pageSize}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch whiteboards");
      }
      const json = await res.json();
      // 支持标准分页格式 (items) 和旧格式 (whiteboards) 的兼容
      const data = json.data || {};
      if (data.items) {
        // 标准分页格式
        return {
          items: data.items,
          total: data.total || 0,
          page: data.page || currentPage,
          pageSize: data.pageSize || pageSize,
          hasMore: data.hasMore || false,
        };
      } else {
        // 兼容旧格式
        return {
          items: data.whiteboards || [],
          total: data.total || 0,
          page: data.page || currentPage,
          pageSize: data.pageSize || pageSize,
          hasMore: false,
        };
      }
    },
    { initialValue: normalizedInitialData }
  );
  
  const [whiteboards, setWhiteboards] = createSignal(
    () => whiteboardsData()?.items || []
  );
  const [deletingId, setDeletingId] = createSignal<string | null>(null);
  const [isCreating, setIsCreating] = createSignal(false);
  
  const total = () => whiteboardsData()?.total || 0;
  const totalPages = () => Math.ceil(total() / pageSize);
  const currentPage = () => whiteboardsData()?.page || page();

  const safeWhiteboards = () => whiteboards();
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages()) {
      setPage(newPage);
      // 更新 URL 但不刷新页面
      const url = new URL(window.location.href);
      url.searchParams.set("page", newPage.toString());
      window.history.pushState({}, "", url.toString());
    }
  };

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
        // 刷新数据以更新列表和总数
        void refetch();
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
      
      <Show when={total() > pageSize}>
        <Pagination
          count={totalPages()}
          page={currentPage()}
          onPageChange={handlePageChange}
          fixedItems
          itemComponent={(props) => <PaginationItem page={props.page} />}
          ellipsisComponent={(props) => <PaginationEllipsis />}
        >
          <PaginationPrevious />
          <PaginationItems />
          <PaginationNext />
        </Pagination>
      </Show>
    </div>
  );
}

