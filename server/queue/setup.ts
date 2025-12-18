/**
 * RabbitMQ 队列和交换机初始化
 * 注意：此文件仅用于 RabbitMQ 适配器，pg-boss 不需要此初始化逻辑
 */

import type { Channel } from "amqplib";
import { createChannel } from "./connection.js";
import { getAppConfig } from "../config/index.js";
import { getQueueType } from "./factory.js";
import { createChildLogger } from "../utils/logger.js";

const logger = createChildLogger({ component: "rabbitmq-setup" });

const config = getAppConfig();
const prefix = config.rabbitmq.queuePrefix ? `${config.rabbitmq.queuePrefix}.` : "";

/**
 * 队列和交换机名称
 */
export const QueueNames = {
  /** Dead Letter Exchange */
  DLX: `${prefix}task.dlx`,
  /** 延迟队列前缀 */
  DELAYED_QUEUE_PREFIX: `${prefix}task.delayed`,
  /** 任务队列前缀 */
  TASK_QUEUE_PREFIX: `${prefix}task`,
} as const;

/**
 * 获取队列名称
 */
export function getQueueName(taskName: string, type: "delayed" | "task"): string {
  if (type === "delayed") {
    return `${QueueNames.DELAYED_QUEUE_PREFIX}.${taskName}`;
  }
  return `${QueueNames.TASK_QUEUE_PREFIX}.${taskName}`;
}

/**
 * 初始化队列和交换机（仅 RabbitMQ）
 */
export async function setupQueues(): Promise<void> {
  const queueType = getQueueType();

  // 只有 RabbitMQ 需要初始化队列和交换机
  if (queueType !== "rabbitmq") {
    logger.info({ queueType }, "当前队列类型不是 RabbitMQ，跳过队列初始化");
    return;
  }

  const channel = createChannel();

  await channel.addSetup(async (ch: Channel) => {
    // 声明 Dead Letter Exchange（直连交换机）
    await ch.assertExchange(QueueNames.DLX, "direct", {
      durable: true,
    });

    logger.info({ exchange: QueueNames.DLX }, "已声明 Dead Letter Exchange");
  });

  logger.info("RabbitMQ 队列初始化完成");
}

/**
 * 声明任务相关的队列（延迟队列 + 实际任务队列）
 * 仅用于 RabbitMQ 适配器
 */
export async function ensureTaskQueues(taskName: string): Promise<void> {
  const queueType = getQueueType();

  // 只有 RabbitMQ 需要声明队列
  if (queueType !== "rabbitmq") {
    return;
  }

  const channel = createChannel();
  const delayedQueueName = getQueueName(taskName, "delayed");
  const taskQueueName = getQueueName(taskName, "task");

  await channel.addSetup(async (ch: Channel) => {
    // 声明实际任务队列（持久化）
    await ch.assertQueue(taskQueueName, {
      durable: true,
    });

    // 声明延迟队列（带 TTL 和 DLX）
    await ch.assertQueue(delayedQueueName, {
      durable: true,
      arguments: {
        // 设置死信交换机
        "x-dead-letter-exchange": QueueNames.DLX,
        // 设置死信路由键（路由到任务队列）
        "x-dead-letter-routing-key": taskQueueName,
        // 队列消息过期时间（如果需要默认过期时间，可以设置，但我们使用消息级别的 TTL）
      },
    });

    // 绑定任务队列到 DLX（使用队列名作为路由键）
    await ch.bindQueue(taskQueueName, QueueNames.DLX, taskQueueName);

    logger.info({ taskQueue: taskQueueName, delayedQueue: delayedQueueName }, "已声明任务队列和延迟队列");
  });
}

