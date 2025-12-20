import { createSignal, onMount, onCleanup, For, Show, createMemo } from "solid-js";
import {
  elements,
  tool,
  color,
  strokeWidth,
  fontSize,
  selectedElementId,
  addElement,
  updateElement,
  selectElement,
  deleteElement,
} from "@/lib/whiteboard/store.js";
import { isPointInElement, pathToSVGPath, getElementBounds } from "@/lib/whiteboard/draw.js";
import type { DrawingElement } from "@/lib/whiteboard/types.js";

interface WhiteboardCanvasProps {
  width?: number;
  height?: number;
}

export default function WhiteboardCanvas(props: WhiteboardCanvasProps) {
  let svgRef: SVGSVGElement | undefined;
  let containerRef: HTMLDivElement | undefined;
  const [isDrawing, setIsDrawing] = createSignal(false);
  const [currentElement, setCurrentElement] = createSignal<DrawingElement | null>(null);
  const [startPos, setStartPos] = createSignal<{ x: number; y: number } | null>(null);
  const [viewBox, setViewBox] = createSignal({ width: 1000, height: 1000 });

  // 获取 SVG 坐标
  const getSVGCoordinates = (e: MouseEvent | TouchEvent) => {
    if (!svgRef) return { x: 0, y: 0 };
    const rect = svgRef.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    
    const vb = viewBox();
    // 确保除数不为零，避免 NaN
    const scaleX = rect.width > 0 ? vb.width / rect.width : 1;
    const scaleY = rect.height > 0 ? vb.height / rect.height : 1;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // 处理鼠标按下
  const handlePointerDown = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const coords = getSVGCoordinates(e);
    const currentTool = tool();

    if (currentTool === "select") {
      // 选择模式：查找点击的元素
      const clickedElement = elements()
        .slice()
        .reverse()
        .find((el) => isPointInElement(coords.x, coords.y, el));

      if (clickedElement) {
        selectElement(clickedElement.id);
      } else {
        selectElement(null);
      }
      return;
    }

    // 开始绘制
    setIsDrawing(true);
    setStartPos(coords);

    const newElement: Omit<DrawingElement, "id"> = {
      type: currentTool,
      x: coords.x,
      y: coords.y,
      color: color(),
      strokeWidth: strokeWidth(),
      fontSize: fontSize(),
    };

    if (currentTool === "pen" || currentTool === "eraser") {
      newElement.path = [{ x: coords.x, y: coords.y }];
    } else if (currentTool === "text") {
      newElement.text = "";
      newElement.width = 0;
      newElement.height = 0;
    } else {
      newElement.width = 0;
      newElement.height = 0;
    }

    const element = addElement(newElement);
    setCurrentElement(element);
  };

  // 处理鼠标移动
  const handlePointerMove = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing() || !currentElement() || !startPos()) return;

    const coords = getSVGCoordinates(e);
    const current = currentElement()!;
    const currentTool = tool();

    if (currentTool === "pen" || currentTool === "eraser") {
      // 更新路径
      const newPath = [...(current.path || []), { x: coords.x, y: coords.y }];
      updateElement(current.id, { path: newPath });
      setCurrentElement({ ...current, path: newPath });
    } else if (currentTool === "text") {
      // 文本工具在按下时处理
    } else {
      // 更新形状尺寸
      const width = coords.x - startPos()!.x;
      const height = coords.y - startPos()!.y;
      updateElement(current.id, { width, height });
      setCurrentElement({ ...current, width, height });
    }
  };

  // 处理鼠标释放
  const handlePointerUp = () => {
    if (isDrawing() && currentElement() && tool() === "text") {
      // 文本工具：弹出输入框
      const text = prompt("输入文本:");
      if (text !== null) {
        updateElement(currentElement()!.id, {
          text,
          width: text.length * (fontSize() * 0.6),
          height: fontSize(),
        });
      } else {
        deleteElement(currentElement()!.id);
      }
    }

    setIsDrawing(false);
    setCurrentElement(null);
    setStartPos(null);
  };

  // 键盘快捷键
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      const selected = selectedElementId();
      if (selected) {
        deleteElement(selected);
        e.preventDefault();
      }
    }
  };

  // 渲染单个元素
  const renderElement = (element: DrawingElement) => {
    const isSelected = element.id === selectedElementId();
    const bounds = getElementBounds(element);

    switch (element.type) {
      case "pen":
        if (!element.path || element.path.length === 0) return null;
        return (
          <g>
            <path
              d={pathToSVGPath(element.path)}
              stroke={element.color}
              stroke-width={element.strokeWidth}
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            {isSelected && bounds && (
              <rect
                x={bounds.x - 4}
                y={bounds.y - 4}
                width={bounds.width + 8}
                height={bounds.height + 8}
                fill="none"
                stroke="#3b82f6"
                stroke-width="2"
                stroke-dasharray="5,5"
              />
            )}
          </g>
        );

      case "eraser":
        if (!element.path || element.path.length === 0) return null;
        return (
          <g>
            {/* 使用白色背景色覆盖，实现擦除效果 */}
            <path
              d={pathToSVGPath(element.path)}
              stroke="white"
              stroke-width={element.strokeWidth * 2}
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
              style={{ "mix-blend-mode": "multiply" }}
            />
            {/* 添加一个半透明的指示器，显示擦除区域 */}
            <path
              d={pathToSVGPath(element.path)}
              stroke="#ef4444"
              stroke-width={element.strokeWidth}
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
              opacity="0.3"
            />
          </g>
        );

      case "rectangle":
        if (element.width === undefined || element.height === undefined) return null;
        return (
          <g>
            <rect
              x={element.x}
              y={element.y}
              width={element.width}
              height={element.height}
              stroke={element.color}
              stroke-width={element.strokeWidth}
              fill="none"
            />
            {isSelected && (
              <>
                <rect
                  x={element.x - 4}
                  y={element.y - 4}
                  width={element.width + 8}
                  height={element.height + 8}
                  fill="none"
                  stroke="#3b82f6"
                  stroke-width="2"
                  stroke-dasharray="5,5"
                />
                <For
                  each={[
                    [element.x, element.y],
                    [element.x + element.width, element.y],
                    [element.x + element.width, element.y + element.height],
                    [element.x, element.y + element.height],
                  ]}
                >
                  {([x, y]) => (
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#3b82f6"
                      stroke="white"
                      stroke-width="1"
                    />
                  )}
                </For>
              </>
            )}
          </g>
        );

      case "circle": {
        if (element.width === undefined || element.height === undefined) return null;
        const centerX = element.x + element.width / 2;
        const centerY = element.y + element.height / 2;
        const radiusX = Math.abs(element.width) / 2;
        const radiusY = Math.abs(element.height) / 2;
        return (
          <g>
            <ellipse
              cx={centerX}
              cy={centerY}
              rx={radiusX}
              ry={radiusY}
              stroke={element.color}
              stroke-width={element.strokeWidth}
              fill="none"
            />
            {isSelected && (
              <>
                <ellipse
                  cx={centerX}
                  cy={centerY}
                  rx={radiusX + 4}
                  ry={radiusY + 4}
                  fill="none"
                  stroke="#3b82f6"
                  stroke-width="2"
                  stroke-dasharray="5,5"
                />
                <For
                  each={[
                    [element.x, centerY],
                    [element.x + element.width, centerY],
                    [centerX, element.y],
                    [centerX, element.y + element.height],
                  ]}
                >
                  {([x, y]) => (
                    <circle
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#3b82f6"
                      stroke="white"
                      stroke-width="1"
                    />
                  )}
                </For>
              </>
            )}
          </g>
        );
      }

      case "line":
        if (element.width === undefined || element.height === undefined) return null;
        return (
          <g>
            <line
              x1={element.x}
              y1={element.y}
              x2={element.x + element.width}
              y2={element.y + element.height}
              stroke={element.color}
              stroke-width={element.strokeWidth}
              stroke-linecap="round"
            />
            {isSelected && bounds && (
              <>
                <rect
                  x={bounds.x - 4}
                  y={bounds.y - 4}
                  width={bounds.width + 8}
                  height={bounds.height + 8}
                  fill="none"
                  stroke="#3b82f6"
                  stroke-width="2"
                  stroke-dasharray="5,5"
                />
                <circle
                  cx={element.x}
                  cy={element.y}
                  r="4"
                  fill="#3b82f6"
                  stroke="white"
                  stroke-width="1"
                />
                <circle
                  cx={element.x + element.width}
                  cy={element.y + element.height}
                  r="4"
                  fill="#3b82f6"
                  stroke="white"
                  stroke-width="1"
                />
              </>
            )}
          </g>
        );

      case "text": {
        if (!element.text) return null;
        const textSize = String(element.fontSize || 16);
        return (
          <g>
            <text
              x={element.x}
              y={element.y}
              fill={element.color}
              font-size={textSize}
              font-family="Arial, sans-serif"
              dominant-baseline="hanging"
            >
              {element.text}
            </text>
            {isSelected && bounds && (
              <>
                <rect
                  x={bounds.x - 4}
                  y={bounds.y - 4}
                  width={bounds.width + 8}
                  height={bounds.height + 8}
                  fill="none"
                  stroke="#3b82f6"
                  stroke-width="2"
                  stroke-dasharray="5,5"
                />
                <circle
                  cx={bounds.x + bounds.width}
                  cy={bounds.y}
                  r="4"
                  fill="#3b82f6"
                  stroke="white"
                  stroke-width="1"
                />
              </>
            )}
          </g>
        );
      }

      default:
        return null;
    }
  };

  // 初始化 SVG 并监听容器大小变化
  onMount(() => {
    if (!containerRef) return;

    const resizeSVG = () => {
      if (!containerRef) return;
      const rect = containerRef.getBoundingClientRect();
      const width = props.width || rect.width || 1000;
      const height = props.height || rect.height || 1000;
      setViewBox({ width, height });
    };

    // 初始设置
    resizeSVG();

    // 使用 ResizeObserver 监听容器大小变化
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && containerRef) {
      resizeObserver = new ResizeObserver(() => {
        resizeSVG();
      });
      resizeObserver.observe(containerRef);
    } else {
      // 降级方案：使用 window resize 事件
      window.addEventListener("resize", resizeSVG);
    }

    // 键盘事件
    window.addEventListener("keydown", handleKeyDown);

    onCleanup(() => {
      if (resizeObserver && containerRef) {
        resizeObserver.unobserve(containerRef);
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", resizeSVG);
      }
      window.removeEventListener("keydown", handleKeyDown);
    });
  });

  // 使用 createMemo 确保 viewBox 响应式更新
  const viewBoxString = createMemo(() => {
    const vb = viewBox();
    return `0 0 ${vb.width} ${vb.height}`;
  });

  return (
    <div
      ref={containerRef}
      class="relative w-full h-full bg-white border border-border rounded-lg overflow-hidden"
      style={{ "touch-action": "none" }}
    >
      <svg
        ref={svgRef}
        viewBox={viewBoxString()}
        class="absolute inset-0 w-full h-full cursor-crosshair"
        preserveAspectRatio="xMidYMid meet"
        width="100%"
        height="100%"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        {/* 背景网格 */}
        <defs>
          <pattern
            id="grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="#e5e7eb"
              stroke-width="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* 绘制所有元素（非橡皮擦） */}
        <For each={elements().filter(el => el.type !== "eraser")}>
          {(element) => renderElement(element)}
        </For>

        {/* 绘制橡皮擦元素（在最后，覆盖其他元素） */}
        <For each={elements().filter(el => el.type === "eraser")}>
          {(element) => renderElement(element)}
        </For>

        {/* 当前正在绘制的元素 */}
        <Show when={currentElement()}>
          {(element) => renderElement(element())}
        </Show>
      </svg>
    </div>
  );
}
