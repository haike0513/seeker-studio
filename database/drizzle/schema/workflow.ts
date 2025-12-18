/**
 * 工作流 Schema
 * 定义工作流、节点、边的数据库结构
 */

import { pgTable, text, jsonb, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

/**
 * 工作流表
 */
export const workflow = pgTable("workflow", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  // 工作流配置（JSON）
  config: jsonb("config").$type<{
    version?: string;
    variables?: Record<string, unknown>;
    settings?: Record<string, unknown>;
  }>(),
  // 是否启用
  enabled: boolean("enabled").default(true),
  // 是否公开
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * 工作流节点表
 */
export const workflowNode = pgTable("workflow_node", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => workflow.id, { onDelete: "cascade" }),
  // 节点类型：llm, condition, http, code, parameter, template, start, end
  type: text("type").notNull(),
  // 节点标题
  title: text("title").notNull(),
  // 节点位置（x, y）
  position: jsonb("position").$type<{ x: number; y: number }>().notNull(),
  // 节点配置（根据类型不同而不同）
  config: jsonb("config").$type<Record<string, unknown>>(),
  // 节点数据（用于显示）
  data: jsonb("data").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * 工作流边表（连接）
 */
export const workflowEdge = pgTable("workflow_edge", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => workflow.id, { onDelete: "cascade" }),
  // 源节点 ID
  source: text("source")
    .notNull()
    .references(() => workflowNode.id, { onDelete: "cascade" }),
  // 目标节点 ID
  target: text("target")
    .notNull()
    .references(() => workflowNode.id, { onDelete: "cascade" }),
  // 源句柄（输出端口）
  sourceHandle: text("source_handle"),
  // 目标句柄（输入端口）
  targetHandle: text("target_handle"),
  // 边配置
  config: jsonb("config").$type<{
    condition?: string; // 条件边的条件表达式
    label?: string; // 边的标签
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * 工作流执行记录表
 */
export const workflowExecution = pgTable("workflow_execution", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id")
    .notNull()
    .references(() => workflow.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // 执行状态：pending, running, completed, failed, cancelled
  status: text("status").notNull().default("pending"),
  // 输入数据
  input: jsonb("input").$type<Record<string, unknown>>(),
  // 输出数据
  output: jsonb("output").$type<Record<string, unknown>>(),
  // 错误信息
  error: text("error"),
  // 执行开始时间
  startedAt: timestamp("started_at"),
  // 执行结束时间
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * 工作流节点执行记录表
 */
export const workflowNodeExecution = pgTable("workflow_node_execution", {
  id: text("id").primaryKey(),
  executionId: text("execution_id")
    .notNull()
    .references(() => workflowExecution.id, { onDelete: "cascade" }),
  nodeId: text("node_id")
    .notNull()
    .references(() => workflowNode.id, { onDelete: "cascade" }),
  // 执行状态
  status: text("status").notNull().default("pending"),
  // 输入数据
  input: jsonb("input").$type<Record<string, unknown>>(),
  // 输出数据
  output: jsonb("output").$type<Record<string, unknown>>(),
  // 错误信息
  error: text("error"),
  // 执行开始时间
  startedAt: timestamp("started_at"),
  // 执行结束时间
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 关系定义
export const workflowRelations = relations(workflow, ({ one, many }) => ({
  user: one(user, {
    fields: [workflow.userId],
    references: [user.id],
  }),
  nodes: many(workflowNode),
  edges: many(workflowEdge),
  executions: many(workflowExecution),
}));

export const workflowNodeRelations = relations(workflowNode, ({ one, many }) => ({
  workflow: one(workflow, {
    fields: [workflowNode.workflowId],
    references: [workflow.id],
  }),
  sourceEdges: many(workflowEdge, {
    relationName: "sourceNode",
  }),
  targetEdges: many(workflowEdge, {
    relationName: "targetNode",
  }),
  executions: many(workflowNodeExecution),
}));

export const workflowEdgeRelations = relations(workflowEdge, ({ one }) => ({
  workflow: one(workflow, {
    fields: [workflowEdge.workflowId],
    references: [workflow.id],
  }),
  sourceNode: one(workflowNode, {
    fields: [workflowEdge.source],
    references: [workflowNode.id],
    relationName: "sourceNode",
  }),
  targetNode: one(workflowNode, {
    fields: [workflowEdge.target],
    references: [workflowNode.id],
    relationName: "targetNode",
  }),
}));

export const workflowExecutionRelations = relations(workflowExecution, ({ one, many }) => ({
  workflow: one(workflow, {
    fields: [workflowExecution.workflowId],
    references: [workflow.id],
  }),
  user: one(user, {
    fields: [workflowExecution.userId],
    references: [user.id],
  }),
  nodeExecutions: many(workflowNodeExecution),
}));

export const workflowNodeExecutionRelations = relations(workflowNodeExecution, ({ one }) => ({
  execution: one(workflowExecution, {
    fields: [workflowNodeExecution.executionId],
    references: [workflowExecution.id],
  }),
  node: one(workflowNode, {
    fields: [workflowNodeExecution.nodeId],
    references: [workflowNode.id],
  }),
}));
