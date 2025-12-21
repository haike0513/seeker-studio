import { createSignal, onMount, onCleanup, Show, createEffect } from "solid-js";
import { useData } from "vike-solid/useData";
import { usePageContext } from "vike-solid/usePageContext";
import { navigate } from "vike/client/router";
import { WhiteboardCanvas, WhiteboardToolbar } from "@/components/whiteboard";
import WhiteboardAIDialog from "@/components/whiteboard/WhiteboardAIDialog";
import { importData, setAutoSaveCallback, elements } from "@/lib/whiteboard/store";
import { Button } from "@/components/ui/button";
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

  // 工具栏拖动（使用 sticky + transform 偏移，左上角定位）
  const [toolbarOffsetX, setToolbarOffsetX] = createSignal(0);
  const [toolbarOffsetY, setToolbarOffsetY] = createSignal(0);
  const [isToolbarDragging, setIsToolbarDragging] = createSignal(false);

  let toolbarDragStartX = 0;
  let toolbarDragStartY = 0;
  let toolbarDragStartOffsetX = 0;
  let toolbarDragStartOffsetY = 0;

  // 获取工具栏尺寸
  const getToolbarSize = () => {
    const isCollapsed = toolbarCollapsed();
    // 工具栏宽度大约 320px (max-w-xs)，高度根据内容变化，估算
    return {
      width: isCollapsed ? 120 : 320,
      height: isCollapsed ? 60 : 500, // 估算高度
    };
  };

  // 约束工具栏位置，确保在画布可视区域内
  const constrainToolbarOffset = (offsetX: number, offsetY: number) => {
    if (!containerRef) return { x: offsetX, y: offsetY };

    const containerRect = containerRef.getBoundingClientRect();
    const { width, height } = getToolbarSize();
    const padding = 24; // sticky 的 top 和 left 都是 24px

    // 计算允许的偏移范围
    // 由于是 sticky 定位在左上角，初始位置是 top: 24px, left: 24px
    // transform translate 向右为正（+X），向下为正（+Y）
    
    // offsetX 约束：
    // - 初始位置（offsetX=0）：工具栏左边缘距离容器左边缘 = padding
    // - 最大向右偏移：工具栏右边缘刚好贴容器右边缘
    const maxOffsetX = containerRect.width - width - padding;
    const minOffsetX = -padding; // 向左移动不能超出左边界

    // offsetY 约束：
    // - 初始位置（offsetY=0）：工具栏上边缘距离容器上边缘 = padding
    // - 最大向下偏移：工具栏下边缘刚好贴容器下边缘
    const maxOffsetY = containerRect.height - height - padding;
    const minOffsetY = -padding; // 向上移动不能超出上边界

    return {
      x: Math.max(minOffsetX, Math.min(offsetX, maxOffsetX)),
      y: Math.max(minOffsetY, Math.min(offsetY, maxOffsetY)),
    };
  };

  // 处理工具栏拖动开始
  const handleToolbarMouseDown = (e: MouseEvent) => {
    // 只响应在拖动句柄上的点击
    const target = e.target as HTMLElement;
    const isDraggableArea = target.closest("[data-draggable-handle]");
    if (!isDraggableArea && !target.hasAttribute("data-draggable-handle")) {
      return;
    }
    
    // 如果点击的是按钮，不触发拖动
    if (target.closest("button") || target.tagName === "BUTTON") {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    setIsToolbarDragging(true);
    toolbarDragStartX = e.clientX;
    toolbarDragStartY = e.clientY;
    toolbarDragStartOffsetX = toolbarOffsetX();
    toolbarDragStartOffsetY = toolbarOffsetY();

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - toolbarDragStartX;
      const deltaY = e.clientY - toolbarDragStartY;
      const newOffsetX = toolbarDragStartOffsetX + deltaX;
      const newOffsetY = toolbarDragStartOffsetY + deltaY;
      
      // 约束位置
      const { x, y } = constrainToolbarOffset(newOffsetX, newOffsetY);
      setToolbarOffsetX(x);
      setToolbarOffsetY(y);
    };

    const handleMouseUp = () => {
      setIsToolbarDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // 监听工具栏折叠状态变化，重新约束位置确保工具栏在可视区域内
  createEffect(() => {
    // 读取折叠状态以触发响应式更新
    toolbarCollapsed();
    
    // 使用 requestAnimationFrame 确保 DOM 已更新尺寸
    requestAnimationFrame(() => {
      if (!containerRef) return;
      
      // 重新约束当前位置
      const currentX = toolbarOffsetX();
      const currentY = toolbarOffsetY();
      const { x, y } = constrainToolbarOffset(currentX, currentY);
      
      // 如果位置需要调整，更新位置
      if (x !== currentX || y !== currentY) {
        setToolbarOffsetX(x);
        setToolbarOffsetY(y);
      }
    });
  });

  // AI 对话框拖动（使用 sticky + transform 偏移）
  const [aiDialogOffsetX, setAiDialogOffsetX] = createSignal(0);
  const [aiDialogOffsetY, setAiDialogOffsetY] = createSignal(0);
  const [isDragging, setIsDragging] = createSignal(false);

  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartOffsetX = 0;
  let dragStartOffsetY = 0;

  // 获取对话框尺寸
  const getDialogSize = () => {
    const isCollapsed = aiDialogCollapsed();
    return {
      width: isCollapsed ? 64 : 384,
      height: isCollapsed ? 64 : 600,
    };
  };

  // 约束对话框位置，确保在画布可视区域内
  const constrainDialogOffset = (offsetX: number, offsetY: number) => {
    if (!containerRef) return { x: offsetX, y: offsetY };

    const containerRect = containerRef.getBoundingClientRect();
    const { width, height } = getDialogSize();
    const padding = 24; // sticky 的 bottom 和 margin-right 都是 24px

    // 计算允许的偏移范围
    // 由于是 sticky 定位在右下角，初始位置是 bottom: 24px, right: 24px（通过 margin-right: 24px 实现）
    // transform translate 向右为正（+X），向下为正（+Y）
    
    // offsetX 约束：
    // - 初始位置（offsetX=0）：对话框右边缘距离容器右边缘 = 24px
    // - 最大向右偏移：对话框右边缘刚好贴容器右边缘，offsetX = containerRect.width - width - padding
    // - 最大向左偏移：对话框左边缘刚好贴容器左边缘，offsetX = -(containerRect.width - width - padding)
    const maxOffsetX = containerRect.width - width - padding;
    const minOffsetX = -(containerRect.width - width - padding);

    // offsetY 约束：
    // - 初始位置（offsetY=0）：对话框下边缘距离容器下边缘 = padding
    // - 最大向下偏移：offsetY = 0（保持 sticky 的 bottom: padding）
    // - 最大向上偏移：对话框上边缘刚好贴容器上边缘
    //   初始位置距离底部 padding，向上移动 (containerRect.height - height - padding) 后上边缘贴顶部
    const maxOffsetY = 0;
    const minOffsetY = -(containerRect.height - height - padding);

    return {
      x: Math.max(minOffsetX, Math.min(offsetX, maxOffsetX)),
      y: Math.max(minOffsetY, Math.min(offsetY, maxOffsetY)),
    };
  };

  // 处理 AI 对话框拖动开始
  const handleAIDialogMouseDown = (e: MouseEvent) => {
    // 只响应在拖动句柄上的点击
    const target = e.target as HTMLElement;
    const isDraggableArea = target.closest("[data-draggable-handle]");
    if (!isDraggableArea && !target.hasAttribute("data-draggable-handle")) {
      return;
    }
    
    // 如果点击的是按钮，不触发拖动
    if (target.closest("button") || target.tagName === "BUTTON") {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartOffsetX = aiDialogOffsetX();
    dragStartOffsetY = aiDialogOffsetY();

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      const newOffsetX = dragStartOffsetX + deltaX;
      const newOffsetY = dragStartOffsetY + deltaY;
      
      // 约束位置
      const { x, y } = constrainDialogOffset(newOffsetX, newOffsetY);
      setAiDialogOffsetX(x);
      setAiDialogOffsetY(y);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // 监听折叠状态变化，重新约束位置确保对话框在可视区域内
  createEffect(() => {
    // 读取折叠状态以触发响应式更新
    aiDialogCollapsed();
    
    // 使用 requestAnimationFrame 确保 DOM 已更新尺寸
    requestAnimationFrame(() => {
      if (!containerRef) return;
      
      // 重新约束当前位置
      const currentX = aiDialogOffsetX();
      const currentY = aiDialogOffsetY();
      const { x, y } = constrainDialogOffset(currentX, currentY);
      
      // 如果位置需要调整，更新位置
      if (x !== currentX || y !== currentY) {
        setAiDialogOffsetX(x);
        setAiDialogOffsetY(y);
      }
    });
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
      // 使用 window.location.origin 获取 origin
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      setShareUrl(`${baseUrl}/whiteboard/shared/${whiteboard.shareToken}`);
    }

    // 设置自动保存回调
    if (whiteboardId) {
      setAutoSaveCallback(async (elementsToSave) => {
        await saveWhiteboard(elementsToSave);
      });
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
      <div ref={containerRef} class="flex-1 min-h-0 relative overflow-hidden">
        {/* 画布区域 */}
        <div class="absolute inset-0">
          <WhiteboardCanvas />
        </div>

        {/* 悬浮工具栏和 AI 对话框（使用 sticky 定位 + transform 拖动） */}
        <div class="absolute inset-0 pointer-events-none">
          <div class="h-full flex flex-col">
            {/* 工具栏（左上角） */}
            <div 
              class="sticky top-6 left-6 pointer-events-auto z-10 w-fit" 
              style={{ 
                transform: `translate(${toolbarOffsetX()}px, ${toolbarOffsetY()}px)`,
                transition: isToolbarDragging() ? "none" : "transform 0.2s ease-out"
              }}
              onMouseDown={handleToolbarMouseDown}
            >
              <WhiteboardToolbar
                collapsed={toolbarCollapsed()}
                onToggleCollapse={() => setToolbarCollapsed(!toolbarCollapsed())}
              />
            </div>

            {/* AI 对话框（右下角） */}
            <div class="flex-1" />
            <div 
              class="sticky bottom-6 ml-auto pointer-events-auto z-20 w-fit" 
              style={{ 
                "margin-right": "24px",
                transform: `translate(${aiDialogOffsetX()}px, ${aiDialogOffsetY()}px)`,
                transition: isDragging() ? "none" : "transform 0.2s ease-out"
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
        </div>
      </div>
    </div>
  );
}

