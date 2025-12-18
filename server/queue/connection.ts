/**
 * RabbitMQ 连接管理
 */

import type { Channel } from "amqplib";
import { connect, type IAmqpConnectionManager, type ChannelWrapper } from "amqp-connection-manager";
import { getAppConfig } from "../config/index.js";

let connectionManager: IAmqpConnectionManager | null = null;

/**
 * 获取或创建连接管理器
 */
export function getConnectionManager(): IAmqpConnectionManager {
  if (!connectionManager) {
    const config = getAppConfig();
    const url = config.rabbitmq.url;

    console.log(`🔌 连接到 RabbitMQ: ${url.replace(/:[^:]*@/, ":****@")}`);

    connectionManager = connect([url], {
      reconnectTimeInSeconds: 5,
      heartbeatIntervalInSeconds: 5,
    });

    connectionManager.on("connect", () => {
      console.log("✅ RabbitMQ 连接成功");
    });

    connectionManager.on("disconnect", ({ err }) => {
      console.error("❌ RabbitMQ 连接断开:", err?.message || "未知错误");
    });

    connectionManager.on("connectFailed", ({ err }) => {
      console.error("❌ RabbitMQ 连接失败:", err?.message || "未知错误");
    });
  }

  return connectionManager;
}

/**
 * 创建通道
 */
export function createChannel(): ChannelWrapper {
  const manager = getConnectionManager();
  return manager.createChannel({
    json: false,
    setup: async (channel: Channel) => {
      // 设置 QoS（每次只处理一条消息）
      await channel.prefetch(1);
    },
  });
}

/**
 * 关闭连接
 */
export async function closeConnection(): Promise<void> {
  if (connectionManager) {
    await connectionManager.close();
    connectionManager = null;
    console.log("🔌 RabbitMQ 连接已关闭");
  }
}

