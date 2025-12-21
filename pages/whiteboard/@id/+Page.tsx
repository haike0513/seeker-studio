import { createSignal, onMount, onCleanup, Show, createEffect } from "solid-js";
import { useData } from "vike-solid/useData";
import { usePageContext } from "vike-solid/usePageContext";
import { navigate } from "vike/client/router";
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
  const [aiDialogCollapsed, setAIDialogCollapsed] = createSignal(true);
  const [chatId, setChatId] = createSignal<string | undefined>(undefined);
  const [isSaving, setIsSaving] = createSignal(false);
  const [lastSaved, setLastSaved] = createSignal<Date | null>(null);
  const [shareUrl, setShareUrl] = createSignal<string | null>(null);
  const [isSharing, setIsSharing] = createSignal(false);
  const [isExporting, setIsExporting] = createSignal(false);

  let containerRef: HTMLDivElement | undefined;

  // 工具栏拖动（相对于屏幕）
  const toolbarDrag = useDraggable({
    initialX: 16,
    initialY: 16,
    // 不设置 boundary，使用窗口边界
  });

  // AI 对话框拖动（相对于屏幕）
  const aiDialogDrag = useDraggable({
    initialX: 0,
    initialY: 0,
    // 不设置 boundary，使用窗口边界
  });

  // 跟踪用户是否手动拖动过 AI 对话框
  const [aiDialogDraggedByUser, setAiDialogDraggedByUser] = createSignal(false);
  
  // 获取对话框尺寸
  const getDialogSize = () => {
    const isCollapsed = aiDialogCollapsed();
    return {
      width: isCollapsed ? 64 : 384, // 收缩: w-16 = 64px, 展开: w-96 = 384px
      height: isCollapsed ? 64 : 600, // 收缩: h-16 = 64px, 展开: h-[600px] = 600px
    };
  };

  // 约束对话框位置，确保完全在屏幕内
  const constrainDialogPosition = (x: number, y: number) => {
    const { width, height } = getDialogSize();
    const padding = 16;
    
    // 计算最大允许位置
    const maxX = window.innerWidth - width - padding;
    const maxY = window.innerHeight - height - padding;
    
    // 确保位置在屏幕内
    const constrainedX = Math.max(padding, Math.min(x, maxX));
    const constrainedY = Math.max(padding, Math.min(y, maxY));
    
    return { x: constrainedX, y: constrainedY };
  };

  // 初始化 AI 对话框位置（屏幕右下角）
  const initializeAIDialogPosition = () => {
    const { width, height } = getDialogSize();
    const padding = 16;
    const targetX = window.innerWidth - width - padding;
    const targetY = window.innerHeight - height - padding;
    
    const { x, y } = constrainDialogPosition(targetX, targetY);
    aiDialogDrag.setPosition(x, y);
  };

  // 处理 AI 对话框拖动开始
  const handleAIDialogMouseDown = (e: MouseEvent) => {
    setAiDialogDraggedByUser(true);
    aiDialogDrag.handleMouseDown(e);
  };

  // 监听拖动状态变化，在拖动结束后约束位置
  createEffect(() => {
    const isDragging = aiDialogDrag.isDragging();
    if (!isDragging) {
      // 拖动结束，约束位置确保对话框在屏幕内
      const currentX = aiDialogDrag.x();
      const currentY = aiDialogDrag.y();
      const { x, y } = constrainDialogPosition(currentX, currentY);
      
      // 如果位置需要调整，更新位置
      if (x !== currentX || y !== currentY) {
        aiDialogDrag.setPosition(x, y);
      }
    }
  });

  // 监听折叠状态变化，自动调整位置确保在屏幕内
  createEffect(() => {
    // 读取折叠状态以触发响应式更新
    aiDialogCollapsed();
    
    if (!aiDialogDraggedByUser()) {
      // 用户没有拖动过，重新初始化位置
      initializeAIDialogPosition();
    } else {
      // 用户拖动过，只约束位置确保在屏幕内
      const currentX = aiDialogDrag.x();
      const currentY = aiDialogDrag.y();
      const { x, y } = constrainDialogPosition(currentX, currentY);
      
      // 如果位置发生了变化，更新位置
      if (x !== currentX || y !== currentY) {
        aiDialogDrag.setPosition(x, y);
      }
    }
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
                navigate(`/whiteboard/${result.data.id}`);
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
      // 使用 pageContext 获取 origin，如果没有则使用环境变量或默认值
      const baseUrl = pageContext.urlOrigin || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
      setShareUrl(`${baseUrl}/whiteboard/shared/${whiteboard.shareToken}`);
    }

    // 设置自动保存回调
    if (whiteboardId) {
      setAutoSaveCallback(async (elementsToSave) => {
        await saveWhiteboard(elementsToSave);
      });
    }

    // 初始化 AI 对话框位置（屏幕右下角）
    initializeAIDialogPosition();
    
    // 监听窗口大小变化，确保对话框始终在屏幕内
    const handleResize = () => {
      if (!aiDialogDraggedByUser()) {
        // 用户没有拖动过，重新初始化位置到右下角
        initializeAIDialogPosition();
      } else {
        // 用户拖动过后，约束位置确保对话框在屏幕内
        const currentX = aiDialogDrag.x();
        const currentY = aiDialogDrag.y();
        const { x, y } = constrainDialogPosition(currentX, currentY);
        
        // 如果位置需要调整，更新位置
        if (x !== currentX || y !== currentY) {
          aiDialogDrag.setPosition(x, y);
        }
      }
    };
    
    window.addEventListener("resize", handleResize);
    
    onCleanup(() => {
      window.removeEventListener("resize", handleResize);
    });
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
      </div>

      {/* 悬浮工具栏（固定定位，相对于屏幕） */}
      <div
        class="fixed z-10"
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

      {/* 悬浮 AI 对话框（固定定位，相对于屏幕） */}
      <div
        class="fixed z-20"
        style={{
          left: `${aiDialogDrag.x()}px`,
          top: `${aiDialogDrag.y()}px`,
        }}
        onMouseDown={handleAIDialogMouseDown}
      >
        <WhiteboardAIDialog
          chatId={chatId()}
          collapsed={aiDialogCollapsed()}
          onToggleCollapse={() => setAIDialogCollapsed(!aiDialogCollapsed())}
        />
      </div>
    </div>
  );
}

