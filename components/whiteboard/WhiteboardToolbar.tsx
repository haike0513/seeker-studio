import { For, Show } from "solid-js";
import { Button } from "@/components/ui/button";
import {
  MousePointer2,
  Pen,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Diamond,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Upload,
  Image as ImageIcon,
} from "lucide-solid";
import {
  tool,
  color,
  strokeWidth,
  fontSize,
  fillColor,
  setTool,
  setColor,
  setStrokeWidth,
  setFontSize,
  setFillColor,
  undo,
  redo,
  canUndo,
  canRedo,
  clearCanvas,
  exportData,
  importData,
} from "@/lib/whiteboard/store.js";
import type { DrawingTool } from "@/lib/whiteboard/types.js";

const tools: Array<{ 
  id: DrawingTool; 
  label: string; 
  icon: () => JSX.Element;
  category: "select" | "draw" | "shape" | "other";
}> = [
  { id: "select", label: "选择", icon: () => <MousePointer2 size={18} />, category: "select" },
  { id: "pen", label: "画笔", icon: () => <Pen size={18} />, category: "draw" },
  { id: "rectangle", label: "矩形", icon: () => <Square size={18} />, category: "shape" },
  { id: "circle", label: "圆形", icon: () => <Circle size={18} />, category: "shape" },
  { id: "diamond", label: "菱形", icon: () => <Diamond size={18} />, category: "shape" },
  { id: "line", label: "直线", icon: () => <Minus size={18} />, category: "shape" },
  { id: "arrow", label: "箭头", icon: () => <ArrowRight size={18} />, category: "shape" },
  { id: "text", label: "文本", icon: () => <Type size={18} />, category: "draw" },
  { id: "eraser", label: "橡皮", icon: () => <Eraser size={18} />, category: "other" },
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
      {/* 标题栏（拖动句柄） */}
      <div
        data-draggable-handle
        class="flex items-center justify-between cursor-move -m-3 p-2 mb-0 rounded-t-lg hover:bg-muted/50 transition-colors"
      >
        <span class="text-xs font-medium text-muted-foreground">工具栏</span>
        <Show when={props.onToggleCollapse}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              props.onToggleCollapse?.();
            }}
            title={collapsed() ? "展开工具栏" : "折叠工具栏"}
          >
            {collapsed() ? "▶" : "▼"}
          </Button>
        </Show>
      </div>

      <Show when={!collapsed()}>
        {/* 工具选择 */}
        <div class="space-y-2">
          {/* 选择工具 */}
          <div class="flex gap-1">
            <For each={tools.filter(t => t.category === "select")}>
              {(toolItem) => (
                <Button
                  variant={tool() === toolItem.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTool(toolItem.id)}
                  title={toolItem.label}
                  class="flex-1"
                >
                  {toolItem.icon()}
                </Button>
              )}
            </For>
          </div>

          {/* 绘制工具 */}
          <div class="flex flex-wrap gap-1">
            <For each={tools.filter(t => t.category === "draw")}>
              {(toolItem) => (
                <Button
                  variant={tool() === toolItem.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTool(toolItem.id)}
                  title={toolItem.label}
                  class="flex-1 min-w-[44px]"
                >
                  {toolItem.icon()}
                </Button>
              )}
            </For>
          </div>

          {/* 形状工具 */}
          <div class="flex flex-wrap gap-1">
            <For each={tools.filter(t => t.category === "shape")}>
              {(toolItem) => (
                <Button
                  variant={tool() === toolItem.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTool(toolItem.id)}
                  title={toolItem.label}
                  class="flex-1 min-w-[44px]"
                >
                  {toolItem.icon()}
                </Button>
              )}
            </For>
          </div>

          {/* 其他工具 */}
          <div class="flex gap-1">
            <For each={tools.filter(t => t.category === "other")}>
              {(toolItem) => (
                <Button
                  variant={tool() === toolItem.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTool(toolItem.id)}
                  title={toolItem.label}
                  class="flex-1"
                >
                  {toolItem.icon()}
                </Button>
              )}
            </For>
          </div>
        </div>

        {/* 颜色选择 */}
        <div class="space-y-2 pt-2 border-t border-border">
          <div class="flex items-center gap-2">
            <label class="text-xs font-medium whitespace-nowrap">描边:</label>
            <input
              type="color"
              value={color()}
              onInput={(e) => setColor(e.currentTarget.value)}
              class="h-8 w-16 rounded border border-border cursor-pointer"
            />
            <span class="text-xs text-muted-foreground font-mono">{color()}</span>
          </div>

          {/* 填充颜色（仅对支持填充的工具显示） */}
          <Show when={tool() === "rectangle" || tool() === "circle" || tool() === "diamond"}>
            <div class="flex items-center gap-2">
              <label class="text-xs font-medium whitespace-nowrap">填充:</label>
              <input
                type="color"
                value={fillColor() || "#ffffff"}
                onInput={(e) => setFillColor(e.currentTarget.value)}
                class="h-8 w-16 rounded border border-border cursor-pointer"
              />
              <Button
                variant={fillColor() ? "outline" : "default"}
                size="sm"
                onClick={() => setFillColor("")}
                title="无填充"
                class="h-8 px-2"
              >
                <span class="text-xs">无</span>
              </Button>
            </div>
          </Show>
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
        <div class="space-y-1 pt-2 border-t border-border">
          <div class="flex gap-1">
            <Button variant="outline" size="sm" onClick={undo} disabled={!canUndo()} title="撤销">
              <Undo2 size={16} />
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={!canRedo()} title="重做">
              <Redo2 size={16} />
            </Button>
            <Button variant="outline" size="sm" onClick={clearCanvas} title="清空">
              <Trash2 size={16} />
            </Button>
          </div>
          <div class="flex gap-1">
            <Button variant="outline" size="sm" onClick={handleExport} title="导出 JSON">
              <Download size={16} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportSVG} title="导出 SVG">
              <ImageIcon size={16} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleImport} title="导入">
              <Upload size={16} />
            </Button>
          </div>
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
                {toolItem.icon()}
              </Button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

