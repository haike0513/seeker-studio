/**
 * 知识检索节点执行器
 */

import type { WorkflowNode, KnowledgeRetrievalNodeConfig } from "@/types/workflow";
import { searchKnowledgeBase, keywordSearch } from "../knowledge-search.service";
import { getKnowledgeBase } from "../knowledge-base.service";

export async function executeKnowledgeRetrievalNode(
  node: WorkflowNode,
  input: Record<string, unknown>,
  userId: string,
): Promise<Record<string, unknown>> {
  const config = node.config as KnowledgeRetrievalNodeConfig;
  if (!config || !config.knowledgeBaseId || !config.query) {
    throw new Error("知识检索节点配置缺失");
  }

  // 替换查询中的模板变量
  const query = replaceTemplateVariables(config.query, input);

  // 获取知识库配置
  const kb = await getKnowledgeBase(config.knowledgeBaseId, userId);
  if (!kb) {
    throw new Error("知识库不存在");
  }

  // 执行检索
  let results;
  if (kb.indexingMethod === "vector" || kb.indexingMethod === "hybrid") {
    try {
      results = await searchKnowledgeBase(config.knowledgeBaseId, {
        query,
        topK: config.topK || 5,
        scoreThreshold: config.scoreThreshold || 0.7,
        filters: config.filters,
      });
    } catch (error) {
      // 如果向量检索失败，回退到关键词检索
      console.warn("Vector search failed, falling back to keyword search:", error);
      results = await keywordSearch(config.knowledgeBaseId, {
        query,
        topK: config.topK || 5,
      });
    }
  } else {
    results = await keywordSearch(config.knowledgeBaseId, {
      query,
      topK: config.topK || 5,
    });
  }

  return {
    ...input,
    retrievalResults: results,
    retrievalCount: results.length,
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
