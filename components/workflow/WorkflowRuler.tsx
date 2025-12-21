/**
 * 工作流编辑器标尺组件
 * 显示刻度、缩放倍数、原点和坐标
 */

import { createSignal, createEffect, onMount, onCleanup, For } from "solid-js";

interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

interface WorkflowRulerProps {
  viewport?: Viewport;
  width?: number;
  height?: number;
}

const RULER_SIZE = 24; // 标尺高度/宽度
const STEP_SIZES = [1, 5, 10, 20, 50, 100, 200, 500, 1000]; // 可用的刻度步长（世界坐标单位）

// 计算合适的刻度步长
function calculateStepSize(zoom: number): number {
  // 根据缩放比例计算合适的步长，使得在屏幕上的间隔大约为 50-100 像素
  const targetScreenStep = 80; // 目标屏幕间隔
  const worldStep = targetScreenStep / zoom;
  
  // 找到最接近的可用步长
  for (let i = STEP_SIZES.length - 1; i >= 0; i--) {
    if (worldStep >= STEP_SIZES[i]) {
      return STEP_SIZES[i];
    }
  }
  return STEP_SIZES[0];
}

// 生成刻度点
function generateTicks(start: number, end: number, step: number): number[] {
  const ticks: number[] = [];
  const firstTick = Math.floor(start / step) * step;
  const lastTick = Math.ceil(end / step) * step;
  
  for (let tick = firstTick; tick <= lastTick; tick += step) {
    if (tick >= start && tick <= end) {
      ticks.push(tick);
    }
  }
  
  return ticks;
}

export function WorkflowRuler(props: WorkflowRulerProps) {
  const [viewport, setViewport] = createSignal<Viewport>({ x: 0, y: 0, zoom: 1 });
  let containerRef: HTMLDivElement | undefined;
  let paneElement: HTMLElement | null = null;

  // 如果通过 props 传递了 viewport，直接使用；否则从 DOM 读取
  createEffect(() => {
    const vp = props.viewport;
    if (vp) {
      setViewport(vp);
    }
  });

  // 监听 viewport 变化（如果没有通过 props 传递）
  const updateViewport = () => {
    if (props.viewport) return; // 如果通过 props 传递，不需要从 DOM 读取
    
    if (!paneElement) {
      paneElement = document.querySelector(".solid-flow__pane") as HTMLElement;
    }
    
    if (paneElement) {
      const vp = ((paneElement as HTMLElement & { __viewport?: Viewport }).__viewport) || { x: 0, y: 0, zoom: 1 };
      setViewport(vp);
    }
  };

  // 使用 requestAnimationFrame 定期检查 viewport 变化（仅在未通过 props 传递时）
  let rafId: number | null = null;

  const observeViewport = () => {
    if (props.viewport || rafId) return;
    
    const checkViewport = () => {
      updateViewport();
      rafId = requestAnimationFrame(checkViewport);
    };
    
    rafId = requestAnimationFrame(checkViewport);
  };

  onMount(() => {
    if (!props.viewport) {
      // 初始获取 viewport
      updateViewport();
      // 开始监听
      observeViewport();
    }
  });

  onCleanup(() => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  });

  const vp = () => viewport();
  const stepSize = () => calculateStepSize(vp().zoom);
  
  // 计算可见区域的坐标范围
  const getVisibleRange = () => {
    if (!containerRef) return { x: { start: 0, end: 1000 }, y: { start: 0, end: 1000 } };
    
    const rect = containerRef.getBoundingClientRect();
    const v = vp();
    
    // 将屏幕坐标转换为世界坐标
    const xStart = -v.x / v.zoom;
    const xEnd = (rect.width - v.x) / v.zoom;
    const yStart = -v.y / v.zoom;
    const yEnd = (rect.height - v.y) / v.zoom;
    
    return {
      x: { start: xStart, end: xEnd },
      y: { start: yStart, end: yEnd },
    };
  };

  const visibleRange = () => getVisibleRange();
  const step = () => stepSize();
  
  // 水平标尺刻度
  const horizontalTicks = () => {
    const range = visibleRange();
    const ticks = generateTicks(range.x.start, range.x.end, step());
    return ticks.map(tick => ({
      value: tick,
      screenX: tick * vp().zoom + vp().x,
    }));
  };
  
  // 垂直标尺刻度
  const verticalTicks = () => {
    const range = visibleRange();
    const ticks = generateTicks(range.y.start, range.y.end, step());
    return ticks.map(tick => ({
      value: tick,
      screenY: tick * vp().zoom + vp().y,
    }));
  };

  // 原点位置（屏幕坐标）
  const originScreenX = () => vp().x;
  const originScreenY = () => vp().y;

  return (
    <div
      ref={containerRef}
      class="workflow-ruler absolute top-0 left-0 pointer-events-none z-10"
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      {/* 缩放倍数显示 */}
      <div
        class="absolute bg-background/90 border border-border rounded px-2 py-1 text-xs font-mono"
        style={{
          top: `${RULER_SIZE + 4}px`,
          left: "4px",
          "z-index": "100",
        }}
      >
        {(vp().zoom * 100).toFixed(0)}%
      </div>

      {/* 水平标尺 */}
      <div
        class="absolute top-0 left-0 bg-background/80 border-b border-border"
        style={{
          width: "100%",
          height: `${RULER_SIZE}px`,
          "padding-left": `${RULER_SIZE}px`,
        }}
      >
        <svg
          class="absolute top-0 left-0"
          style={{
            width: "100%",
            height: `${RULER_SIZE}px`,
          }}
        >
          <For each={horizontalTicks()}>
            {(tick) => {
              const isMajor = tick.value % (step() * 5) === 0;
              const tickHeight = isMajor ? 8 : 4;
              const showLabel = isMajor && Math.abs(tick.value) >= step();
              
              return (
                <>
                  {/* 刻度线 */}
                  <line
                    x1={tick.screenX}
                    y1={RULER_SIZE - tickHeight}
                    x2={tick.screenX}
                    y2={RULER_SIZE}
                    stroke="currentColor"
                    stroke-width="1"
                    class="text-foreground/60"
                  />
                  {/* 刻度标签 */}
                  {showLabel && (
                    <text
                      x={tick.screenX}
                      y={RULER_SIZE - tickHeight - 2}
                      text-anchor="middle"
                      alignment-baseline="baseline"
                      class="text-[10px] fill-foreground/80 font-mono"
                    >
                      {tick.value}
                    </text>
                  )}
                </>
              );
            }}
          </For>
          
          {/* 原点标记（如果可见） */}
          {originScreenX() >= -RULER_SIZE && originScreenX() <= (containerRef?.clientWidth || 0) + RULER_SIZE && (
            <>
              <line
                x1={originScreenX()}
                y1={0}
                x2={originScreenX()}
                y2={RULER_SIZE}
                stroke="currentColor"
                stroke-width="1.5"
                class="text-primary"
              />
              <text
                x={originScreenX()}
                y={RULER_SIZE - 4}
                text-anchor="middle"
                alignment-baseline="baseline"
                class="text-[10px] fill-primary font-mono font-semibold"
              >
                0
              </text>
            </>
          )}
        </svg>
      </div>

      {/* 垂直标尺 */}
      <div
        class="absolute top-0 left-0 bg-background/80 border-r border-border"
        style={{
          width: `${RULER_SIZE}px`,
          height: "100%",
          "padding-top": `${RULER_SIZE}px`,
        }}
      >
        <svg
          class="absolute top-0 left-0"
          style={{
            width: `${RULER_SIZE}px`,
            height: "100%",
          }}
        >
          <For each={verticalTicks()}>
            {(tick) => {
              const isMajor = tick.value % (step() * 5) === 0;
              const tickWidth = isMajor ? 8 : 4;
              const showLabel = isMajor && Math.abs(tick.value) >= step();
              
              return (
                <>
                  {/* 刻度线 */}
                  <line
                    x1={RULER_SIZE - tickWidth}
                    y1={tick.screenY}
                    x2={RULER_SIZE}
                    y2={tick.screenY}
                    stroke="currentColor"
                    stroke-width="1"
                    class="text-foreground/60"
                  />
                  {/* 刻度标签 */}
                  {showLabel && (
                    <text
                      x={RULER_SIZE - tickWidth - 2}
                      y={tick.screenY}
                      text-anchor="end"
                      alignment-baseline="middle"
                      class="text-[10px] fill-foreground/80 font-mono"
                    >
                      {tick.value}
                    </text>
                  )}
                </>
              );
            }}
          </For>
          
          {/* 原点标记（如果可见） */}
          {originScreenY() >= -RULER_SIZE && originScreenY() <= (containerRef?.clientHeight || 0) + RULER_SIZE && (
            <>
              <line
                x1={0}
                y1={originScreenY()}
                x2={RULER_SIZE}
                y2={originScreenY()}
                stroke="currentColor"
                stroke-width="1.5"
                class="text-primary"
              />
              <text
                x={RULER_SIZE - 4}
                y={originScreenY()}
                text-anchor="end"
                alignment-baseline="middle"
                class="text-[10px] fill-primary font-mono font-semibold"
              >
                0
              </text>
            </>
          )}
        </svg>
      </div>

      {/* 原点交叉线（如果原点在可见区域） */}
      {originScreenX() >= -RULER_SIZE && 
       originScreenX() <= (containerRef?.clientWidth || 0) + RULER_SIZE &&
       originScreenY() >= -RULER_SIZE && 
       originScreenY() <= (containerRef?.clientHeight || 0) + RULER_SIZE && (
        <svg
          class="absolute top-0 left-0 pointer-events-none"
          style={{
            width: "100%",
            height: "100%",
            "padding-top": `${RULER_SIZE}px`,
            "padding-left": `${RULER_SIZE}px`,
          }}
        >
          {/* 垂直原点线 */}
          <line
            x1={originScreenX()}
            y1={-RULER_SIZE}
            x2={originScreenX()}
            y2="100%"
            stroke="currentColor"
            stroke-width="1"
            stroke-dasharray="2,2"
            class="text-primary/30"
          />
          {/* 水平原点线 */}
          <line
            x1={-RULER_SIZE}
            y1={originScreenY()}
            x2="100%"
            y2={originScreenY()}
            stroke="currentColor"
            stroke-width="1"
            stroke-dasharray="2,2"
            class="text-primary/30"
          />
        </svg>
      )}
    </div>
  );
}

