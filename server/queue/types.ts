/**
 * 任务消息类型定义
 */

/**
 * 任务消息内容
 */
export interface TaskMessage {
  /** 任务名称 */
  taskName: string;
  /** 任务数据（可选） */
  data?: unknown;
  /** 重试次数 */
  retryCount?: number;
  /** 创建时间戳 */
  createdAt: number;
  /** 是否周期性任务 */
  isRecurring?: boolean;
  /** 周期性任务的间隔（毫秒） */
  intervalMs?: number;
}

/**
 * 任务处理器类型
 */
export type TaskHandler = (message: TaskMessage) => Promise<void> | void;

/**
 * 任务状态
 */
export type TaskStatus = "created" | "retry" | "active" | "completed" | "expired" | "cancelled" | "failed";

/**
 * 任务信息
 */
export interface TaskInfo {
  /** 任务 ID */
  id: string;
  /** 任务名称 */
  name: string;
  /** 任务数据 */
  data?: unknown;
  /** 任务状态 */
  status: TaskStatus;
  /** 创建时间 */
  createdOn?: Date;
  /** 开始时间 */
  startedOn?: Date;
  /** 完成时间 */
  completedOn?: Date;
  /** 失败时间 */
  failedOn?: Date;
  /** 重试次数 */
  retries?: number;
  /** 输出数据 */
  output?: unknown;
  /** 错误信息 */
  error?: string;
}

/**
 * 任务队列统计信息
 */
export interface QueueStats {
  /** 队列名称 */
  queueName: string;
  /** 已创建任务数 */
  created: number;
  /** 等待中任务数 */
  waiting: number;
  /** 活跃任务数 */
  active: number;
  /** 已完成任务数 */
  completed: number;
  /** 失败任务数 */
  failed: number;
  /** 已取消任务数 */
  cancelled: number;
}

/**
 * 任务列表查询选项
 */
export interface TaskListOptions {
  /** 队列名称（可选，不提供则查询所有队列） */
  queueName?: string;
  /** 状态过滤 */
  status?: TaskStatus | TaskStatus[];
  /** 分页：页码（从 1 开始） */
  page?: number;
  /** 分页：每页数量 */
  pageSize?: number;
  /** 排序字段 */
  orderBy?: "created" | "started" | "completed";
  /** 排序方向 */
  order?: "asc" | "desc";
}

