/**
 * LLM 节点执行器
 */

import { getAppConfig } from "../../config/index";
import { streamText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { WorkflowNode, LLMNodeConfig } from "@/types/workflow";

// OpenAI compatible provider (for LMStudio, etc.)
const lmstudioProvider = createOpenAICompatible({
  name: "lmstudio",
  baseURL: process.env.OPENAI_COMPATIBLE_BASE_URL || "http://localhost:1234/v1",
  apiKey: process.env.OPENAI_COMPATIBLE_API_KEY || "lm-studio",
});

export async function executeLLMNode(
  node: WorkflowNode,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const config = node.config as LLMNodeConfig;
  if (!config) {
    throw new Error("LLM 节点配置缺失");
  }

  // 替换模板变量
  const systemPrompt = replaceTemplateVariables(config.systemPrompt || "", input);
  const userPrompt = replaceTemplateVariables(config.userPrompt || "", input);

  // 构建消息
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: userPrompt });

  // 调用 LLM API
  const result = streamText({
    model: lmstudioProvider(config.model || "gpt-3.5-turbo"),
    messages,
  });

  // 获取完整响应文本
  const fullResponse = await result.text;

  return {
    ...input,
    output: fullResponse,
    model: config.model,
  };
}

/**
 * 替换模板变量
 */
function replaceTemplateVariables(
  template: string,
  data: Record<string, unknown>,
): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
    const value = getNestedValue(data, path);
    return value !== undefined ? String(value) : match;
  });
}

/**
 * 获取嵌套值
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current: any, key) => {
    return current && typeof current === "object" ? current[key] : undefined;
  }, obj);
}
