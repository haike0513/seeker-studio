/**
 * Better Auth 配置
 * Based on: https://www.better-auth.com/llms.txt/docs/adapters/drizzle.md
 */

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { multiSession } from "better-auth/plugins";
import { db } from "../database/drizzle/db";
import * as schema from "../database/drizzle/schema/index";
import { getAppConfig } from "./config/index";
import { createChildLogger } from "./utils/logger.js";

const logger = createChildLogger({ component: "better-auth" });

const config = getAppConfig();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  // Base URL for your application
  baseURL: config.auth.url,
  // Secret key for signing tokens
  secret: config.auth.secret,
  // Trust proxy if behind a reverse proxy
  trustedOrigins: config.auth.trustedOrigins,
  // Enable multi-session plugin to allow multiple active sessions per user
  plugins: [multiSession()],
  logger: {
    level: "debug",
    disabled: false,
    error: (...args: unknown[]) => {
      logger.error({ args }, "Better Auth error");
    },
    info: (...args: unknown[]) => {
      logger.info({ args }, "Better Auth info");
    },
    warn: (...args: unknown[]) => {
      logger.warn({ args }, "Better Auth warn");
    },
    debug: (...args: unknown[]) => {
      logger.debug({ args }, "Better Auth debug");
    },
  },
});

// Export auth handler for Hono
export const authHandler = auth.handler;
