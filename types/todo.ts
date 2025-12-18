/**
 * Todo 相关类型定义
 */

/**
 * Todo 项
 */
export interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 创建 Todo 请求
 */
export interface CreateTodoRequest {
  text: string;
}

/**
 * 更新 Todo 请求
 */
export interface UpdateTodoRequest {
  text?: string;
  completed?: boolean;
}
