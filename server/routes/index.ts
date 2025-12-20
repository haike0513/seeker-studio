/**
 * 路由统一导出
 */

import { Hono } from "hono";
import authRoutes from "./auth.routes";
import chatRoutes from "./chat.routes";
import todoRoutes from "./todo.routes";
import fileRoutes from "./file.routes";
import workflowRoutes from "./workflow.routes";
import workflowExecutionRoutes from "./workflow-execution.routes";
import knowledgeBaseRoutes from "./knowledge-base.routes";
import queueRoutes from "./queue.routes";
import newsRoutes from "./news.routes";
import whiteboardRoutes from "./whiteboard.routes";

/**
 * 注册所有路由
 */
export function registerRoutes(app: Hono): void {
  // 认证路由（必须在其他路由之前）
  app.route("/", authRoutes);
  
  // 文件上传路由
  app.route("/", fileRoutes);
  
  // 聊天路由
  app.route("/", chatRoutes);
  
  // Todo 路由
  app.route("/", todoRoutes);
  
  // 工作流路由
  app.route("/", workflowRoutes);
  
  // 工作流执行路由
  app.route("/", workflowExecutionRoutes);
  
  // 知识库路由
  app.route("/", knowledgeBaseRoutes);
  
  // 新闻路由
  app.route("/", newsRoutes);
  
  // 任务队列路由
  app.route("/", queueRoutes);
  
  // 画板路由
  app.route("/", whiteboardRoutes);
}
