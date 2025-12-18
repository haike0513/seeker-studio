/**
 * 代码执行节点执行器
 */

import type { WorkflowNode, CodeNodeConfig } from "@/types/workflow";

export async function executeCodeNode(
  node: WorkflowNode,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const config = node.config as CodeNodeConfig;
  if (!config || !config.code) {
    throw new Error("代码节点配置缺失");
  }

  const { language, code, timeout = 30000 } = config;

  try {
    let result: unknown;

    if (language === "javascript") {
      result = await executeJavaScript(code, input, timeout);
    } else if (language === "python") {
      result = await executePython(code, input, timeout);
    } else {
      throw new Error(`不支持的编程语言: ${language}`);
    }

    return {
      ...input,
      output: result,
    };
  } catch (error) {
    throw new Error(
      `代码执行失败: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * 执行 JavaScript 代码
 */
async function executeJavaScript(
  code: string,
  input: Record<string, unknown>,
  timeout: number,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("代码执行超时"));
    }, timeout);

    try {
      // 使用 Function 构造器执行代码（注意：生产环境应使用更安全的方法，如 VM2）
       
      const func = new Function("input", `
        ${code}
      `);
      const result = func(input);
      
      clearTimeout(timer);
      
      // 处理 Promise
      if (result instanceof Promise) {
        result
          .then((value) => {
            clearTimeout(timer);
            resolve(value);
          })
          .catch((error) => {
            clearTimeout(timer);
            reject(error);
          });
      } else {
        resolve(result);
      }
    } catch (error) {
      clearTimeout(timer);
      reject(error);
    }
  });
}

/**
 * 执行 Python 代码
 * 注意：这需要 Python 运行时环境，实际实现可能需要调用外部 Python 进程或使用 Python 解释器
 */
async function executePython(
  code: string,
  input: Record<string, unknown>,
  timeout: number,
): Promise<unknown> {
  // TODO: 实现 Python 代码执行
  // 这可能需要：
  // 1. 调用外部 Python 进程
  // 2. 使用 Python 解释器库（如 pyodide）
  // 3. 使用 Docker 容器执行
  
  throw new Error("Python 代码执行尚未实现，需要配置 Python 运行时环境");
}
