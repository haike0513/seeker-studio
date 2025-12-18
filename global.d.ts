import type { db } from "./database/drizzle/db";

declare global {
  namespace Vike {
    interface PageContextServer {
      db: typeof db;
    }
    // 扩展 PageContext 而不是 PageContextServer，因为 user 会被传递到客户端
    interface PageContext {
      user?: {
        session: {
          id: string;
          expiresAt: Date;
          userId: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          [key: string]: any;
        } | null;
        user: {
          id: string;
          name: string;
          email: string;
          image: string | null;
          emailVerified: boolean;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          [key: string]: any;
        } | null;
      } | null;
    }
    interface Photon {
      // 选择你的服务器（用于正确的 pageContext.runtime 类型）
      server: "hono"; // | 'express' | 'fastify' | 'hattip' | 'srvx' | 'elysia' | 'h3'
    }
  }
}
