/**
 * 服务器入口文件
 */

import "dotenv/config";
import { Hono } from "hono";
import { apply, serve } from "@photonjs/hono";
import { dbMiddleware } from "./db-middleware.js";
import { createTodoHandler } from "./routes/todo.routes.js";
import { registerRoutes } from "./routes/index.js";
import { registerNewsTaskHandler } from "./scheduler.js";
import { getAppConfig, validateConfig } from "./config/index.js";
import { setupQueues } from "./queue/setup.js";
import { initializeQueue, closeQueue } from "./queue/task-manager.js";
import { logger } from "./utils/logger.js";

// 加载并验证配置
const config = getAppConfig();
try {
  validateConfig(config);
} catch (error) {
  logger.error({ error }, "配置验证失败");
  throw error;
}

// 创建 Hono 应用
const app = new Hono();

// 注册路由（认证路由必须在最前面）
registerRoutes(app);

// 应用中间件
apply(app, [
  // 使数据库在 Context 中可用（作为 `context.db`）
  dbMiddleware,
  // Todo 处理器（使用 Universal Middleware）
  createTodoHandler,
]);

// 初始化队列系统
async function initializeQueues() {
  try {
    // 初始化队列适配器（RabbitMQ 或 pg-boss）
    await initializeQueue();

    // 初始化队列和交换机（仅 RabbitMQ 需要）
    await setupQueues();

    // 注册新闻同步任务处理器（用于处理手动触发的任务）
    if (config.env === "production" || config.env === "development") {
      try {
        await registerNewsTaskHandler();
      } catch (error) {
        logger.error({ error }, "注册新闻任务处理器失败");
        // 在开发环境中，只记录警告而不中断启动
        if (config.env === "development") {
          logger.warn(
            "新闻任务处理器注册失败，但服务器继续运行。请检查队列服务是否正常运行。"
          );
        } else {
          // 在生产环境中，如果处理器注册失败，记录错误但不中断服务器
          logger.error("新闻任务处理器注册失败，服务器继续运行");
        }
      }
    }
  } catch (error) {
    logger.error({ error }, "初始化队列失败");
    // 在开发环境中，如果队列服务未运行，只记录警告
    if (config.env === "development") {
      const queueType = config.queue?.type || "pgboss";
      logger.warn(
        {
          queueType,
          service: queueType === "rabbitmq" ? "RabbitMQ" : "PostgreSQL",
        },
        "在开发环境中，如果队列服务未运行，定时任务将无法工作"
      );
      logger.warn("服务器将继续运行，但定时任务功能可能不可用");
    } else {
      // 在生产环境中，记录错误但继续运行（避免因队列问题导致服务器无法启动）
      logger.error("队列初始化失败，服务器继续运行");
    }
  }
}

// 初始化队列（异步）
initializeQueues();

// 优雅关闭处理
process.on("SIGTERM", async () => {
  logger.info("收到 SIGTERM 信号，正在关闭...");
  await closeQueue();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("收到 SIGINT 信号，正在关闭...");
  await closeQueue();
  process.exit(0);
});

// 导出服务器对象（Photon 运行时要求默认导出必须是对象）
export default serve(app, {
  port: config.port,
});
