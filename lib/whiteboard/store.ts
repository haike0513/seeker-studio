import { createSignal, createMemo } from "solid-js";
import type { DrawingElement, DrawingTool, WhiteboardState } from "./types.js";
import { nanoid } from "nanoid";

// 创建初始状态
const createInitialState = (): WhiteboardState => ({
  elements: [],
  selectedElementId: null,
  tool: "pen",
  color: "#000000",
  strokeWidth: 2,
  fontSize: 16,
  history: [[]],
  historyIndex: 0,
});

// 状态信号
const [state, setState] = createSignal<WhiteboardState>(createInitialState());

// 计算属性
export const elements = createMemo(() => state().elements);
export const selectedElementId = createMemo(() => state().selectedElementId);
export const tool = createMemo(() => state().tool);
export const color = createMemo(() => state().color);
export const strokeWidth = createMemo(() => state().strokeWidth);
export const fontSize = createMemo(() => state().fontSize);
export const canUndo = createMemo(() => state().historyIndex > 0);
export const canRedo = createMemo(() => {
  const s = state();
  return s.historyIndex < s.history.length - 1;
});

// 更新状态
export const updateState = (updates: Partial<WhiteboardState>) => {
  setState((prev) => ({ ...prev, ...updates }));
};

// 添加元素
export const addElement = (element: Omit<DrawingElement, "id">) => {
  const newElement: DrawingElement = {
    ...element,
    id: nanoid(),
  };
  
  const newElements = [...state().elements, newElement];
  const newHistory = state().history.slice(0, state().historyIndex + 1);
  newHistory.push(newElements);
  
  setState((prev) => ({
    ...prev,
    elements: newElements,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  }));
  
  return newElement;
};

// 更新元素
export const updateElement = (id: string, updates: Partial<DrawingElement>) => {
  const newElements = state().elements.map((el) =>
    el.id === id ? { ...el, ...updates } : el
  );
  
  const newHistory = state().history.slice(0, state().historyIndex + 1);
  newHistory.push(newElements);
  
  setState((prev) => ({
    ...prev,
    elements: newElements,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  }));
};

// 删除元素
export const deleteElement = (id: string) => {
  const newElements = state().elements.filter((el) => el.id !== id);
  const newHistory = state().history.slice(0, state().historyIndex + 1);
  newHistory.push(newElements);
  
  setState((prev) => ({
    ...prev,
    elements: newElements,
    selectedElementId: prev.selectedElementId === id ? null : prev.selectedElementId,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  }));
};

// 选择元素
export const selectElement = (id: string | null) => {
  updateState({ selectedElementId: id });
};

// 设置工具
export const setTool = (tool: DrawingTool) => {
  updateState({ tool, selectedElementId: null });
};

// 设置颜色
export const setColor = (color: string) => {
  updateState({ color });
};

// 设置笔触宽度
export const setStrokeWidth = (width: number) => {
  updateState({ strokeWidth: width });
};

// 设置字体大小
export const setFontSize = (size: number) => {
  updateState({ fontSize: size });
};

// 撤销
export const undo = () => {
  const s = state();
  if (s.historyIndex > 0) {
    const newIndex = s.historyIndex - 1;
    setState((prev) => ({
      ...prev,
      elements: prev.history[newIndex],
      historyIndex: newIndex,
      selectedElementId: null,
    }));
  }
};

// 重做
export const redo = () => {
  const s = state();
  if (s.historyIndex < s.history.length - 1) {
    const newIndex = s.historyIndex + 1;
    setState((prev) => ({
      ...prev,
      elements: prev.history[newIndex],
      historyIndex: newIndex,
      selectedElementId: null,
    }));
  }
};

// 清空画板
export const clearCanvas = () => {
  const newHistory = state().history.slice(0, state().historyIndex + 1);
  newHistory.push([]);
  
  setState((prev) => ({
    ...prev,
    elements: [],
    selectedElementId: null,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  }));
};

// 导出画板数据
export const exportData = (): string => {
  return JSON.stringify({
    elements: state().elements,
    version: "1.0",
  }, null, 2);
};

// 导入画板数据
export const importData = (data: string) => {
  try {
    const parsed = JSON.parse(data);
    if (parsed.elements && Array.isArray(parsed.elements)) {
      const newHistory = state().history.slice(0, state().historyIndex + 1);
      newHistory.push(parsed.elements);
      
      setState((prev) => ({
        ...prev,
        elements: parsed.elements,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        selectedElementId: null,
      }));
      return true;
    }
  } catch (error) {
    console.error("Failed to import data:", error);
  }
  return false;
};

// 重置状态
export const resetState = () => {
  setState(createInitialState());
};

