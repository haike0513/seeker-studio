/**
 * 服务器配置管理
 */

/**
 * 应用配置
 */
export interface AppConfig {
  port: number;
  env: "development" | "production" | "test";
  database: {
    url: string;
  };
  auth: {
    url: string;
    secret: string;
    trustedOrigins?: string[];
  };
  news: {
    apiUrl?: string;
    apiKey?: string;
  };
  openai: {
    apiKey?: string;
  };
  rabbitmq: {
    url: string;
    queuePrefix?: string;
  };
  queue: {
    type: "rabbitmq" | "pgboss" | "pg-boss";
    queuePrefix?: string;
  };
}

/**
 * 获取应用配置
 */
export function getAppConfig(): AppConfig {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const env = (process.env.NODE_ENV || "development") as AppConfig["env"];

  return {
    port,
    env,
    database: {
      url: process.env.DATABASE_URL || "",
    },
    auth: {
      url: process.env.BETTER_AUTH_URL || "http://localhost:3000",
      secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-change-this",
      trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS
        ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
        : undefined,
    },
    news: {
      apiUrl: process.env.NEWS_API_URL,
      apiKey: process.env.NEWS_API_KEY,
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
    },
    rabbitmq: {
      url: process.env.RABBITMQ_URL || "amqp://localhost:5672",
      queuePrefix: process.env.RABBITMQ_QUEUE_PREFIX,
    },
    queue: {
      type: (process.env.QUEUE_TYPE || "pgboss") as "rabbitmq" | "pgboss" | "pg-boss",
      queuePrefix: process.env.QUEUE_PREFIX || process.env.RABBITMQ_QUEUE_PREFIX,
    },
  };
}

/**
 * 验证必需的配置项
 */
export function validateConfig(config: AppConfig): void {
  if (!config.database.url) {
    throw new Error("DATABASE_URL is required");
  }
  if (!config.auth.secret || config.auth.secret === "your-secret-key-change-this") {
    if (config.env === "production") {
      throw new Error("BETTER_AUTH_SECRET must be set in production");
    }
  }
}
