import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { useData } from "vike-solid/useData";
import { usePageContext } from "vike-solid/usePageContext";
import { WhiteboardCanvas, WhiteboardToolbar } from "@/components/whiteboard";
import WhiteboardAIDialog from "@/components/whiteboard/WhiteboardAIDialog";
import { useDraggable } from "@/lib/whiteboard/useDraggable";
import { importData, setAutoSaveCallback, elements } from "@/lib/whiteboard/store";
import { Button } from "@/registry/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/ui/dropdown-menu";
import { SaveIcon, CheckIcon, MoreVerticalIcon, DownloadIcon, CopyIcon, UploadIcon, LinkIcon, Link2OffIcon } from "lucide-solid";
import { toast } from "somoto";
import type { Data } from "./+data";

export default function WhiteboardPage() {
  const { whiteboard } = useData<Data>();
  const pageContext = usePageContext();
  const whiteboardId = pageContext.routeParams?.id;
  const [toolbarCollapsed, setToolbarCollapsed] = createSignal(false);
  const [aiDialogCollapsed, setAIDialogCollapsed] = createSignal(false);
  const [chatId, setChatId] = createSignal<string | undefined>(undefined);
  const [isSaving, setIsSaving] = createSignal(false);
  const [lastSaved, setLastSaved] = createSignal<Date | null>(null);
  const [shareUrl, setShareUrl] = createSignal<string | null>(null);
  const [isSharing, setIsSharing] = createSignal(false);
  const [isExporting, setIsExporting] = createSignal(false);

  let containerRef: HTMLDivElement | undefined;

  // 工具栏拖动
  const toolbarDrag = useDraggable({
    initialX: 16,
    initialY: 16,
    boundary: () => containerRef,
  });

  // AI 对话框拖动
  const aiDialogDrag = useDraggable({
    initialX: 16,
    initialY: 16,
    boundary: () => containerRef,
  });

  // 保存画板数据到服务器
  const saveWhiteboard = async (elementsToSave: ReturnType<typeof elements>) => {
    if (!whiteboardId) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/whiteboards/${whiteboardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          elements: elementsToSave,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setLastSaved(new Date());
          return true;
        } else {
          throw new Error(data.error?.message || "保存失败");
        }
      } else {
        throw new Error("保存失败");
      }
    } catch (error) {
      console.error("保存画板失败:", error);
      toast.error("保存失败，请重试");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // 手动保存
  const handleManualSave = async () => {
    const currentElements = elements();
    const success = await saveWhiteboard(currentElements);
    if (success) {
      toast.success("保存成功");
    }
  };

  // 导出为JSON
  const handleExportJSON = async () => {
    if (!whiteboardId) return;
    setIsExporting(true);
    try {
      const res = await fetch(`/api/whiteboards/${whiteboardId}/export/json`, {
        credentials: "include",
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${whiteboard?.title || "whiteboard"}.excalidraw`;
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
      setIsExporting(false);
    }
  };

  // 导出为SVG
  const handleExportSVG = async () => {
    if (!whiteboardId) return;
    setIsExporting(true);
    try {
      const res = await fetch(`/api/whiteboards/${whiteboardId}/export/svg`, {
        credentials: "include",
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${whiteboard?.title || "whiteboard"}.svg`;
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
      setIsExporting(false);
    }
  };

  // 启用分享
  const handleEnableSharing = async () => {
    if (!whiteboardId) return;
    setIsSharing(true);
    try {
      const res = await fetch(`/api/whiteboards/${whiteboardId}/share`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.shareUrl) {
          setShareUrl(data.data.shareUrl);
          toast.success("分享链接已生成");
        } else {
          throw new Error("生成分享链接失败");
        }
      } else {
        throw new Error("生成分享链接失败");
      }
    } catch (error) {
      console.error("生成分享链接失败:", error);
      toast.error("生成分享链接失败，请重试");
    } finally {
      setIsSharing(false);
    }
  };

  // 禁用分享
  const handleDisableSharing = async () => {
    if (!whiteboardId) return;
    setIsSharing(true);
    try {
      const res = await fetch(`/api/whiteboards/${whiteboardId}/share`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setShareUrl(null);
        toast.success("已禁用分享");
      } else {
        throw new Error("禁用分享失败");
      }
    } catch (error) {
      console.error("禁用分享失败:", error);
      toast.error("禁用分享失败，请重试");
    } finally {
      setIsSharing(false);
    }
  };

  // 复制分享链接
  const handleCopyShareLink = async () => {
    const url = shareUrl();
    if (!url) {
      await handleEnableSharing();
      // 等待分享链接生成
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("链接已复制到剪贴板");
    } catch (error) {
      console.error("复制失败:", error);
      toast.error("复制失败，请手动复制");
    }
  };

  // 从服务器导入
  const handleImportFromServer = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.excalidraw";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !whiteboardId) return;

      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const data = event.target?.result as string;
          if (!data) return;

          try {
            const jsonData = JSON.parse(data);
            const res = await fetch("/api/whiteboards/import", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                data: jsonData,
                title: `${whiteboard?.title || "画板"} (导入)`,
              }),
            });

            if (res.ok) {
              const result = await res.json();
              if (result.success && result.data?.id) {
                // 跳转到新导入的画板
                window.location.href = `/whiteboard/${result.data.id}`;
                toast.success("导入成功");
              }
            } else {
              throw new Error("导入失败");
            }
          } catch (error) {
            console.error("导入失败:", error);
            toast.error("导入失败，请检查文件格式");
          }
        };
        reader.readAsText(file);
      } catch (error) {
        console.error("读取文件失败:", error);
        toast.error("读取文件失败");
      }
    };
    input.click();
  };

  // 创建画板专用的聊天会话并初始化对话框位置
  onMount(async () => {
    // 加载画板数据
    if (whiteboard && whiteboard.elements) {
      try {
        // 将画板的 elements 数据导入到 store
        const dataToImport = {
          elements: Array.isArray(whiteboard.elements) ? whiteboard.elements : [],
          version: "1.0",
        };
        importData(JSON.stringify(dataToImport), true); // skipAutoSave = true，避免立即保存
      } catch (error) {
        console.error("加载画板数据失败:", error);
      }
    }

    // 检查是否有分享链接
    if (whiteboard?.shareToken) {
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/whiteboard/shared/${whiteboard.shareToken}`);
    }

    // 设置自动保存回调
    if (whiteboardId) {
      setAutoSaveCallback(async (elementsToSave) => {
        await saveWhiteboard(elementsToSave);
      });
    }

    // 初始化 AI 对话框位置（右下角）
    if (containerRef) {
      const rect = containerRef.getBoundingClientRect();
      aiDialogDrag.setPosition(Math.max(16, rect.width - 400 - 16), Math.max(16, rect.height - 650 - 16));
    }
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: "画板助手",
          enableSuggestions: false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.id) {
          setChatId(data.data.id);
        }
      }
    } catch (error) {
      console.error("创建画板聊天会话失败:", error);
    }
  });

  // 清理自动保存回调
  onCleanup(() => {
    setAutoSaveCallback(null);
  });

  return (
    <div class="flex flex-col h-full min-h-0 relative p-4">
      {/* 标题栏 */}
      <div class="flex items-center justify-between p-4 border-b border-border bg-background shrink-0">
        <div class="flex-1">
          <h1 class="text-2xl font-bold">{whiteboard?.title || "画板"}</h1>
          <p class="text-sm text-muted-foreground">
            类似 Excalidraw 的绘图工具
          </p>
        </div>
        <div class="flex items-center gap-3">
          <Show when={lastSaved()}>
            <span class="text-xs text-muted-foreground flex items-center gap-1">
              <CheckIcon class="w-3 h-3" />
              已保存 {lastSaved()!.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </Show>
          <Button
            onClick={handleManualSave}
            disabled={isSaving()}
            variant="outline"
            size="sm"
          >
            <SaveIcon class="w-4 h-4 mr-2" />
            {isSaving() ? "保存中..." : "保存"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger as="button" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3" disabled={isExporting() || isSharing()}>
              <MoreVerticalIcon class="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportJSON} disabled={isExporting()}>
                <DownloadIcon class="w-4 h-4 mr-2" />
                导出为 JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportSVG} disabled={isExporting()}>
                <DownloadIcon class="w-4 h-4 mr-2" />
                导出为 SVG
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Show when={shareUrl()}>
                <DropdownMenuItem onClick={handleCopyShareLink}>
                  <CopyIcon class="w-4 h-4 mr-2" />
                  复制分享链接
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDisableSharing} disabled={isSharing()}>
                  <Link2OffIcon class="w-4 h-4 mr-2" />
                  禁用分享
                </DropdownMenuItem>
              </Show>
              <Show when={!shareUrl()}>
                <DropdownMenuItem onClick={handleEnableSharing} disabled={isSharing()}>
                  <LinkIcon class="w-4 h-4 mr-2" />
                  启用分享
                </DropdownMenuItem>
              </Show>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleImportFromServer}>
                <UploadIcon class="w-4 h-4 mr-2" />
                从文件导入
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div ref={containerRef} class="flex-1 min-h-0 overflow-hidden relative">
        {/* 画布区域 */}
        <div class="absolute inset-0">
          <WhiteboardCanvas />
        </div>

        {/* 悬浮工具栏 */}
        <div
          class="absolute z-10"
          style={{
            left: `${toolbarDrag.x()}px`,
            top: `${toolbarDrag.y()}px`,
          }}
          onMouseDown={toolbarDrag.handleMouseDown}
        >
          <WhiteboardToolbar
            collapsed={toolbarCollapsed()}
            onToggleCollapse={() => setToolbarCollapsed(!toolbarCollapsed())}
          />
        </div>

        {/* 悬浮 AI 对话框 */}
        <div
          class="absolute z-20"
          style={{
            left: `${aiDialogDrag.x()}px`,
            top: `${aiDialogDrag.y()}px`,
          }}
          onMouseDown={aiDialogDrag.handleMouseDown}
        >
          <WhiteboardAIDialog
            chatId={chatId()}
            collapsed={aiDialogCollapsed()}
            onToggleCollapse={() => setAIDialogCollapsed(!aiDialogCollapsed())}
          />
        </div>
      </div>
    </div>
  );
}

