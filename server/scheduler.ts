/**
 * 新闻任务处理器注册
 * 将新闻同步任务从定时任务改为手动触发
 */

import { fetchAndSaveNews } from "./services/news.service.js";
import { createQueue, registerConsumer } from "./queue/task-manager.js";
import { logger } from "./utils/logger.js";
import type { TaskMessage } from "./queue/types.js";

/**
 * 注册新闻同步任务处理器
 * 当有任务被调度到 "news-fetcher" 队列时，会执行此处理器
 */
export async function registerNewsTaskHandler(): Promise<void> {
  // 先创建队列（确保队列存在）
  await createQueue("news-fetcher");

  // 定义任务处理器
  const newsHandler = async (message: TaskMessage): Promise<void> => {
    logger.info({ message }, "开始执行新闻同步任务");
    await fetchAndSaveNews();
    logger.info("新闻同步任务执行完成");
  };

  // 注册任务消费者
  await registerConsumer("news-fetcher", newsHandler);

  logger.info("新闻同步任务处理器已注册");
}

