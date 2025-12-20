import { createSignal, onMount } from "solid-js";
import { WhiteboardCanvas, WhiteboardToolbar } from "@/components/whiteboard";
import WhiteboardAIDialog from "@/components/whiteboard/WhiteboardAIDialog";
import { useDraggable } from "@/lib/whiteboard/useDraggable";

export default function WhiteboardPage() {
  const [toolbarCollapsed, setToolbarCollapsed] = createSignal(false);
  const [aiDialogCollapsed, setAIDialogCollapsed] = createSignal(false);
  const [chatId, setChatId] = createSignal<string | undefined>(undefined);

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

  // 创建画板专用的聊天会话并初始化对话框位置
  onMount(async () => {
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

  return (
    <div class="flex flex-col h-full min-h-0 relative p-4">
      {/* 标题栏 */}
      <div class="flex items-center justify-between p-4 border-b border-border bg-background shrink-0">
        <h1 class="text-2xl font-bold">画板</h1>
        <p class="text-sm text-muted-foreground">
          类似 Excalidraw 的绘图工具
        </p>
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

