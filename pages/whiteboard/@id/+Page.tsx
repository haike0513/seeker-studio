import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { useData } from "vike-solid/useData";
import { usePageContext } from "vike-solid/usePageContext";
import { WhiteboardCanvas, WhiteboardToolbar } from "@/components/whiteboard";
import WhiteboardAIDialog from "@/components/whiteboard/WhiteboardAIDialog";
import { useDraggable } from "@/lib/whiteboard/useDraggable";
import { importData, setAutoSaveCallback, elements } from "@/lib/whiteboard/store";
import { Button } from "@/registry/ui/button";
import { SaveIcon, CheckIcon } from "lucide-solid";
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

