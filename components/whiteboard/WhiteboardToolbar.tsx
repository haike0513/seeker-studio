import { For, Show } from "solid-js";
import { Button } from "@/registry/ui/button";
import {
  tool,
  color,
  strokeWidth,
  fontSize,
  setTool,
  setColor,
  setStrokeWidth,
  setFontSize,
  undo,
  redo,
  canUndo,
  canRedo,
  clearCanvas,
  exportData,
  importData,
} from "@/lib/whiteboard/store.js";
import type { DrawingTool } from "@/lib/whiteboard/types.js";

const tools: Array<{ id: DrawingTool; label: string; icon: string }> = [
  { id: "select", label: "选择", icon: "↖" },
  { id: "pen", label: "画笔", icon: "✏" },
  { id: "rectangle", label: "矩形", icon: "▭" },
  { id: "circle", label: "圆形", icon: "○" },
  { id: "line", label: "直线", icon: "─" },
  { id: "text", label: "文本", icon: "T" },
  { id: "eraser", label: "橡皮", icon: "🧹" },
];

interface WhiteboardToolbarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function WhiteboardToolbar(props: WhiteboardToolbarProps = {}) {
  const handleExport = () => {
    // 导出为 JSON
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whiteboard-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSVG = () => {
    // 导出为 SVG
    const svgElement = document.querySelector("svg");
    if (!svgElement) return;
    
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whiteboard-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const data = event.target?.result as string;
          if (data) {
            importData(data);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const collapsed = () => props.collapsed ?? false;

  return (
    <div class="flex flex-col gap-3 p-3 bg-background/95 backdrop-blur-sm rounded-lg border border-border shadow-lg max-w-xs">
      {/* 折叠/展开按钮 */}
      <Show when={props.onToggleCollapse}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={props.onToggleCollapse}
          class="self-end"
          title={collapsed() ? "展开工具栏" : "折叠工具栏"}
        >
          {collapsed() ? "▶" : "▼"}
        </Button>
      </Show>

      <Show when={!collapsed()}>
        {/* 工具选择 */}
        <div class="flex flex-wrap gap-2">
          <For each={tools}>
            {(toolItem) => (
              <Button
                variant={tool() === toolItem.id ? "default" : "outline"}
                size="sm"
                onClick={() => setTool(toolItem.id)}
                title={toolItem.label}
                class="flex-1 min-w-[60px]"
              >
                <span class="text-lg">{toolItem.icon}</span>
                <span class="ml-1 text-xs">{toolItem.label}</span>
              </Button>
            )}
          </For>
        </div>

        {/* 颜色选择 */}
        <div class="flex items-center gap-2">
          <label class="text-xs font-medium whitespace-nowrap">颜色:</label>
          <input
            type="color"
            value={color()}
            onInput={(e) => setColor(e.currentTarget.value)}
            class="h-8 w-16 rounded border border-border cursor-pointer"
          />
          <span class="text-xs text-muted-foreground font-mono">{color()}</span>
        </div>

        {/* 笔触宽度 */}
        <Show when={tool() === "pen" || tool() === "line" || tool() === "eraser"}>
          <div class="flex items-center gap-2">
            <label class="text-xs font-medium whitespace-nowrap">笔触:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={strokeWidth()}
              onInput={(e) => setStrokeWidth(Number(e.currentTarget.value))}
              class="flex-1"
            />
            <span class="text-xs text-muted-foreground w-6 text-right">{strokeWidth()}</span>
          </div>
        </Show>

        {/* 字体大小 */}
        <Show when={tool() === "text"}>
          <div class="flex items-center gap-2">
            <label class="text-xs font-medium whitespace-nowrap">字体:</label>
            <input
              type="range"
              min="12"
              max="72"
              value={fontSize()}
              onInput={(e) => setFontSize(Number(e.currentTarget.value))}
              class="flex-1"
            />
            <span class="text-xs text-muted-foreground w-6 text-right">{fontSize()}</span>
          </div>
        </Show>

        {/* 操作按钮 */}
        <div class="flex flex-wrap gap-1.5 pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={undo} disabled={!canUndo()} title="撤销">
            ↶
          </Button>
          <Button variant="outline" size="sm" onClick={redo} disabled={!canRedo()} title="重做">
            ↷
          </Button>
          <Button variant="outline" size="sm" onClick={clearCanvas} title="清空">
            🗑
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} title="导出 JSON">
            💾
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportSVG} title="导出 SVG">
            🖼
          </Button>
          <Button variant="outline" size="sm" onClick={handleImport} title="导入">
            📁
          </Button>
        </div>
      </Show>

      {/* 折叠状态：只显示工具图标 */}
      <Show when={collapsed()}>
        <div class="flex flex-col gap-1">
          <For each={tools}>
            {(toolItem) => (
              <Button
                variant={tool() === toolItem.id ? "default" : "outline"}
                size="icon"
                onClick={() => setTool(toolItem.id)}
                title={toolItem.label}
                class="w-10 h-10"
              >
                <span class="text-lg">{toolItem.icon}</span>
              </Button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

