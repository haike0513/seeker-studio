/**
 * 工作流节点注册表与插件化接口
 *
 * - 统一管理所有可用的工作流节点类型（内置 + 自定义）
 * - 为节点面板（Palette）与配置面板提供元信息
 * - 方便后续第三方以“注册”的方式扩展自定义节点
 */

import type { Component } from "solid-js";
import type {
  WorkflowNodeType,
  LLMNodeConfig,
  ConditionNodeConfig,
  HTTPNodeConfig,
  CodeNodeConfig,
  ParameterNodeConfig,
  TemplateNodeConfig,
  KnowledgeRetrievalNodeConfig,
  CommentNodeConfig,
  DelayNodeConfig,
  SubWorkflowNodeConfig,
} from "@/types/workflow";
import { LLMNodeConfig as LLMNodeConfigComponent } from "./node-configs/LLMNodeConfig";
import { ConditionNodeConfig as ConditionNodeConfigComponent } from "./node-configs/ConditionNodeConfig";
import { HTTPNodeConfig as HTTPNodeConfigComponent } from "./node-configs/HTTPNodeConfig";
import { CodeNodeConfig as CodeNodeConfigComponent } from "./node-configs/CodeNodeConfig";
import { ParameterNodeConfig as ParameterNodeConfigComponent } from "./node-configs/ParameterNodeConfig";
import { TemplateNodeConfig as TemplateNodeConfigComponent } from "./node-configs/TemplateNodeConfig";
import { KnowledgeRetrievalNodeConfig as KnowledgeRetrievalNodeConfigComponent } from "./node-configs/KnowledgeRetrievalNodeConfig";
import { CommentNodeConfig as CommentNodeConfigComponent } from "./node-configs/CommentNodeConfig";
import { DelayNodeConfig as DelayNodeConfigComponent } from "./node-configs/DelayNodeConfig";
import { SubWorkflowNodeConfig as SubWorkflowNodeConfigComponent } from "./node-configs/SubWorkflowNodeConfig";

/**
 * 节点配置组件的统一 Props 约定
 *
 * 为了兼容已有实现，这里直接沿用现有的 `{ config?: T; onUpdate: (config: T) => void }` 约定，
 * 而不是重新设计一套新的 `value / onChange` 接口。
 */
export type NodeConfigComponent<TConfig> = Component<{
  config?: TConfig;
  onUpdate: (config: TConfig) => void;
}>;

/**
 * 单个工作流节点类型的定义
 *
 * 插件作者只需要实现并注册这个 Definition，即可：
 * - 出现在节点面板中
 * - 在配置面板中渲染自己的配置 UI
 * - 在创建节点时提供默认标题 / 默认配置
 */
export interface WorkflowNodeDefinition<TConfig = unknown> {
  /** 节点类型，对应后端的 WorkflowNodeType */
  type: WorkflowNodeType;
  /** 展示名称，用于节点面板与属性面板 */
  label: string;
  /** 图标（可以是 emoji 或未来扩展为 JSX.Element） */
  icon?: string;
  /** 分类，用于节点面板分组展示 */
  category?: string;
  /** 简要描述 */
  description?: string;

  /** 创建默认标题（例如 “LLM 节点”、“HTTP 请求” 等） */
  createDefaultTitle?: () => string;
  /** 创建默认配置（例如 LLM 默认模型 / HTTP 默认方法等） */
  createDefaultConfig?: () => TConfig;

  /**
   * 配置编辑组件：
   * - 如果提供，则在配置面板中渲染该组件
   * - 如果为空，则表示该节点无需额外配置
   */
  ConfigComponent?: NodeConfigComponent<TConfig>;
}

/**
 * 节点定义注册表
 */
const nodeDefinitions = new Map<WorkflowNodeType, WorkflowNodeDefinition<any>>();

/**
 * 注册单个节点类型
 *
 * - 如果存在同名节点，将被后注册的覆盖（方便 HMR 与覆盖内置实现）
 */
export function registerWorkflowNode<TConfig>(
  definition: WorkflowNodeDefinition<TConfig>,
) {
  nodeDefinitions.set(definition.type, definition as WorkflowNodeDefinition<any>);
}

/**
 * 按类型获取节点定义
 */
export function getWorkflowNodeDefinition(
  type: WorkflowNodeType,
): WorkflowNodeDefinition<any> | undefined {
  return nodeDefinitions.get(type);
}

/**
 * 获取当前已注册的所有节点定义列表
 */
export function listWorkflowNodeDefinitions(): WorkflowNodeDefinition<any>[] {
  return Array.from(nodeDefinitions.values());
}

/**
 * 内置节点定义
 *
 * 这些是系统预置的常用节点，第三方插件可以在此基础上做扩展。
 */
const builtinNodeDefinitions: WorkflowNodeDefinition<any>[] = [
  {
    type: "start",
    label: "开始",
    icon: "🚀",
    category: "基础",
    description: "工作流开始节点",
    createDefaultTitle: () => "开始",
  },
  {
    type: "end",
    label: "结束",
    icon: "🏁",
    category: "基础",
    description: "工作流结束节点",
    createDefaultTitle: () => "结束",
  },
  {
    type: "llm",
    label: "LLM 节点",
    icon: "🤖",
    category: "智能",
    description: "调用大语言模型生成内容或完成任务",
    createDefaultTitle: () => "LLM 节点",
    createDefaultConfig: (): LLMNodeConfig => ({
      model: "gpt-4o",
      temperature: 0.7,
      maxTokens: 1000,
    }),
    ConfigComponent: LLMNodeConfigComponent as NodeConfigComponent<LLMNodeConfig>,
  },
  {
    type: "condition",
    label: "条件判断",
    icon: "🔀",
    category: "控制流",
    description: "根据条件表达式选择不同分支",
    createDefaultTitle: () => "条件判断",
    createDefaultConfig: (): ConditionNodeConfig => ({
      condition: "{{input.value}} > 0",
      trueLabel: "是",
      falseLabel: "否",
    }),
    ConfigComponent: ConditionNodeConfigComponent as NodeConfigComponent<ConditionNodeConfig>,
  },
  {
    type: "http",
    label: "HTTP 请求",
    icon: "🌐",
    category: "外部服务",
    description: "调用外部 HTTP 接口",
    createDefaultTitle: () => "HTTP 请求",
    createDefaultConfig: (): HTTPNodeConfig => ({
      method: "GET",
      url: "https://api.example.com",
    }),
    ConfigComponent: HTTPNodeConfigComponent as NodeConfigComponent<HTTPNodeConfig>,
  },
  {
    type: "code",
    label: "代码执行",
    icon: "💻",
    category: "处理",
    description: "执行自定义代码进行复杂处理",
    createDefaultTitle: () => "代码执行",
    createDefaultConfig: (): CodeNodeConfig => ({
      language: "javascript",
      code: "// 在这里编写代码\nreturn input;",
    }),
    ConfigComponent: CodeNodeConfigComponent as NodeConfigComponent<CodeNodeConfig>,
  },
  {
    type: "parameter",
    label: "参数提取",
    icon: "📋",
    category: "数据",
    description: "从数据中提取参数供后续节点使用",
    createDefaultTitle: () => "参数提取",
    createDefaultConfig: (): ParameterNodeConfig => ({
      parameters: [],
    }),
    ConfigComponent: ParameterNodeConfigComponent as NodeConfigComponent<ParameterNodeConfig>,
  },
  {
    type: "template",
    label: "模板转换",
    icon: "📝",
    category: "数据",
    description: "使用模板语法对数据进行转换",
    createDefaultTitle: () => "模板转换",
    createDefaultConfig: (): TemplateNodeConfig => ({
      template: "{{input.text}}",
      outputFormat: "text",
    }),
    ConfigComponent: TemplateNodeConfigComponent as NodeConfigComponent<TemplateNodeConfig>,
  },
  {
    type: "knowledge_retrieval",
    label: "知识检索",
    icon: "🔍",
    category: "智能",
    description: "从知识库中检索相关信息",
    createDefaultTitle: () => "知识检索",
    createDefaultConfig: (): KnowledgeRetrievalNodeConfig => ({
      knowledgeBaseId: "",
      query: "",
      topK: 5,
      scoreThreshold: 0.7,
    }),
    ConfigComponent:
      KnowledgeRetrievalNodeConfigComponent as NodeConfigComponent<KnowledgeRetrievalNodeConfig>,
  },
  {
    type: "comment",
    label: "备注说明",
    icon: "💬",
    category: "辅助",
    description: "为流程添加说明、注释或调试备注",
    createDefaultTitle: () => "备注说明",
    createDefaultConfig: (): CommentNodeConfig => ({
      text: "",
    }),
    ConfigComponent: CommentNodeConfigComponent as NodeConfigComponent<CommentNodeConfig>,
  },
  {
    type: "delay",
    label: "延时",
    icon: "⏱️",
    category: "控制流",
    description: "在继续执行前等待一段时间",
    createDefaultTitle: () => "延时",
    createDefaultConfig: (): DelayNodeConfig => ({
      delayMs: 1000,
    }),
    ConfigComponent: DelayNodeConfigComponent as NodeConfigComponent<DelayNodeConfig>,
  },
  {
    type: "sub_workflow",
    label: "子工作流",
    icon: "📦",
    category: "结构",
    description: "调用其他工作流，实现子流程复用",
    createDefaultTitle: () => "子工作流",
    createDefaultConfig: (): SubWorkflowNodeConfig => ({
      workflowId: "",
      mode: "call",
    }),
    ConfigComponent:
      SubWorkflowNodeConfigComponent as NodeConfigComponent<SubWorkflowNodeConfig>,
  },
];

// 模块加载时自动注册内置节点，支持 HMR 场景下的重复注册（后注册覆盖前注册）。
for (const def of builtinNodeDefinitions) {
  registerWorkflowNode(def);
}


