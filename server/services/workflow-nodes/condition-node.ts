/**
 * 条件判断节点执行器
 */

import type { WorkflowNode, ConditionNodeConfig } from "@/types/workflow";

export async function executeConditionNode(
  node: WorkflowNode,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const config = node.config as ConditionNodeConfig;
  if (!config || !config.condition) {
    throw new Error("条件节点配置缺失");
  }

  // 解析条件表达式
  const result = evaluateCondition(config.condition, input);

  return {
    ...input,
    conditionResult: result,
  };
}

/**
 * 评估条件表达式
 */
function evaluateCondition(
  condition: string,
  data: Record<string, unknown>,
): boolean {
  try {
    // 替换变量
    const expression = condition.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = getNestedValue(data, path);
      if (value === undefined) {
        return "undefined";
      }
      if (typeof value === "string") {
        return `"${value}"`;
      }
      return String(value);
    });

    // 简单的表达式求值（注意：生产环境应使用更安全的表达式解析器）
    // 这里使用 Function 构造器，实际生产环境应使用更安全的方法
     
    return new Function(`return ${expression}`)() as boolean;
  } catch (error) {
    console.error("Condition evaluation error:", error);
    return false;
  }
}

/**
 * 获取嵌套值
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((current: any, key) => {
    return current && typeof current === "object" ? current[key] : undefined;
  }, obj);
}
