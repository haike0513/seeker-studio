/**
 * HTTP 请求节点执行器
 */

import type { WorkflowNode, HTTPNodeConfig } from "@/types/workflow";

export async function executeHTTPNode(
  node: WorkflowNode,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const config = node.config as HTTPNodeConfig;
  if (!config || !config.url) {
    throw new Error("HTTP 节点配置缺失");
  }

  // 替换 URL 中的模板变量
  const url = replaceTemplateVariables(config.url, input);

  // 替换请求头中的模板变量
  const headers: Record<string, string> = {};
  if (config.headers) {
    Object.entries(config.headers).forEach(([key, value]) => {
      headers[key] = replaceTemplateVariables(value, input);
    });
  }

  // 替换请求体中的模板变量
  let body: string | undefined;
  if (config.body) {
    body = replaceTemplateVariables(config.body, input);
  }

  // 发送 HTTP 请求
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    config.timeout || 30000,
  );

  try {
    const response = await fetch(url, {
      method: config.method,
      headers,
      body: body && config.method !== "GET" ? body : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseData = await response.text();
    let parsedData: unknown = responseData;

    // 尝试解析 JSON
    try {
      parsedData = JSON.parse(responseData);
    } catch {
      // 如果不是 JSON，保持原样
    }

    return {
      ...input,
      output: parsedData,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`HTTP 请求超时 (${config.timeout || 30000}ms)`);
    }
    throw error;
  }
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
