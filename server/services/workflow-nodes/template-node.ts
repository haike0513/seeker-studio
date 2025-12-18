/**
 * 模板转换节点执行器
 */

import type { WorkflowNode, TemplateNodeConfig } from "@/types/workflow";

export async function executeTemplateNode(
  node: WorkflowNode,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const config = node.config as TemplateNodeConfig;
  if (!config || !config.template) {
    throw new Error("模板节点配置缺失");
  }

  // 简单的模板替换（实际应使用 Jinja2 库）
  let result = replaceTemplateVariables(config.template, input);

  // 如果输出格式是 JSON，尝试解析
  if (config.outputFormat === "json") {
    try {
      result = JSON.parse(result);
    } catch {
      // 如果解析失败，保持原样
    }
  }

  return {
    ...input,
    output: result,
  };
}

/**
 * 替换模板变量（简单的 {{variable}} 替换）
 * 注意：实际生产环境应使用真正的 Jinja2 实现
 */
function replaceTemplateVariables(
  template: string,
  data: Record<string, unknown>,
): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
    const value = getNestedValue(data, path);
    if (value === undefined) {
      return match;
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
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
