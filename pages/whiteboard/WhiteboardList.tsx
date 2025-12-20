import type { Data } from "./+data";
import { createSignal } from "solid-js";
import { useData } from "vike-solid/useData";
import { navigate } from "vike/client/router";
import { Link } from "@/components/Link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/ui/card";
import { Button } from "@/registry/ui/button";
import { PaginatedList } from "@/components/PaginatedList";
import { usePagination } from "@/lib/hooks/usePagination";
import { PlusIcon, PencilIcon, TrashIcon, MoreVerticalIcon, DownloadIcon, LinkIcon } from "lucide-solid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/ui/dropdown-menu";
import type { Whiteboard } from "@/database/drizzle/schema/whiteboard";
import { toast } from "somoto";

export function WhiteboardList() {
  const initialData = useData<Data>();
  const [deletingId, setDeletingId] = createSignal<string | null>(null);
  const [isCreating, setIsCreating] = createSignal(false);
  const [exportingId, setExportingId] = createSignal<string | null>(null);
  const [sharingId, setSharingId] = createSignal<string | null>(null);
  
  // 使用分页 hook
  const pagination = usePagination<Whiteboard>({
    apiUrl: "/api/whiteboards",
    pageSize: 12,
    initialData: initialData,
    // 自定义转换函数，兼容 whiteboards 字段
    transformResponse: (data, currentPage, pageSize) => {
      const json = data as { success?: boolean; data?: unknown };
      const responseData = json.data || json;
      
      if (responseData && typeof responseData === "object") {
        // 标准格式
        if ("items" in responseData) {
          const paginated = responseData as { items: Whiteboard[]; total?: number; page?: number; pageSize?: number; hasMore?: boolean };
          return {
            items: paginated.items || [],
            total: paginated.total || 0,
            page: paginated.page || currentPage,
            pageSize: paginated.pageSize || pageSize,
            hasMore: paginated.hasMore ?? false,
          };
        }
        
        // 兼容旧格式（whiteboards 字段）
        if ("whiteboards" in responseData) {
          const items = (responseData as { whiteboards?: Whiteboard[] }).whiteboards || [];
          return {
            items,
            total: (responseData as { total?: number }).total || 0,
            page: (responseData as { page?: number }).page || currentPage,
            pageSize: (responseData as { pageSize?: number }).pageSize || pageSize,
            hasMore: false,
          };
        }
      }
      
      return {
        items: [],
        total: 0,
        page: currentPage,
        pageSize,
        hasMore: false,
      };
    },
  });

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
        void pagination.refetch();
        setDeletingId(null);
      } else {
        setDeletingId(null);
      }
    } catch (error) {
      console.error("删除画板失败:", error);
      setDeletingId(null);
    }
  };

  const handleExportJSON = async (id: string, title: string, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExportingId(id);
    try {
      const res = await fetch(`/api/whiteboards/${id}/export/json`, {
        credentials: "include",
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title || "whiteboard"}.excalidraw`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("导出成功");
      } else {
        throw new Error("导出失败");
      }
    } catch (error) {
      console.error("导出失败:", error);
      toast.error("导出失败，请重试");
    } finally {
      setExportingId(null);
    }
  };

  const handleExportSVG = async (id: string, title: string, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExportingId(id);
    try {
      const res = await fetch(`/api/whiteboards/${id}/export/svg`, {
        credentials: "include",
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title || "whiteboard"}.svg`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("导出成功");
      } else {
        throw new Error("导出失败");
      }
    } catch (error) {
      console.error("导出失败:", error);
      toast.error("导出失败，请重试");
    } finally {
      setExportingId(null);
    }
  };

  const handleCopyShareLink = async (whiteboard: Whiteboard, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSharingId(whiteboard.id);
    try {
      let shareUrl = "";
      if (whiteboard.shareToken) {
        shareUrl = `${window.location.origin}/whiteboard/shared/${whiteboard.shareToken}`;
      } else {
        // 启用分享
        const res = await fetch(`/api/whiteboards/${whiteboard.id}/share`, {
          method: "POST",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data?.shareUrl) {
            shareUrl = data.data.shareUrl;
            toast.success("分享链接已生成");
          } else {
            throw new Error("生成分享链接失败");
          }
        } else {
          throw new Error("生成分享链接失败");
        }
      }
      
      if (shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("链接已复制到剪贴板");
      }
    } catch (error) {
      console.error("复制分享链接失败:", error);
      toast.error("操作失败，请重试");
    } finally {
      setSharingId(null);
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

      <PaginatedList
        pagination={pagination}
        listClassName="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        emptyState={
          <div class="text-center py-12">
            <p class="text-muted-foreground">还没有画板</p>
            <p class="text-sm text-muted-foreground mt-2">
              点击"新建画板"按钮开始创建
            </p>
          </div>
        }
        renderItem={(whiteboard) => (
          <Link href={`/whiteboard/${whiteboard.id}`}>
            <Card class="flex flex-col hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div class="flex items-start justify-between gap-2">
                  <CardTitle class="text-lg line-clamp-2 flex-1">
                    {whiteboard.title}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      as="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      class="text-muted-foreground hover:text-foreground transition-colors p-1"
                      disabled={exportingId() === whiteboard.id || sharingId() === whiteboard.id}
                    >
                      <MoreVerticalIcon class="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem
                        onClick={(e) => handleExportJSON(whiteboard.id, whiteboard.title, e)}
                        disabled={exportingId() === whiteboard.id}
                      >
                        <DownloadIcon class="w-4 h-4 mr-2" />
                        导出为 JSON
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => handleExportSVG(whiteboard.id, whiteboard.title, e)}
                        disabled={exportingId() === whiteboard.id}
                      >
                        <DownloadIcon class="w-4 h-4 mr-2" />
                        导出为 SVG
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => handleCopyShareLink(whiteboard, e)}
                        disabled={sharingId() === whiteboard.id}
                      >
                        <LinkIcon class="w-4 h-4 mr-2" />
                        复制分享链接
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // TODO: 实现编辑标题功能
                        }}
                      >
                        <PencilIcon class="w-4 h-4 mr-2" />
                        编辑标题
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => handleDelete(whiteboard.id, e)}
                        disabled={deletingId() === whiteboard.id}
                        variant="destructive"
                      >
                        <TrashIcon class="w-4 h-4 mr-2" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
      />
    </div>
  );
}

