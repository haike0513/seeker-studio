/**
 * 工作流相关类型定义
 */

/**
 * 工作流节点类型
 */
export type WorkflowNodeType =
  | "start" // 开始节点
  | "end" // 结束节点
  | "llm" // LLM 节点
  | "condition" // 条件判断节点
  | "http" // HTTP 请求节点
  | "code" // 代码执行节点
  | "parameter" // 参数提取节点
  | "template" // 模板转换节点
  | "knowledge_retrieval" // 知识检索节点
  | "comment" // 备注说明节点
  | "delay" // 延时节点
  | "sub_workflow"; // 子工作流调用节点

/**
 * 工作流节点位置
 */
export interface NodePosition {
  x: number;
  y: number;
}

/**
 * LLM 节点配置
 */
export interface LLMNodeConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  userPrompt?: string;
  variables?: string[]; // 使用的变量列表
}

/**
 * 条件判断节点配置
 */
export interface ConditionNodeConfig {
  condition: string; // 条件表达式，如 "{{input.value}} > 10"
  trueLabel?: string;
  falseLabel?: string;
}

/**
 * HTTP 请求节点配置
 */
export interface HTTPNodeConfig {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  url: string;
  headers?: Record<string, string>;
  body?: string; // JSON 字符串或模板
  timeout?: number;
}

/**
 * 代码执行节点配置
 */
export interface CodeNodeConfig {
  language: "python" | "javascript";
  code: string;
  timeout?: number;
}

/**
 * 参数提取节点配置
 */
export interface ParameterNodeConfig {
  parameters: Array<{
    name: string;
    type: "string" | "number" | "boolean" | "object" | "array";
    path?: string; // JSONPath 或提取路径
    defaultValue?: unknown;
  }>;
}

/**
 * 模板转换节点配置
 */
export interface TemplateNodeConfig {
  template: string; // Jinja2 模板
  outputFormat?: "json" | "text";
}

/**
 * 知识检索节点配置
 */
export interface KnowledgeRetrievalNodeConfig {
  knowledgeBaseId: string;
  query: string; // 检索查询（支持模板变量）
  topK?: number;
  scoreThreshold?: number;
  filters?: Record<string, unknown>;
}

/**
 * 备注说明节点配置
 */
export interface CommentNodeConfig {
  text: string;
}

/**
 * 延时节点配置
 */
export interface DelayNodeConfig {
  delayMs: number;
}

/**
 * 子工作流调用节点配置
 */
export interface SubWorkflowNodeConfig {
  workflowId: string;
  mode?: "call" | "embed";
}

/**
 * 工作流节点
 */
export interface WorkflowNode {
  id: string;
  workflowId: string;
  type: WorkflowNodeType;
  title: string;
  position: NodePosition;
  config?:
    | LLMNodeConfig
    | ConditionNodeConfig
    | HTTPNodeConfig
    | CodeNodeConfig
    | ParameterNodeConfig
    | TemplateNodeConfig
    | KnowledgeRetrievalNodeConfig
    | CommentNodeConfig
    | DelayNodeConfig
    | SubWorkflowNodeConfig;
  data?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 工作流边
 */
export interface WorkflowEdge {
  id: string;
  workflowId: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  config?: {
    condition?: string;
    label?: string;
  };
  createdAt: Date;
}

/**
 * 工作流
 */
export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  config?: {
    version?: string;
    variables?: Record<string, unknown>;
    settings?: Record<string, unknown>;
  };
  enabled: boolean;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 工作流执行状态
 */
export type WorkflowExecutionStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

/**
 * 工作流执行记录
 */
export interface WorkflowExecution {
  id: string;
  workflowId: string;
  userId: string;
  status: WorkflowExecutionStatus;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

/**
 * 工作流节点执行记录
 */
export interface WorkflowNodeExecution {
  id: string;
  executionId: string;
  nodeId: string;
  status: WorkflowExecutionStatus;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

/**
 * 创建工作流请求
 */
export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  config?: Workflow["config"];
  nodes?: Omit<WorkflowNode, "id" | "workflowId" | "createdAt" | "updatedAt">[];
  edges?: Omit<WorkflowEdge, "id" | "workflowId" | "createdAt">[];
}

/**
 * 更新工作流请求
 */
export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  config?: Workflow["config"];
  enabled?: boolean;
  isPublic?: boolean;
  nodes?: Omit<WorkflowNode, "id" | "workflowId" | "createdAt" | "updatedAt">[];
  edges?: Omit<WorkflowEdge, "id" | "workflowId" | "createdAt">[];
}

/**
 * 执行工作流请求
 */
export interface ExecuteWorkflowRequest {
  input?: Record<string, unknown>;
}
