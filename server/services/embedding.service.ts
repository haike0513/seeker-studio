/**
 * 嵌入模型服务
 * 生成文本的向量嵌入
 */

import { getAppConfig } from "../config/index";

/**
 * 生成文本嵌入
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const config = getAppConfig();
  const apiKey = config.openai.apiKey;

  if (!apiKey) {
    throw new Error("OpenAI API Key 未配置");
  }

  // 调用 OpenAI Embeddings API
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small", // 1536 维度
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI Embeddings API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding as number[];
}

/**
 * 批量生成文本嵌入
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const config = getAppConfig();
  const apiKey = config.openai.apiKey;

  if (!apiKey) {
    throw new Error("OpenAI API Key 未配置");
  }

  // 调用 OpenAI Embeddings API（支持批量）
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: texts,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI Embeddings API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.map((item: { embedding: number[] }) => item.embedding);
}
