/**
 * 参数提取节点执行器
 */

import type { WorkflowNode, ParameterNodeConfig } from "@/types/workflow";

export async function executeParameterNode(
  node: WorkflowNode,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const config = node.config as ParameterNodeConfig;
  if (!config || !config.parameters) {
    throw new Error("参数提取节点配置缺失");
  }

  const extracted: Record<string, unknown> = {};

  config.parameters.forEach((param) => {
    let value: unknown;

    if (param.path) {
      // 使用路径提取值
      value = extractByPath(input, param.path);
    } else {
      // 使用参数名直接提取
      value = input[param.name];
    }

    // 如果值为 undefined，使用默认值
    if (value === undefined && param.defaultValue !== undefined) {
      value = param.defaultValue;
    }

    // 类型转换
    if (value !== undefined) {
      value = convertType(value, param.type);
    }

    extracted[param.name] = value;
  });

  return {
    ...input,
    ...extracted,
  };
}

/**
 * 根据路径提取值（支持 JSONPath 或点号路径）
 */
function extractByPath(obj: Record<string, unknown>, path: string): unknown {
  // 简单的点号路径解析
  if (path.startsWith("$.")) {
    // JSONPath 格式
    path = path.slice(2);
  }

  return path.split(".").reduce((current: any, key) => {
    return current && typeof current === "object" ? current[key] : undefined;
  }, obj);
}

/**
 * 类型转换
 */
function convertType(value: unknown, targetType: string): unknown {
  switch (targetType) {
    case "string":
      return String(value);
    case "number":
      return Number(value);
    case "boolean":
      return Boolean(value);
    case "object":
      return typeof value === "object" ? value : JSON.parse(String(value));
    case "array":
      return Array.isArray(value) ? value : [value];
    default:
      return value;
  }
}
