/**
 * 后续建议生成服务
 * 基于上下文生成建议问题
 */

import { getAppConfig } from "../config/index";
import type { FollowUpSuggestion } from "@/types/chat";

/**
 * 基于对话上下文生成后续建议
 */
export async function generateSuggestions(
  conversationHistory: Array<{ role: string; content: string }>,
  maxSuggestions: number = 3,
): Promise<FollowUpSuggestion[]> {
  try {
    const config = getAppConfig();

    // 构建提示词
    const prompt = `基于以下对话历史，生成 ${maxSuggestions} 个相关的后续问题建议。要求：
1. 问题应该与对话内容相关
2. 问题应该简洁明了（不超过 20 个字）
3. 问题应该有助于深入对话
4. 返回 JSON 数组格式，每个元素包含 "text" 字段

对话历史：
${conversationHistory
  .slice(-5) // 只使用最近 5 条消息
  .map((msg) => `${msg.role}: ${msg.content}`)
  .join("\n")}

请返回 JSON 数组格式的建议问题：`;

    // 直接使用 OpenAI API 调用（更简单可靠）
    const apiKey = config.openai.apiKey || "";
    if (!apiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    // 调用 OpenAI Chat Completions API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const fullResponse = data.choices?.[0]?.message?.content || "";

    // 解析 JSON 响应
    try {
      const suggestions = JSON.parse(fullResponse) as Array<{ text: string }>;
      return suggestions
        .slice(0, maxSuggestions)
        .map((s) => ({ text: s.text, score: 1 }));
    } catch {
      // 如果 JSON 解析失败，尝试从文本中提取
      const lines = fullResponse
        .split("\n")
        .filter((line) => line.trim().length > 0 && line.trim().length < 50);
      return lines.slice(0, maxSuggestions).map((text) => ({
        text: text.replace(/^[-*•]\s*/, "").trim(),
        score: 1,
      }));
    }
  } catch (error) {
    console.error("Failed to generate suggestions:", error);
    // 返回默认建议
    return [
      { text: "请详细解释一下", score: 0.8 },
      { text: "还有其他方法吗？", score: 0.7 },
      { text: "能举个例子吗？", score: 0.6 },
    ];
  }
}
