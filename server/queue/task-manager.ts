/**
 * 任务调度管理器
 * 使用队列适配器接口，支持不同的队列实现（RabbitMQ、pg-boss 等）
 */

import { createQueueAdapter } from "./factory.js";
import type { TaskHandler, TaskMessage, TaskInfo, QueueStats, TaskListOptions } from "./types.js";
import type { TaskListResult } from "./adapter.js";

// 创建适配器实例（单例）
let adapter: ReturnType<typeof createQueueAdapter> | null = null;

/**
 * 获取队列适配器实例
 */
function getAdapter() {
  if (!adapter) {
    adapter = createQueueAdapter();
  }
  return adapter;
}

/**
 * 初始化队列系统
 */
export async function initializeQueue(): Promise<void> {
  const queueAdapter = getAdapter();
  await queueAdapter.initialize();
}

/**
 * 创建队列（如果不存在）
 * @param taskName 任务名称（队列名称）
 */
export async function createQueue(taskName: string): Promise<void> {
  const queueAdapter = getAdapter();
  await queueAdapter.createQueue(taskName);
}

/**
 * 调度延迟任务
 * @param taskName 任务名称
 * @param delayMs 延迟时间（毫秒）
 * @param data 任务数据（可选）
 */
export async function scheduleTask(
  taskName: string,
  delayMs: number,
  data?: unknown
): Promise<void> {
  const queueAdapter = getAdapter();
  await queueAdapter.scheduleTask(taskName, delayMs, data);
}

/**
 * 调度周期性任务
 * @param taskName 任务名称
 * @param handler 任务处理器
 * @param intervalMs 执行间隔（毫秒）
 * @param data 任务数据（可选）
 */
export async function scheduleRecurringTask(
  taskName: string,
  handler: TaskHandler,
  intervalMs: number,
  data?: unknown
): Promise<void> {
  const queueAdapter = getAdapter();
  await queueAdapter.scheduleRecurringTask(taskName, handler, intervalMs, data);
}

/**
 * 注册任务消费者
 * @param taskName 任务名称
 * @param handler 任务处理器
 */
export async function registerConsumer(
  taskName: string,
  handler: TaskHandler
): Promise<void> {
  const queueAdapter = getAdapter();
  await queueAdapter.registerConsumer(taskName, handler);
}

/**
 * 取消任务（仅取消周期性任务）
 * 注意：已经发送到队列的消息仍会被处理，但不会再次调度
 */
export async function cancelTask(taskName: string): Promise<void> {
  const queueAdapter = getAdapter();
  await queueAdapter.cancelTask(taskName);
}

/**
 * 关闭队列连接
 */
export async function closeQueue(): Promise<void> {
  if (adapter) {
    await adapter.close();
    adapter = null;
  }
}

/**
 * 获取所有队列名称
 */
export async function getQueueNames(): Promise<string[]> {
  const queueAdapter = getAdapter();
  return await queueAdapter.getQueueNames();
}

/**
 * 获取队列统计信息
 * @param queueName 队列名称（可选，不提供则返回所有队列的统计）
 */
export async function getQueueStats(queueName?: string): Promise<QueueStats[]> {
  const queueAdapter = getAdapter();
  return await queueAdapter.getQueueStats(queueName);
}

/**
 * 获取任务列表
 * @param options 查询选项
 */
export async function getTasks(options?: TaskListOptions): Promise<TaskListResult> {
  const queueAdapter = getAdapter();
  return await queueAdapter.getTasks(options);
}

/**
 * 获取任务详情
 * @param taskId 任务 ID
 */
export async function getTask(taskId: string): Promise<TaskInfo | null> {
  const queueAdapter = getAdapter();
  return await queueAdapter.getTask(taskId);
}

// 导出类型（向后兼容）
export type { TaskMessage, TaskHandler, TaskInfo, QueueStats, TaskListOptions, TaskListResult };
