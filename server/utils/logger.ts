/**
 * 日志工具模块
 * 使用 pino 提供结构化日志功能
 */

import pino from "pino";
import { getAppConfig } from "../config/index.js";

const config = getAppConfig();

/**
 * 创建日志器实例
 */
const createLogger = () => {
  const isDevelopment = config.env === "development";
  const isProduction = config.env === "production";

  // 开发环境使用 pretty 格式，生产环境使用 JSON 格式
  const transport = isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
          singleLine: false,
        },
      }
    : undefined;

  return pino(
    {
      level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
      base: {
        env: config.env,
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label) => {
          return { level: label };
        },
      },
    },
    transport ? pino.transport({ targets: [{ ...transport }] }) : undefined
  );
};

/**
 * 全局日志器实例
 */
export const logger = createLogger();

/**
 * 创建子日志器（带上下文）
 * @param context 上下文对象，会添加到所有日志中
 */
export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

/**
 * 导出日志级别类型
 */
export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

