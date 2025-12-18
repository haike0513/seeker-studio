/**
 * 队列适配器工厂
 * 根据配置创建相应的队列适配器实例
 */

import { getAppConfig } from "../config/index.js";
import { RabbitMQAdapter } from "./adapters/rabbitmq.adapter.js";
import { PgBossAdapter } from "./adapters/pgboss.adapter.js";
import type { QueueAdapter } from "./adapter.js";

/**
 * 创建队列适配器实例
 */
export function createQueueAdapter(): QueueAdapter {
  const config = getAppConfig();
  const queueType = config.queue?.type || "pgboss";

  switch (queueType) {
    case "rabbitmq":
      return new RabbitMQAdapter();
    case "pgboss":
    case "pg-boss":
      return new PgBossAdapter();
    default:
      throw new Error(
        `不支持的队列类型: ${queueType}。支持的类型: rabbitmq, pgboss`
      );
  }
}

/**
 * 获取当前使用的队列类型
 */
export function getQueueType(): "rabbitmq" | "pgboss" {
  const config = getAppConfig();
  const queueType = config.queue?.type || "pgboss";

  if (queueType === "pgboss" || queueType === "pg-boss") {
    return "pgboss";
  }

  return "rabbitmq";
}

