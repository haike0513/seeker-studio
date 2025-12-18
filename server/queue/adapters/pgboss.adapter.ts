/**
 * pg-boss 队列适配器实现
 */

import { PgBoss } from "pg-boss";
import { getAppConfig } from "../../config/index.js";
import { createChildLogger } from "../../utils/logger.js";
import type { QueueAdapter, TaskListResult } from "../adapter.js";
import type { TaskHandler, TaskMessage, TaskInfo, QueueStats, TaskListOptions, TaskStatus } from "../types.js";

const logger = createChildLogger({ component: "pg-boss" });

export class PgBossAdapter implements QueueAdapter {
  private boss: PgBoss | null = null;
  private taskHandlers = new Map<string, TaskHandler>();
  private registeredConsumers = new Set<string>();

  async initialize(): Promise<void> {
    const config = getAppConfig();

    this.boss = new PgBoss({
      connectionString: config.database.url,
      schema: "pgboss", // pg-boss 使用的 schema
    });

    await this.boss.start();

    logger.info("pg-boss 适配器已初始化");
  }

  async createQueue(taskName: string): Promise<void> {
    if (!this.boss) {
      throw new Error("pg-boss 未初始化，请先调用 initialize()");
    }

    try {
      // 使用 pg-boss 的 createQueue 方法创建队列
      await this.boss.createQueue(taskName);
      logger.info({ taskName }, "已创建队列");
    } catch (error) {
      // 如果队列已存在，忽略错误（这是正常的）
      // 其他错误可能需要处理，但通常队列已存在是可以接受的
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
        // 队列已存在，这是正常的，不需要记录警告
        return;
      }
      // 其他错误记录警告但继续执行
      logger.warn({ error, taskName }, "创建队列时出现警告");
    }
  }

  async scheduleTask(
    taskName: string,
    delayMs: number,
    data?: unknown
  ): Promise<void> {
    if (!this.boss) {
      throw new Error("pg-boss 未初始化，请先调用 initialize()");
    }

    // 确保队列存在
    await this.createQueue(taskName);

    const message: TaskMessage = {
      taskName,
      data,
      createdAt: Date.now(),
    };

    await this.boss.send(taskName, message, {
      startAfter: new Date(Date.now() + delayMs), // 延迟执行
    });

    logger.info({ taskName, delayMs }, "已调度任务");
  }

  async scheduleRecurringTask(
    taskName: string,
    handler: TaskHandler,
    intervalMs: number,
    data?: unknown
  ): Promise<void> {
    if (!this.boss) {
      throw new Error("pg-boss 未初始化，请先调用 initialize()");
    }

    // 注册任务处理器
    this.taskHandlers.set(taskName, handler);

    // 先启动消费者（worker 会自动创建队列）
    await this.registerConsumer(taskName, handler);

    // 然后调度第一次任务（队列此时应该已经存在）
    await this.scheduleRecurringTaskMessage(taskName, intervalMs, data);

    logger.info({ taskName, intervalMs }, "已启动周期性任务");
  }

  private async scheduleRecurringTaskMessage(
    taskName: string,
    intervalMs: number,
    data?: unknown
  ): Promise<void> {
    if (!this.boss) {
      throw new Error("pg-boss 未初始化，请先调用 initialize()");
    }

    const message: TaskMessage = {
      taskName,
      data,
      createdAt: Date.now(),
      isRecurring: true,
      intervalMs,
    };

    await this.boss.send(taskName, message, {
      startAfter: new Date(Date.now() + intervalMs),
    });
  }

  async registerConsumer(taskName: string, handler: TaskHandler): Promise<void> {
    if (!this.boss) {
      throw new Error("pg-boss 未初始化，请先调用 initialize()");
    }

    // 如果已经注册过，直接返回
    if (this.registeredConsumers.has(taskName)) {
      return;
    }

    // 确保队列存在
    await this.createQueue(taskName);

    await this.boss.work(taskName, async (jobs) => {
      for (const job of jobs) {
        try {
          const message = job.data as TaskMessage;

          const taskHandler = this.taskHandlers.get(taskName) || handler;

          logger.debug({ taskName, taskId: job.id }, "执行任务");

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
              // 即使重新调度失败，任务也已成功执行
            }
          }

          logger.info({ taskName, taskId: job.id }, "任务执行成功");
        } catch (error) {
          logger.error({ error, taskName, taskId: job.id }, "任务执行失败");
          // pg-boss 会自动处理重试（根据配置）
          throw error; // 抛出错误以触发重试机制
        }
      }
    });

    this.registeredConsumers.add(taskName);
    logger.info({ taskName }, "已注册任务消费者");
  }

  async cancelTask(taskName: string): Promise<void> {
    if (!this.boss) {
      return;
    }

    // pg-boss 不支持直接取消已注册的 worker，但可以取消任务处理器
    this.taskHandlers.delete(taskName);
    this.registeredConsumers.delete(taskName);

    // 取消队列中未处理的任务（需要提供任务 ID，这里先简化）
    // await this.boss.cancel(taskName);

    logger.info({ taskName }, "已取消任务");
  }

  async getQueueNames(): Promise<string[]> {
    if (!this.boss) {
      throw new Error("pg-boss 未初始化，请先调用 initialize()");
    }

    try {
      // pg-boss 使用 getQueues 方法获取队列列表
      const queues = await this.boss.getQueues();
      return queues.map((q) => q.name);
    } catch (error) {
      logger.error({ error }, "获取队列名称失败");
      return [];
    }
  }

  async getQueueStats(queueName?: string): Promise<QueueStats[]> {
    if (!this.boss) {
      throw new Error("pg-boss 未初始化，请先调用 initialize()");
    }

    try {
      let queueNames: string[] = [];
      
      if (queueName) {
        // 如果指定了队列名称，直接使用它（即使队列可能还不存在）
        queueNames = [queueName];
      } else {
        // 如果没有指定队列名称，获取所有已存在的队列
        try {
          const queues = await this.boss.getQueues();
          queueNames = queues.map((q) => q.name);
        } catch (error) {
          logger.error({ error }, "获取队列列表失败");
          return [];
        }
      }
      
      const stats: QueueStats[] = [];

      for (const name of queueNames) {
        try {
          // pg-boss 可能需要直接查询数据库来获取统计信息
          // 这里先返回占位数据
          stats.push({
            queueName: name,
            created: 0,
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            cancelled: 0,
          });
        } catch (error) {
          logger.error({ error, queueName: name }, "获取队列统计失败");
          // 即使出错也返回一个默认的统计对象，而不是跳过
          stats.push({
            queueName: name,
            created: 0,
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            cancelled: 0,
          });
        }
      }

      return stats;
    } catch (error) {
      logger.error({ error }, "获取队列统计失败");
      return [];
    }
  }

  async getTasks(options?: TaskListOptions): Promise<TaskListResult> {
    if (!this.boss) {
      throw new Error("pg-boss 未初始化，请先调用 initialize()");
    }

    const {
      queueName,
      status,
      page = 1,
      pageSize = 20,
      orderBy = "created",
      order = "desc",
    } = options || {};

    try {
      let queueNames: string[] = [];
      
      if (queueName) {
        // 如果指定了队列名称，直接使用它（即使队列可能还不存在）
        queueNames = [queueName];
      } else {
        // 如果没有指定队列名称，获取所有已存在的队列
        try {
          const allQueues = await this.boss.getQueues();
          queueNames = allQueues.map((q) => q.name);
        } catch (error) {
          logger.error({ error }, "获取队列列表失败");
          return {
            tasks: [],
            total: 0,
            page: page || 1,
            pageSize: pageSize || 20,
            totalPages: 0,
          };
        }
      }

      const allTasks: TaskInfo[] = [];

      // 查询每个队列的任务（简化实现，只查询最近的任务）
      for (const name of queueNames) {
        try {
          // 使用 fetch 方法获取任务
          // 如果队列不存在，fetch 可能会抛出错误，我们捕获它并继续
          const jobs = await this.boss.fetch(name);

          for (const job of jobs) {
            const taskInfo = this.mapJobToTaskInfo(job);
            
            // 状态过滤
            if (status) {
              const statusArray = Array.isArray(status) ? status : [status];
              if (!statusArray.includes(taskInfo.status)) {
                continue;
              }
            }
            
            allTasks.push(taskInfo);
          }
        } catch (error) {
          // 如果队列不存在或获取任务失败，记录错误但继续处理其他队列
          logger.error({ error, queueName: name }, "获取队列任务失败");
          // 不抛出错误，继续处理其他队列
        }
      }

      // 排序
      allTasks.sort((a, b) => {
        const aTime = this.getTaskTime(a, orderBy);
        const bTime = this.getTaskTime(b, orderBy);
        if (order === "asc") {
          return aTime.getTime() - bTime.getTime();
        }
        return bTime.getTime() - aTime.getTime();
      });

      // 分页
      const total = allTasks.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedTasks = allTasks.slice(startIndex, endIndex);

      return {
        tasks: paginatedTasks,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      logger.error({ error }, "获取任务列表失败");
      return {
        tasks: [],
        total: 0,
        page: page || 1,
        pageSize: pageSize || 20,
        totalPages: 0,
      };
    }
  }

  async getTask(taskId: string): Promise<TaskInfo | null> {
    if (!this.boss) {
      throw new Error("pg-boss 未初始化，请先调用 initialize()");
    }

    try {
      // pg-boss 的 getJobById 可能需要队列名称
      // 这里先尝试从所有队列中查找
      const queues = await this.boss.getQueues();
      for (const queue of queues) {
        try {
          const jobs = await this.boss.fetch(queue.name);
          const job = jobs.find((j) => j.id === taskId);
          if (job) {
            return this.mapJobToTaskInfo(job);
          }
        } catch {
          // 继续查找下一个队列
        }
      }
      return null;
    } catch (error) {
      logger.error({ error, taskId }, "获取任务详情失败");
      return null;
    }
  }

  /**
   * 将 pg-boss 的任务状态映射到我们的 TaskStatus
   */
  private mapPgBossStateToTaskStatus(state: string): TaskStatus {
    switch (state) {
      case "created":
        return "created";
      case "retry":
        return "retry";
      case "active":
        return "active";
      case "completed":
        return "completed";
      case "expired":
        return "expired";
      case "cancelled":
        return "cancelled";
      case "failed":
        return "failed";
      default:
        return "created";
    }
  }

  /**
   * 将我们的 TaskStatus 映射到 pg-boss 的状态
   */
  private mapTaskStatusToPgBossState(status: TaskStatus): string {
    return status;
  }

  /**
   * 将 pg-boss 的 Job 对象映射到 TaskInfo
   */
  private mapJobToTaskInfo(job: { id: string; name: string; data?: unknown; state?: string; createdon?: Date; startedon?: Date; completedon?: Date; failedon?: Date; retrylimit?: number; retrycount?: number; output?: unknown }): TaskInfo {
    const state = (job.state || "created") as TaskStatus;
    return {
      id: job.id,
      name: job.name,
      data: job.data,
      status: this.mapPgBossStateToTaskStatus(state),
      createdOn: job.createdon ? new Date(job.createdon) : undefined,
      startedOn: job.startedon ? new Date(job.startedon) : undefined,
      completedOn: job.completedon ? new Date(job.completedon) : undefined,
      failedOn: job.failedon ? new Date(job.failedon) : undefined,
      retries: job.retrycount || 0,
      output: job.output,
      error: state === "failed" && job.output ? JSON.stringify(job.output) : undefined,
    };
  }

  /**
   * 根据排序字段获取任务时间
   */
  private getTaskTime(task: TaskInfo, orderBy: "created" | "started" | "completed"): Date {
    switch (orderBy) {
      case "created":
        return task.createdOn || new Date(0);
      case "started":
        return task.startedOn || task.createdOn || new Date(0);
      case "completed":
        return task.completedOn || task.failedOn || task.createdOn || new Date(0);
      default:
        return task.createdOn || new Date(0);
    }
  }

  async close(): Promise<void> {
    if (this.boss) {
      await this.boss.stop();
      this.boss = null;
      logger.info("适配器已关闭");
    }
  }
}
