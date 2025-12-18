/**
 * RabbitMQ 队列适配器实现
 */

import type { ConsumeMessage, Channel } from "amqplib";
import { createChannel, closeConnection as closeRabbitMQConnection } from "../connection.js";
import { ensureTaskQueues, getQueueName } from "../setup.js";
import { createChildLogger } from "../../utils/logger.js";
import type { QueueAdapter, TaskListResult } from "../adapter.js";
import type { TaskHandler, TaskMessage, TaskInfo, QueueStats, TaskListOptions } from "../types.js";

const logger = createChildLogger({ component: "rabbitmq" });

export class RabbitMQAdapter implements QueueAdapter {
  private channel: ReturnType<typeof createChannel> | null = null;
  private taskHandlers = new Map<string, TaskHandler>();
  private registeredConsumers = new Set<string>();

  async initialize(): Promise<void> {
    // 创建通道（延迟初始化）
    if (!this.channel) {
      this.channel = createChannel();
    }
    // RabbitMQ 连接在 connection.ts 中自动管理
    // 这里可以添加额外的初始化逻辑
    logger.info("RabbitMQ 适配器已初始化");
  }

  private getChannel() {
    if (!this.channel) {
      this.channel = createChannel();
    }
    return this.channel;
  }

  async createQueue(taskName: string): Promise<void> {
    // RabbitMQ 使用 ensureTaskQueues 来确保队列存在
    await ensureTaskQueues(taskName);
  }

  async scheduleTask(
    taskName: string,
    delayMs: number,
    data?: unknown
  ): Promise<void> {
    await this.createQueue(taskName);

    const delayedQueueName = getQueueName(taskName, "delayed");
    const message: TaskMessage = {
      taskName,
      data,
      createdAt: Date.now(),
    };

    await this.getChannel().sendToQueue(
      delayedQueueName,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,
        expiration: delayMs.toString(), // 设置消息过期时间（毫秒）
      }
    );

    logger.info({ taskName, delayMs }, "已调度任务");
  }

  async scheduleRecurringTask(
    taskName: string,
    handler: TaskHandler,
    intervalMs: number,
    data?: unknown
  ): Promise<void> {
    await this.createQueue(taskName);

    // 注册任务处理器
    this.taskHandlers.set(taskName, handler);

    // 启动消费者（如果还没有启动）
    await this.registerConsumer(taskName, handler);

    // 立即调度第一次任务
    await this.scheduleRecurringTaskMessage(taskName, intervalMs, data);

    logger.info({ taskName, intervalMs }, "已启动周期性任务");
  }

  private async scheduleRecurringTaskMessage(
    taskName: string,
    intervalMs: number,
    data?: unknown
  ): Promise<void> {
    const delayedQueueName = getQueueName(taskName, "delayed");
    const message: TaskMessage = {
      taskName,
      data,
      createdAt: Date.now(),
      isRecurring: true,
      intervalMs,
    };

    await this.getChannel().sendToQueue(
      delayedQueueName,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,
        expiration: intervalMs.toString(),
      }
    );
  }

  async registerConsumer(taskName: string, handler: TaskHandler): Promise<void> {
    // 如果已经注册过，直接返回
    if (this.registeredConsumers.has(taskName)) {
      return;
    }

    // 确保队列存在
    await this.createQueue(taskName);

    const taskQueueName = getQueueName(taskName, "task");

    await this.getChannel().addSetup(async (ch: Channel) => {
      await ch.consume(
        taskQueueName,
        async (msg: ConsumeMessage | null) => {
          if (!msg) return;

          try {
            const message: TaskMessage = JSON.parse(msg.content.toString());
            const taskHandler = this.taskHandlers.get(taskName) || handler;

            logger.debug({ taskName }, "执行任务");

            // 执行任务
            await taskHandler(message);

            // 如果是周期性任务，在任务完成后再次调度
            if (message.isRecurring && message.intervalMs) {
              try {
                await this.scheduleRecurringTaskMessage(
                  taskName,
                  message.intervalMs,
                  message.data
                );
              } catch (error) {
                logger.error(
                  { error, taskName },
                  "周期性任务重新调度失败"
                );
                // 即使重新调度失败，也确认当前消息（任务已成功执行）
              }
            }

            // 确认消息
            ch.ack(msg);
            logger.info({ taskName }, "任务执行成功");
          } catch (error) {
            logger.error({ error, taskName }, "任务执行失败");
            // 拒绝消息，不重新入队（避免无限重试）
            ch.nack(msg, false, false);
          }
        },
        {
          noAck: false, // 需要手动确认
        }
      );

      this.registeredConsumers.add(taskName);
      logger.info({ taskName }, "已注册任务消费者");
    });
  }

  async cancelTask(taskName: string): Promise<void> {
    this.taskHandlers.delete(taskName);
    this.registeredConsumers.delete(taskName);
    logger.info({ taskName }, "已取消任务");
  }

  async getQueueNames(): Promise<string[]> {
    // RabbitMQ 不直接支持查询所有队列名称，需要从已知的任务中获取
    // 这里返回已注册的消费者对应的队列名称
    const queueNames: string[] = [];
    for (const taskName of this.registeredConsumers) {
      queueNames.push(getQueueName(taskName, "task"));
      queueNames.push(getQueueName(taskName, "delayed"));
    }
    return queueNames;
  }

  async getQueueStats(queueName?: string): Promise<QueueStats[]> {
    // RabbitMQ 需要管理 API 来查询队列统计信息
    // 这里返回基本的统计信息（需要 RabbitMQ 管理插件支持）
    // 暂时返回空数组或抛出错误表示需要额外实现
    if (queueName) {
      return [
        {
          queueName,
          created: 0,
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          cancelled: 0,
        },
      ];
    }
    const queueNames = await this.getQueueNames();
    return queueNames.map((name) => ({
      queueName: name,
      created: 0,
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    }));
  }

  async getTasks(options?: TaskListOptions): Promise<TaskListResult> {
    // RabbitMQ 不直接支持查询任务列表
    // 需要额外的存储机制或使用 RabbitMQ 管理 API
    // 暂时返回空结果
    const { page = 1, pageSize = 20 } = options || {};
    return {
      tasks: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  async getTask(_taskId: string): Promise<TaskInfo | null> {
    // RabbitMQ 不支持通过 ID 查询任务
    return null;
  }

  async close(): Promise<void> {
    await closeRabbitMQConnection();
    logger.info("适配器已关闭");
  }
}

