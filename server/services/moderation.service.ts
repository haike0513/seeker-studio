/**
 * 内容审核服务
 * 使用 OpenAI Moderation API 进行内容审核
 */

import { getAppConfig } from "../config/index";

export interface ModerationResult {
  flagged: boolean;
  categories: {
    hate: boolean;
    "hate/threatening": boolean;
    "self-harm": boolean;
    sexual: boolean;
    "sexual/minors": boolean;
    violence: boolean;
    "violence/graphic": boolean;
  };
  categoryScores: {
    hate: number;
    "hate/threatening": number;
    "self-harm": number;
    sexual: number;
    "sexual/minors": number;
    violence: number;
    "violence/graphic": number;
  };
}

/**
 * 审核文本内容
 */
export async function moderateContent(
  text: string,
): Promise<ModerationResult> {
  try {
    const config = getAppConfig();
    const apiKey = config.openai.apiKey;

    if (!apiKey) {
      // 如果没有配置 API Key，返回未标记
      return {
        flagged: false,
        categories: {
          hate: false,
          "hate/threatening": false,
          "self-harm": false,
          sexual: false,
          "sexual/minors": false,
          violence: false,
          "violence/graphic": false,
        },
        categoryScores: {
          hate: 0,
          "hate/threatening": 0,
          "self-harm": 0,
          sexual: 0,
          "sexual/minors": 0,
          violence: 0,
          "violence/graphic": 0,
        },
      };
    }

    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI Moderation API error: ${response.statusText}`);
    }

    const data = await response.json();
    const result = data.results?.[0];

    if (!result) {
      throw new Error("Invalid moderation API response");
    }

    return {
      flagged: result.flagged || false,
      categories: result.categories || {},
      categoryScores: result.category_scores || {},
    };
  } catch (error) {
    console.error("Moderation error:", error);
    // 发生错误时，返回未标记（允许内容通过）
    return {
      flagged: false,
      categories: {
        hate: false,
        "hate/threatening": false,
        "self-harm": false,
        sexual: false,
        "sexual/minors": false,
        violence: false,
        "violence/graphic": false,
      },
      categoryScores: {
        hate: 0,
        "hate/threatening": 0,
        "self-harm": 0,
        sexual: 0,
        "sexual/minors": 0,
        violence: 0,
        "violence/graphic": 0,
      },
    };
  }
}

/**
 * 获取被标记的类别列表
 */
export function getFlaggedCategories(result: ModerationResult): string[] {
  const categories: string[] = [];
  const categoryLabels: Record<string, string> = {
    hate: "仇恨言论",
    "hate/threatening": "威胁性仇恨言论",
    "self-harm": "自残内容",
    sexual: "性内容",
    "sexual/minors": "涉及未成年人的性内容",
    violence: "暴力内容",
    "violence/graphic": "图形暴力内容",
  };

  Object.entries(result.categories).forEach(([key, flagged]) => {
    if (flagged) {
      categories.push(categoryLabels[key] || key);
    }
  });

  return categories;
}
