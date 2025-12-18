/**
 * 队列适配器接口
 * 定义统一的队列操作 API，支持不同的队列实现（RabbitMQ、pg-boss 等）
 */

import type { TaskHandler, TaskInfo, QueueStats, TaskListOptions } from "./types.js";

/**
 * 任务列表查询结果
 */
export interface TaskListResult {
  /** 任务列表 */
  tasks: TaskInfo[];
  /** 总数量 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
}

/**
 * 队列适配器接口
 */
export interface QueueAdapter {
  /**
   * 初始化队列系统（连接、设置等）
   */
  initialize(): Promise<void>;

  /**
   * 调度延迟任务
   * @param taskName 任务名称
   * @param delayMs 延迟时间（毫秒）
   * @param data 任务数据（可选）
   */
  scheduleTask(taskName: string, delayMs: number, data?: unknown): Promise<void>;

  /**
   * 调度周期性任务
   * @param taskName 任务名称
   * @param handler 任务处理器
   * @param intervalMs 执行间隔（毫秒）
   * @param data 任务数据（可选）
   */
  scheduleRecurringTask(
    taskName: string,
    handler: TaskHandler,
    intervalMs: number,
    data?: unknown
  ): Promise<void>;

  /**
   * 创建队列（如果不存在）
   * @param taskName 任务名称（队列名称）
   */
  createQueue(taskName: string): Promise<void>;

  /**
   * 注册任务消费者
   * @param taskName 任务名称
   * @param handler 任务处理器
   */
  registerConsumer(taskName: string, handler: TaskHandler): Promise<void>;

  /**
   * 取消任务（仅取消周期性任务）
   * @param taskName 任务名称
   */
  cancelTask(taskName: string): Promise<void>;

  /**
   * 获取所有队列名称
   */
  getQueueNames(): Promise<string[]>;

  /**
   * 获取队列统计信息
   * @param queueName 队列名称（可选，不提供则返回所有队列的统计）
   */
  getQueueStats(queueName?: string): Promise<QueueStats[]>;

  /**
   * 获取任务列表
   * @param options 查询选项
   */
  getTasks(options?: TaskListOptions): Promise<TaskListResult>;

  /**
   * 获取任务详情
   * @param taskId 任务 ID
   */
  getTask(taskId: string): Promise<TaskInfo | null>;

  /**
   * 关闭连接和清理资源
   */
  close(): Promise<void>;
}

