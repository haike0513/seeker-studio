/**
 * 可拖动功能的 Hook
 * 用于实现元素的拖动功能
 */

import { createSignal, onMount, onCleanup, type Accessor } from "solid-js";

export interface UseDraggableOptions {
  /** 初始 X 坐标 */
  initialX?: number;
  /** 初始 Y 坐标 */
  initialY?: number;
  /** 拖动边界元素，可以是选择器、HTMLElement 或返回 HTMLElement 的函数 */
  boundary?: string | HTMLElement | (() => HTMLElement | undefined);
  /** 是否启用拖动，默认为 true */
  enabled?: Accessor<boolean>;
}

export interface UseDraggableReturn {
  /** 当前 X 坐标 */
  x: Accessor<number>;
  /** 当前 Y 坐标 */
  y: Accessor<number>;
  /** 设置位置 */
  setPosition: (x: number, y: number) => void;
  /** 拖动事件处理器 */
  handleMouseDown: (e: MouseEvent) => void;
  /** 拖动中状态 */
  isDragging: Accessor<boolean>;
}

/**
 * 可拖动 Hook
 */
export function useDraggable(
  options: UseDraggableOptions = {}
): UseDraggableReturn {
  const {
    initialX = 0,
    initialY = 0,
    boundary,
    enabled = () => true,
  } = options;

  const [x, setX] = createSignal(initialX);
  const [y, setY] = createSignal(initialY);
  const [isDragging, setIsDragging] = createSignal(false);

  let startX = 0;
  let startY = 0;
  let elementX = 0;
  let elementY = 0;
  let boundaryElement: HTMLElement | null = null;

  const getBoundary = (): { left: number; top: number; right: number; bottom: number } => {
    if (boundaryElement) {
      const rect = boundaryElement.getBoundingClientRect();
      return {
        left: 0,
        top: 0,
        right: rect.width,
        bottom: rect.height,
      };
    }
    return {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
    };
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (!enabled()) return;
    
    // 只响应左键拖动
    if (e.button !== 0) return;

    // 检查是否点击在可拖动区域（通常是标题栏）
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
    startX = e.clientX;
    startY = e.clientY;
    elementX = x();
    elementY = y();

    // 获取边界元素
    if (typeof boundary === "string") {
      boundaryElement = document.querySelector(boundary);
    } else if (boundary instanceof HTMLElement) {
      boundaryElement = boundary;
    } else if (typeof boundary === "function") {
      boundaryElement = boundary() || null;
    } else {
      // 如果没有指定边界，使用最近的定位父元素
      const currentTarget = e.currentTarget as HTMLElement;
      boundaryElement = currentTarget.offsetParent as HTMLElement;
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging()) return;

    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    let newX = elementX + deltaX;
    let newY = elementY + deltaY;

    // 应用边界限制
    const bounds = getBoundary();
    
    // 简单边界检查，确保元素不会拖出可视区域
    // 假设最小元素宽度为 100px，高度为 100px
    newX = Math.max(bounds.left, Math.min(newX, bounds.right - 100));
    newY = Math.max(bounds.top, Math.min(newY, bounds.bottom - 100));

    setX(newX);
    setY(newY);
  };

  const handleMouseUp = () => {
    if (isDragging()) {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }
  };

  const setPosition = (newX: number, newY: number) => {
    setX(newX);
    setY(newY);
  };

  onCleanup(() => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  });

  return {
    x,
    y,
    setPosition,
    handleMouseDown,
    isDragging,
  };
}

