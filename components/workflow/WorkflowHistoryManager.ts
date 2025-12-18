/**
 * 工作流历史记录管理器 - 撤销/重做功能
 */

import type { Node, Edge } from "@/lib/xyflow/solid";

export interface WorkflowState {
  nodes: Node[];
  edges: Edge[];
}

export class WorkflowHistoryManager {
  private history: WorkflowState[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  constructor(initialState?: WorkflowState) {
    if (initialState) {
      this.history.push(JSON.parse(JSON.stringify(initialState)));
      this.currentIndex = 0;
    }
  }

  /**
   * 添加新状态到历史记录
   */
  push(state: WorkflowState): void {
    // 如果当前不在历史记录末尾，删除后面的记录
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // 添加新状态
    this.history.push(JSON.parse(JSON.stringify(state)));

    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  /**
   * 撤销
   */
  undo(): WorkflowState | null {
    if (this.canUndo()) {
      this.currentIndex--;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  /**
   * 重做
   */
  redo(): WorkflowState | null {
    if (this.canRedo()) {
      this.currentIndex++;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * 获取当前状态
   */
  getCurrentState(): WorkflowState | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  /**
   * 清空历史记录
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  /**
   * 重置历史记录（保留当前状态）
   */
  reset(initialState: WorkflowState): void {
    this.history = [JSON.parse(JSON.stringify(initialState))];
    this.currentIndex = 0;
  }
}

